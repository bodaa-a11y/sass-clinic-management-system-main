/**
 * Tenant Middleware
 * 
 * This middleware extracts tenant context from the request and stores it in AsyncLocalStorage.
 * It ensures that all database operations in the request scope have access to the tenant context.
 * 
 * @module lib/tenant-middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { setTenantContext, TenantContext } from './db-tenant-aware'

/**
 * Extract clinicId from URL path
 * Supports patterns like /api/clinics/[id]/...
 */
function extractClinicIdFromPath(pathname: string): string | null {
  // Pattern: /api/clinics/{clinicId}/...
  const clinicMatch = pathname.match(/\/api\/clinics\/([^\/]+)/)
  if (clinicMatch) {
    return clinicMatch[1]
  }

  // Pattern: /dashboard/{anything} (uses user's clinicId from headers)
  if (pathname.startsWith('/dashboard/')) {
    return null // Will be extracted from headers
  }

  return null
}

/**
 * Middleware function to set tenant context
 * This should be called in Next.js middleware or API route handlers
 */
export function setTenantContextFromRequest(request: NextRequest): TenantContext {
  // Try to extract from URL first
  const clinicIdFromPath = extractClinicIdFromPath(request.nextUrl.pathname)

  // Extract user context from headers
  const userId = request.headers.get('x-user-id')
  const role = request.headers.get('x-user-role')
  const email = request.headers.get('x-user-email')

  if (!userId || !role) {
    throw new Error('Missing required headers: x-user-id or x-user-role')
  }

  // Use clinicId from path if available, otherwise from headers
  const clinicId = clinicIdFromPath || request.headers.get('x-clinic-id') || ''

  if (!clinicId) {
    throw new Error('Clinic ID not found in URL or headers')
  }

  const context: TenantContext = {
    clinicId,
    userId,
    role,
    email: email || '',
  }

  // Set in AsyncLocalStorage for the current request
  setTenantContext(context)

  return context
}

/**
 * Wrapper for API routes that automatically sets tenant context
 * Usage: withTenantContext(handler)
 */
export function withTenantContext<T extends (...args: unknown[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (request: NextRequest, ...args: unknown[]) => {
    try {
      // Set tenant context
      setTenantContextFromRequest(request)
      
      // Call the original handler
      return await handler(request, ...args)
    } catch (error) {
      // Handle tenant context errors
      if (error instanceof Error && error.message.includes('Clinic ID not found')) {
        return NextResponse.json(
          { error: 'Clinic ID not found', code: 'CLINIC_ID_MISSING' },
          { status: 400 }
        )
      }

      if (error instanceof Error && error.message.includes('Missing required headers')) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'UNAUTHENTICATED' },
          { status: 401 }
        )
      }

      throw error
    }
  }) as T
}

/**
 * Server-side helper to set tenant context for server components
 * This should be called in server components that access the database
 */
export function setTenantContextForServerComponent(
  clinicId: string,
  userId: string,
  role: string,
  email: string = ''
): void {
  setTenantContext({
    clinicId,
    userId,
    role,
    email,
  })
}

/**
 * Example usage in API route:
 * 
 * import { withTenantContext } from '@/lib/tenant-middleware'
 * import { tenantDb } from '@/lib/db-tenant-aware'
 * import { patients } from '@/db/schema'
 * import { isNull } from 'drizzle-orm'
 * 
 * export const GET = withTenantContext(async (request: NextRequest) => {
 *   // tenantDb automatically has tenant context
 *   const allPatients = await tenantDb.select(patients).where(isNull(patients.deletedAt))
 *   
 *   return NextResponse.json({ data: allPatients })
 * })
 */

/**
 * Example usage in server component:
 * 
 * import { setTenantContextForServerComponent } from '@/lib/tenant-middleware'
 * import { tenantDb } from '@/lib/db-tenant-aware'
 * import { patients } from '@/db/schema'
 * 
 * export default async function PatientList({ clinicId, user }) {
 *   // Set tenant context for server component
 *   setTenantContextForServerComponent(clinicId, user.id, user.role, user.email)
 *   
 *   // Now use tenantDb
 *   const allPatients = await tenantDb.select(patients)
 *   
 *   return <div>{JSON.stringify(allPatients)}</div>
 * }
 */
