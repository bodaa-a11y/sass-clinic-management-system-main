/**
 * Doctor UI State Hook
 * 
 * Centralized hook for managing Doctor Dashboard state via URL query parameters.
 * This ensures state persistence across page refreshes and enables deep linking.
 * 
 * @module hooks/use-doctor-ui-state
 */

import { useQueryState, useQueryStates } from 'nuqs'
import { useRouter } from 'next/navigation'
import { useState, useCallback, useEffect } from 'react'
import {
  parseAsUUID,
  validateUUID,
  parseAsDoctorTab,
  validateDoctorTab,
  parseAsDateRangeString,
  parseDateRange,
  parseAsPaginationString,
  parsePagination,
  parseAsSearchQuery,
  sanitizeSearchQuery,
  parseAsBooleanDefault,
  DateRange,
  Pagination,
  serializeDateRange,
  serializePagination,
  DoctorTab,
} from '@/lib/query-state'

/**
 * Doctor UI State Hook
 * 
 * Manages all UI state for the Doctor Dashboard via URL query parameters.
 * 
 * @returns State object and setter methods
 */
export function useDoctorUIState() {
  const router = useRouter()

  // Individual query state values
  const [activePatientId, setActivePatientId] = useQueryState(
    'patient',
    parseAsUUID
  )

  const [currentTab, setCurrentTab] = useQueryState(
    'tab',
    parseAsDoctorTab
  )

  const [examMode, setExamMode] = useQueryState(
    'examMode',
    parseAsBooleanDefault(false)
  )

  const [searchQuery, setSearchQuery] = useQueryState(
    'search',
    parseAsSearchQuery
  )

  const [dateRangeString, setDateRangeString] = useQueryState(
    'dateRange',
    parseAsDateRangeString
  )

  const [paginationString, setPaginationString] = useQueryState(
    'pagination',
    parseAsPaginationString
  )

  const [sidebarCollapsed, setSidebarCollapsed] = useQueryState(
    'sidebar',
    parseAsBooleanDefault(false)
  )

  // Computed values
  const dateRange: DateRange | null = parseDateRange(dateRangeString)
  const pagination: Pagination = parsePagination(paginationString)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery])

  /**
   * Set active patient with validation
   */
  const setActivePatient = useCallback((patientId: string | null) => {
    if (patientId === null) {
      setActivePatientId(null)
      return
    }

    const validId = validateUUID(patientId)
    if (validId) {
      setActivePatientId(validId)
    }
  }, [setActivePatientId])

  /**
   * Set current tab with validation
   */
  const setCurrentTabSafe = useCallback((tab: DoctorTab) => {
    const validTab = validateDoctorTab(tab)
    setCurrentTab(validTab)
  }, [setCurrentTab])

  /**
   * Set date range
   */
  const setDateRange = useCallback((range: DateRange | null) => {
    const serialized = serializeDateRange(range)
    setDateRangeString(serialized || '')
  }, [setDateRangeString])

  /**
   * Set pagination
   */
  const setPagination = useCallback((page: number, limit: number) => {
    const newPagination: Pagination = { page, limit }
    setPaginationString(serializePagination(newPagination))
  }, [setPaginationString])

  /**
   * Set search query with sanitization
   */
  const setSearchQuerySafe = useCallback((query: string) => {
    const sanitized = sanitizeSearchQuery(query)
    setSearchQuery(sanitized)
  }, [setSearchQuery])

  /**
   * Reset all state to defaults
   */
  const resetState = useCallback(() => {
    setActivePatientId(null)
    setCurrentTab('vitals')
    setExamMode(false)
    setSearchQuery('')
    setDateRangeString('')
    setPaginationString('')
    setSidebarCollapsed(false)
  }, [
    setActivePatientId,
    setCurrentTab,
    setExamMode,
    setSearchQuery,
    setDateRangeString,
    setPaginationString,
    setSidebarCollapsed,
  ])

  /**
   * Navigate to a specific patient with tab
   */
  const navigateToPatient = useCallback((patientId: string, tab: DoctorTab = 'vitals') => {
    setActivePatient(patientId)
    setCurrentTabSafe(tab)
  }, [setActivePatient, setCurrentTabSafe])

  /**
   * Toggle exam mode
   */
  const toggleExamMode = useCallback(() => {
    setExamMode((prev) => !prev)
  }, [setExamMode])

  /**
   * Toggle sidebar
   */
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev)
  }, [setSidebarCollapsed])

  return {
    // State values
    activePatientId: activePatientId || null,
    currentTab: currentTab as DoctorTab,
    examMode,
    searchQuery,
    debouncedSearch,
    dateRange,
    pagination,
    sidebarCollapsed,

    // Setter methods
    setActivePatient,
    setCurrentTab: setCurrentTabSafe,
    setExamMode,
    setSearchQuery: setSearchQuerySafe,
    setDateRange,
    setPagination,
    setSidebarCollapsed,

    // Convenience methods
    toggleExamMode,
    toggleSidebar,
    navigateToPatient,
    resetState,
  }
}

/**
 * Hook type for TypeScript
 */
export type DoctorUIState = ReturnType<typeof useDoctorUIState>
