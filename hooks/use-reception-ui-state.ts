/**
 * Reception UI State Hook
 * 
 * Centralized hook for managing Reception/Waitlist state via URL query parameters.
 * Enables shareable filtered waitlist URLs and state persistence.
 * 
 * @module hooks/use-reception-ui-state
 */

import { useQueryState } from 'nuqs'
import { useState, useCallback, useEffect } from 'react'
import {
  parseAsReceptionTab,
  validateReceptionTab,
  parseAsDateRangeString,
  parseDateRange,
  parseAsPaginationString,
  parsePagination,
  parseAsSearchQuery,
  sanitizeSearchQuery,
  parseAsAppointmentStatus,
  validateAppointmentStatus,
  parseAsBooleanDefault,
  DateRange,
  Pagination,
  serializeDateRange,
  serializePagination,
  ReceptionTab,
  AppointmentStatus,
} from '@/lib/query-state'

/**
 * Reception UI State Hook
 * 
 * Manages all UI state for the Reception page via URL query parameters.
 * 
 * @returns State object and setter methods
 */
export function useReceptionUIState() {
  // Individual query state values
  const [currentTab, setCurrentTab] = useQueryState(
    'tab',
    parseAsReceptionTab
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

  const [statusFilter, setStatusFilter] = useQueryState(
    'status',
    parseAsAppointmentStatus
  )

  const [viewMode, setViewMode] = useQueryState(
    'view',
    parseAsBooleanDefault(false) // false = list, true = calendar
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
   * Set current tab with validation
   */
  const setCurrentTabSafe = useCallback((tab: ReceptionTab) => {
    const validTab = validateReceptionTab(tab)
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
   * Set status filter with validation
   */
  const setStatusFilterSafe = useCallback((status: AppointmentStatus | null) => {
    if (status === null) {
      setStatusFilter('')
      return
    }

    const validStatus = validateAppointmentStatus(status)
    if (validStatus) {
      setStatusFilter(validStatus)
    }
  }, [setStatusFilter])

  /**
   * Reset all state to defaults
   */
  const resetState = useCallback(() => {
    setCurrentTab('appointments')
    setSearchQuery('')
    setDateRangeString('')
    setPaginationString('')
    setStatusFilter('')
    setViewMode(false)
  }, [
    setCurrentTab,
    setSearchQuery,
    setDateRangeString,
    setPaginationString,
    setStatusFilter,
    setViewMode,
  ])

  /**
   * Generate shareable URL with current filters
   */
  const getShareableURL = useCallback(() => {
    const params = new URLSearchParams()
    
    if (currentTab !== 'appointments') params.set('tab', currentTab)
    if (searchQuery) params.set('search', searchQuery)
    if (dateRangeString) params.set('dateRange', dateRangeString)
    if (statusFilter) params.set('status', statusFilter)
    if (viewMode) params.set('view', 'true')
    
    return params.toString()
  }, [currentTab, searchQuery, dateRangeString, statusFilter, viewMode])

  /**
   * Toggle view mode (list/calendar)
   */
  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => !prev)
  }, [setViewMode])

  return {
    // State values
    currentTab: currentTab as ReceptionTab,
    searchQuery,
    debouncedSearch,
    dateRange,
    pagination,
    statusFilter: statusFilter as AppointmentStatus | null,
    viewMode,

    // Setter methods
    setCurrentTab: setCurrentTabSafe,
    setSearchQuery: setSearchQuerySafe,
    setDateRange,
    setPagination,
    setStatusFilter: setStatusFilterSafe,
    setViewMode,

    // Convenience methods
    toggleViewMode,
    resetState,
    getShareableURL,
  }
}

/**
 * Hook type for TypeScript
 */
export type ReceptionUIState = ReturnType<typeof useReceptionUIState>
