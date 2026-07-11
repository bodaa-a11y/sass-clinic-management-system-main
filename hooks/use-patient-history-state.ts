/**
 * Patient History State Hook
 * 
 * Centralized hook for managing Patient History/Profile state via URL query parameters.
 * Enables easy navigation between sections and shareable filtered views.
 * 
 * @module hooks/use-patient-history-state
 */

import { useQueryState, parseAsString, parseAsBoolean } from 'nuqs'
import { useState, useCallback, useEffect } from 'react'
import {
  parseAsDateRangeString,
  parseDateRange,
  parseAsPaginationString,
  parsePagination,
  parseAsImagingType,
  validateImagingType,
  DateRange,
  Pagination,
  serializeDateRange,
  serializePagination,
  ImagingType,
} from '@/lib/query-state'

/**
 * Patient History Section Type
 */
export type PatientHistorySection = 'overview' | 'radiology' | 'labs' | 'prescriptions' | 'medical-records'

/**
 * Patient History UI State Hook
 * 
 * Manages all UI state for the Patient History page via URL query parameters.
 * 
 * @returns State object and setter methods
 */
export function usePatientHistoryState() {
  // Individual query state values
  const [activeSection, setActiveSection] = useQueryState(
    'section',
    parseAsString.withDefault('overview')
  )

  const [dateRangeString, setDateRangeString] = useQueryState(
    'dateRange',
    parseAsDateRangeString
  )

  const [paginationString, setPaginationString] = useQueryState(
    'pagination',
    parseAsPaginationString
  )

  const [imagingTypeFilter, setImagingTypeFilter] = useQueryState(
    'imagingType',
    parseAsImagingType
  )

  const [showArchived, setShowArchived] = useQueryState(
    'archived',
    parseAsBoolean.withDefault(false)
  )

  // Computed values
  const dateRange: DateRange | null = parseDateRange(dateRangeString)
  const pagination: Pagination = parsePagination(paginationString)

  /**
   * Validate section
   */
  const validateSection = useCallback((str: string): PatientHistorySection => {
    const validSections: PatientHistorySection[] = [
      'overview',
      'radiology',
      'labs',
      'prescriptions',
      'medical-records',
    ]
    
    if (!str || !validSections.includes(str as PatientHistorySection)) {
      return 'overview'
    }
    
    return str as PatientHistorySection
  }, [])

  /**
   * Set active section with validation
   */
  const setActiveSectionSafe = useCallback((section: PatientHistorySection) => {
    const validSection = validateSection(section)
    setActiveSection(validSection)
  }, [setActiveSection, validateSection])

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
   * Set imaging type filter with validation
   */
  const setImagingTypeFilterSafe = useCallback((type: ImagingType | null) => {
    if (type === null) {
      setImagingTypeFilter('')
      return
    }

    const validType = validateImagingType(type)
    if (validType) {
      setImagingTypeFilter(validType)
    }
  }, [setImagingTypeFilter])

  /**
   * Reset all state to defaults
   */
  const resetState = useCallback(() => {
    setActiveSection('overview')
    setDateRangeString('')
    setPaginationString('')
    setImagingTypeFilter('')
    setShowArchived(false)
  }, [
    setActiveSection,
    setDateRangeString,
    setPaginationString,
    setImagingTypeFilter,
    setShowArchived,
  ])

  /**
   * Navigate to specific section
   */
  const navigateToSection = useCallback((section: PatientHistorySection) => {
    setActiveSectionSafe(section)
  }, [setActiveSectionSafe])

  /**
   * Toggle archived view
   */
  const toggleArchived = useCallback(() => {
    setShowArchived((prev) => !prev)
  }, [setShowArchived])

  return {
    // State values
    activeSection: validateSection(activeSection),
    dateRange,
    pagination,
    imagingTypeFilter: imagingTypeFilter as ImagingType | null,
    showArchived,

    // Setter methods
    setActiveSection: setActiveSectionSafe,
    setDateRange,
    setPagination,
    setImagingTypeFilter: setImagingTypeFilterSafe,
    setShowArchived,

    // Convenience methods
    navigateToSection,
    toggleArchived,
    resetState,
  }
}

/**
 * Hook type for TypeScript
 */
export type PatientHistoryState = ReturnType<typeof usePatientHistoryState>
