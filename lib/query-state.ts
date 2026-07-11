/**
 * Query State Parsers
 * 
 * Custom parsers for nuqs to handle Cura-specific data types.
 * These parsers validate and transform URL query parameters.
 * 
 * @module lib/query-state
 */

import {
  parseAsString,
  parseAsBoolean,
  parseAsInteger,
  parseAsJson,
} from 'nuqs'

/**
 * UUID Parser
 * Validates and parses UUID strings from URL
 */
export const parseAsUUID = parseAsString.withDefault('')

export function validateUUID(str: string): string | null {
  if (!str) return null
  
  // UUID regex pattern (v4)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  
  if (!uuidRegex.test(str)) {
    console.warn(`Invalid UUID format: ${str}`)
    return null
  }
  
  return str
}

/**
 * Tab Enum Parser
 * Validates tab names for Doctor Dashboard
 */
export type DoctorTab = 'vitals' | 'exam' | 'labs' | 'radiology' | 'history' | 'prescriptions'
export type ReceptionTab = 'appointments' | 'patients' | 'invoices' | 'documents'

export const parseAsDoctorTab = parseAsString.withDefault('vitals')

export function validateDoctorTab(str: string): DoctorTab {
  const validTabs: DoctorTab[] = ['vitals', 'exam', 'labs', 'radiology', 'history', 'prescriptions']
  
  if (!str || !validTabs.includes(str as DoctorTab)) {
    return 'vitals'
  }
  
  return str as DoctorTab
}

export const parseAsReceptionTab = parseAsString.withDefault('appointments')

export function validateReceptionTab(str: string): ReceptionTab {
  const validTabs: ReceptionTab[] = ['appointments', 'patients', 'invoices', 'documents']
  
  if (!str || !validTabs.includes(str as ReceptionTab)) {
    return 'appointments'
  }
  
  return str as ReceptionTab
}

/**
 * Date Range Parser
 * Parses date range from URL (format: start,end or start-end)
 */
export interface DateRange {
  start: Date
  end: Date
}

export const parseAsDateRangeString = parseAsString.withDefault('')

export function parseDateRange(str: string): DateRange | null {
  if (!str) return null
  
  try {
    // Try comma separator first
    let parts = str.split(',')
    if (parts.length !== 2) {
      // Try hyphen separator
      parts = str.split('-')
    }
    
    if (parts.length !== 2) {
      console.warn(`Invalid date range format: ${str}`)
      return null
    }
    
    const start = new Date(parts[0])
    const end = new Date(parts[1])
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn(`Invalid date values: ${str}`)
      return null
    }
    
    return { start, end }
  } catch (error) {
    console.warn(`Error parsing date range: ${str}`, error)
    return null
  }
}

/**
 * Pagination Parser
 * Parses page and limit with validation
 */
export interface Pagination {
  page: number
  limit: number
}

export const parseAsPaginationString = parseAsString.withDefault('')

export function parsePagination(str: string): Pagination {
  if (!str) {
    return { page: 1, limit: 20 }
  }
  
  try {
    const data = JSON.parse(str)
    const page = Math.max(1, data.page || 1)
    const limit = Math.min(100, Math.max(10, data.limit || 20))
    
    return { page, limit }
  } catch {
    return { page: 1, limit: 20 }
  }
}

/**
 * Status Enum Parser
 * Validates appointment/record status values
 */
export type AppointmentStatus = 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show'

export const parseAsAppointmentStatus = parseAsString.withDefault('')

export function validateAppointmentStatus(str: string): AppointmentStatus | null {
  const validStatuses: AppointmentStatus[] = ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show']
  
  if (!str || !validStatuses.includes(str as AppointmentStatus)) {
    return null
  }
  
  return str as AppointmentStatus
}

/**
 * Imaging Type Parser
 * Validates radiology imaging types
 */
export type ImagingType = 'X-Ray' | 'MRI' | 'CT Scan' | 'Ultrasound' | 'Other'

export const parseAsImagingType = parseAsString.withDefault('')

export function validateImagingType(str: string): ImagingType | null {
  const validTypes: ImagingType[] = ['X-Ray', 'MRI', 'CT Scan', 'Ultrasound', 'Other']
  
  if (!str || !validTypes.includes(str as ImagingType)) {
    return null
  }
  
  return str as ImagingType
}

/**
 * Search Query Parser
 * Parses and sanitizes search queries
 */
export const parseAsSearchQuery = parseAsString.withDefault('')

export function sanitizeSearchQuery(str: string): string {
  if (!str) return ''
  return str.trim().slice(0, 200) // Max 200 characters
}

/**
 * Boolean Parser with default
 */
export const parseAsBooleanDefault = (defaultValue: boolean) => 
  parseAsBoolean.withDefault(defaultValue)

/**
 * Integer Parser with bounds
 */
export const parseAsIntegerBounded = (min: number, max: number, defaultValue: number) =>
  parseAsInteger.withDefault(defaultValue)

export function clampInteger(val: number | null, min: number, max: number, defaultValue: number): number {
  if (val === null || val === undefined) return defaultValue
  return Math.max(min, Math.min(max, val))
}

/**
 * Array Parser (comma-separated values)
 */
export const parseAsArrayString = parseAsString.withDefault('')

export function parseArray(str: string): string[] {
  if (!str) return []
  return str.split(',').map(s => s.trim()).filter(Boolean)
}

/**
 * Sorting Parser
 * Parses sort field and direction
 */
export interface SortOption {
  field: string
  direction: 'asc' | 'desc'
}

export const parseAsSortString = parseAsString.withDefault('')

export function parseSort(str: string): SortOption | null {
  if (!str) return null
  
  const parts = str.split(':')
  if (parts.length !== 2) return null
  
  const field = parts[0]
  const direction = parts[1] === 'desc' ? 'desc' : 'asc'
  
  return { field, direction }
}

/**
 * Helper: Serialize DateRange to URL string
 */
export function serializeDateRange(range: DateRange | null): string | null {
  if (!range) return null
  return `${range.start.toISOString().split('T')[0]},${range.end.toISOString().split('T')[0]}`
}

/**
 * Helper: Serialize Pagination to URL string
 */
export function serializePagination(pagination: Pagination): string {
  return JSON.stringify(pagination)
}

/**
 * Helper: Serialize Sort to URL string
 */
export function serializeSort(sort: SortOption | null): string | null {
  if (!sort) return null
  return `${sort.field}:${sort.direction}`
}
