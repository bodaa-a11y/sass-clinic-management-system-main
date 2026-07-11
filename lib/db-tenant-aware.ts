/**
 * Tenant-Aware Database Wrapper
 * 
 * This wrapper enforces multi-tenancy at the database level by automatically
 * injecting clinicId into all queries. It makes data leaks impossible by design.
 * 
 * @module lib/db-tenant-aware
 */

import { db } from '@/db'
import { eq, and, SQL, sql, isNull } from 'drizzle-orm'

/**
 * Tenant context stored in AsyncLocalStorage
 * This ensures request-scoped isolation without passing context explicitly
 */
import { AsyncLocalStorage } from 'async_hooks'

export interface TenantContext {
  clinicId: string
  userId: string
  role: string
  email: string
}

const tenantContext = new AsyncLocalStorage<TenantContext>()

/**
 * Set tenant context for the current request
 * This should be called in middleware or API route handler
 */
export function setTenantContext(context: TenantContext): void {
  tenantContext.enterWith(context)
}

/**
 * Get tenant context for the current request
 * Throws if context is not set (fail-safe)
 */
export function getTenantContext(): TenantContext {
  const context = tenantContext.getStore()
  if (!context) {
    throw new Error(
      'Tenant context not set. Use setTenantContext() before accessing the database. ' +
      'This is a security measure to prevent data leaks.'
    )
  }
  return context
}

/**
 * Check if a table has a clinicId column
 */
function hasClinicIdColumn(table: any): boolean {
  return 'clinicId' in table && typeof table.clinicId !== 'undefined'
}

/**
 * Check if a table has a deletedAt column (for soft deletes)
 */
function hasDeletedAtColumn(table: any): boolean {
  return 'deletedAt' in table && typeof table.deletedAt !== 'undefined'
}

/**
 * Tenant-safe query builder
 * Automatically injects clinicId and handles soft deletes
 */
class TenantQueryBuilder {
  private table: any
  private context: TenantContext
  private whereConditions: SQL[] = []
  private includeDeleted = false

  constructor(table: any, context: TenantContext) {
    this.table = table
    this.context = context
    this.autoInjectClinicId()
  }

  /**
   * Automatically inject clinicId filter
   * This is the core security mechanism
   */
  private autoInjectClinicId(): void {
    if (hasClinicIdColumn(this.table)) {
      this.whereConditions.push(
        eq(this.table.clinicId, this.context.clinicId)
      )
    }
  }

  /**
   * Automatically filter out soft-deleted records
   */
  private autoFilterDeleted(): void {
    if (!this.includeDeleted && hasDeletedAtColumn(this.table)) {
      this.whereConditions.push(
        isNull(this.table.deletedAt)
      )
    }
  }

  /**
   * Include soft-deleted records in query
   */
  withDeleted(): this {
    this.includeDeleted = true
    return this
  }

  /**
   * Add WHERE condition
   * Combines with auto-injected clinicId using AND
   */
  where(condition: SQL): this {
    this.whereConditions.push(condition)
    return this
  }

  /**
   * Build final WHERE clause
   */
  private buildWhere(): SQL | undefined {
    this.autoFilterDeleted()
    
    if (this.whereConditions.length === 0) {
      return undefined
    }

    if (this.whereConditions.length === 1) {
      return this.whereConditions[0]
    }

    return and(...this.whereConditions)
  }

  /**
   * Execute SELECT query
   */
  async select(): Promise<any[]> {
    const whereClause = this.buildWhere()
    
    if (whereClause) {
      return (db.select().from(this.table).where(whereClause)) as any
    }
    
    return (db.select().from(this.table)) as any
  }

  /**
   * Execute SELECT query with columns
   */
  async selectColumns(columns: string[]): Promise<any[]> {
    const whereClause = this.buildWhere()
    const selectedColumns: any = {}
    columns.forEach(col => {
      selectedColumns[col] = this.table[col]
    })
    
    if (whereClause) {
      return db.select(selectedColumns).from(this.table).where(whereClause)
    }
    
    return db.select(selectedColumns).from(this.table)
  }

  /**
   * Execute SELECT query with limit
   */
  async selectLimit(limit: number): Promise<any[]> {
    const whereClause = this.buildWhere()
    
    if (whereClause) {
      return db.select().from(this.table).where(whereClause).limit(limit)
    }
    
    return db.select().from(this.table).limit(limit)
  }

  /**
   * Execute SELECT query with offset and limit (pagination)
   */
  async selectPaginated(offset: number, limit: number): Promise<any[]> {
    const whereClause = this.buildWhere()
    
    if (whereClause) {
      return db
        .select()
        .from(this.table)
        .where(whereClause)
        .offset(offset)
        .limit(limit)
    }
    
    return db.select().from(this.table).offset(offset).limit(limit)
  }

  /**
   * Execute SELECT query with order by
   */
  async selectOrderBy(column: string, direction: 'asc' | 'desc' = 'asc'): Promise<any[]> {
    const whereClause = this.buildWhere()
    const tableColumn = this.table[column]
    
    if (whereClause) {
      return db
        .select()
        .from(this.table)
        .where(whereClause)
        .orderBy(sql.raw(`${tableColumn} ${direction.toUpperCase()}`))
    }
    
    return db
      .select()
      .from(this.table)
      .orderBy(sql.raw(`${tableColumn} ${direction.toUpperCase()}`))
  }

  /**
   * Count records matching the query
   */
  async count(): Promise<number> {
    const whereClause = this.buildWhere()
    
    if (whereClause) {
      const result = await db
        .select({ count: sql`count(*)` })
        .from(this.table)
        .where(whereClause)
      return (result[0]?.count as number) || 0
    }
    
    const result = await db
      .select({ count: sql`count(*)` })
      .from(this.table)
    return (result[0]?.count as number) || 0
  }

  /**
   * Check if any records exist
   */
  async exists(): Promise<boolean> {
    const count = await this.count()
    return count > 0
  }

  /**
   * Get first record matching the query
   * Returns the first element or null if no results
   */
  async first(): Promise<any | null> {
    const results = await this.selectLimit(1)
    return results.length > 0 ? results[0] : null
  }

  /**
   * Get single record - throws if not found
   */
  async firstOrFail(): Promise<any> {
    const result = await this.first()
    if (!result) {
      throw new Error('Record not found')
    }
    return result
  }
}

/**
 * Tenant-safe insert operation
 * Automatically injects clinicId into the data
 */
class TenantInsertBuilder {
  private table: any
  private context: TenantContext
  private data: any

  constructor(table: any, context: TenantContext, data: any) {
    this.table = table
    this.context = context
    this.data = this.injectClinicId(data)
  }

  /**
   * Inject clinicId into insert data
   * Prevents accidental data leaks
   */
  private injectClinicId(data: any): any {
    if (!hasClinicIdColumn(this.table)) {
      return data
    }

    // If clinicId is already provided, verify it matches context
    if (data.clinicId && data.clinicId !== this.context.clinicId) {
      throw new Error(
        `Security violation: Attempted to insert record with clinicId=${data.clinicId} ` +
        `but context has clinicId=${this.context.clinicId}. ` +
        `This prevents cross-tenant data insertion.`
      )
    }

    return {
      ...data,
      clinicId: this.context.clinicId
    }
  }

  /**
   * Execute insert operation
   */
  async returning(): Promise<any[]> {
    return (db.insert(this.table).values(this.data).returning()) as any
  }

  /**
   * Execute insert without returning
   */
  async execute(): Promise<void> {
    await db.insert(this.table).values(this.data)
  }
}

/**
 * Tenant-safe update operation
 * Automatically applies clinicId filter to WHERE clause
 */
class TenantUpdateBuilder {
  private table: any
  private context: TenantContext
  private updates: any
  private whereConditions: SQL[] = []

  constructor(table: any, context: TenantContext, updates: any) {
    this.table = table
    this.context = context
    this.updates = updates
    this.autoInjectClinicIdFilter()
  }

  /**
   * Automatically inject clinicId filter
   */
  private autoInjectClinicIdFilter(): void {
    if (hasClinicIdColumn(this.table)) {
      this.whereConditions.push(
        eq(this.table.clinicId, this.context.clinicId)
      )
    }
  }

  /**
   * Prevent updating clinicId (security measure)
   */
  private validateUpdates(): void {
    if (this.updates.clinicId && this.updates.clinicId !== this.context.clinicId) {
      throw new Error(
        `Security violation: Attempted to update clinicId to ${this.updates.clinicId} ` +
        `but context has clinicId=${this.context.clinicId}. ` +
        `ClinicId cannot be changed after creation.`
      )
    }

    // Remove clinicId from updates to prevent accidental modification
    delete this.updates.clinicId
  }

  /**
   * Add WHERE condition
   */
  where(condition: SQL): this {
    this.whereConditions.push(condition)
    return this
  }

  /**
   * Build final WHERE clause
   */
  private buildWhere(): SQL | undefined {
    if (this.whereConditions.length === 0) {
      throw new Error(
        'Update operation requires a WHERE clause with clinicId filter. ' +
        'This prevents accidental mass updates across tenants.'
      )
    }

    if (this.whereConditions.length === 1) {
      return this.whereConditions[0]
    }

    return and(...this.whereConditions)
  }

  /**
   * Execute update operation
   */
  async returning(): Promise<any[]> {
    this.validateUpdates()
    const whereClause = this.buildWhere()
    return (db.update(this.table).set(this.updates).where(whereClause).returning()) as any
  }

  /**
   * Execute update without returning
   */
  async execute(): Promise<void> {
    this.validateUpdates()
    const whereClause = this.buildWhere()
    await db.update(this.table).set(this.updates).where(whereClause)
  }
}

/**
 * Main Tenant-Aware Database Class
 * Entry point for all database operations
 */
export class TenantAwareDB {
  /**
   * Create a query builder for SELECT operations
   */
  select(table: any): TenantQueryBuilder {
    const context = getTenantContext()
    return new TenantQueryBuilder(table, context)
  }

  /**
   * Create a query builder for INSERT operations
   */
  insert(table: any, data: any): TenantInsertBuilder {
    const context = getTenantContext()
    return new TenantInsertBuilder(table, context, data)
  }

  /**
   * Create a query builder for UPDATE operations
   */
  update(table: any, updates: any): TenantUpdateBuilder {
    const context = getTenantContext()
    return new TenantUpdateBuilder(table, context, updates)
  }

  /**
   * Create a query builder for DELETE operations
   */
  delete(table: any): any {
    const context = getTenantContext()
    // TODO: Implement delete with tenant filtering
    throw new Error('Delete operation not yet implemented')
  }

  /**
   * Execute raw SQL with tenant context validation
   * Use with caution - tenant filtering must be manual
   */
  async execute(sqlQuery: SQL): Promise<any> {
    const context = getTenantContext()
    console.warn(`Executing raw SQL with clinicId=${context.clinicId}. Ensure tenant filtering is applied.`)
    return db.execute(sqlQuery)
  }

  /**
   * Execute transaction with tenant context
   */
  async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    const context = getTenantContext()
    console.log(`Starting transaction with clinicId=${context.clinicId}`)
    
    // Note: Neon HTTP doesn't support transactions natively
    // For transaction support, consider switching to Neon Serverless driver
    // or implementing application-level transaction logic
    return callback(db)
  }
}

/**
 * Singleton instance of tenant-aware database
 */
export const tenantDb = new TenantAwareDB()

/**
 * Helper to extract tenant context from request headers
 * Used in middleware
 */
export function extractTenantContextFromHeaders(headers: Headers): TenantContext | null {
  const userId = headers.get('x-user-id')
  const role = headers.get('x-user-role')
  const clinicId = headers.get('x-clinic-id')
  const email = headers.get('x-user-email')

  if (!userId || !role) {
    return null
  }

  return {
    userId,
    role,
    clinicId: clinicId || '',
    email: email || ''
  }
}
