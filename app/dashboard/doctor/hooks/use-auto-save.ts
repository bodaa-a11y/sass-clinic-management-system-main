import { useEffect, useRef, useCallback } from 'react'
import { useDoctorStore } from '../stores/doctor-store'
import { autoSaveConsultation } from '../services/exam-service'

const AUTO_SAVE_KEY = 'cura-doctor-autosave'
const AUTO_SAVE_DEBOUNCE_MS = 2000 // Increased to 2 seconds for consultation service

interface AutoSaveOptions {
  consultationId?: string
  clinicId?: string
  clinicalData?: any
  enabled?: boolean
}

export const useAutoSave = (options: AutoSaveOptions = {}) => {
  const {
    consultationId,
    clinicId,
    clinicalData,
    enabled = true,
  } = options

  const labResultForm = useDoctorStore((state) => state.labResultForm)
  const vaccinationForm = useDoctorStore((state) => state.vaccinationForm)
  const prescriptionRenewalForm = useDoctorStore((state) => state.prescriptionRenewalForm)
  const labIntegrationForm = useDoctorStore((state) => state.labIntegrationForm)
  const consultationData = useDoctorStore((state) => state.consultationData)
  const setConsultationData = useDoctorStore((state) => state.setConsultationData)
  
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastSavedRef = useRef<Date | null>(null)
  const isSavingRef = useRef(false)

  // Auto-save to consultation service (primary)
  useEffect(() => {
    if (!enabled || !consultationId || !clinicId || !clinicalData) {
      return
    }

    // Stop auto-save if consultation is completed
    if (consultationData?.status === 'completed' || consultationData?.status === 'cancelled') {
      return
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Debounce save to consultation service
    timeoutRef.current = setTimeout(async () => {
      if (isSavingRef.current) {
        return // Already saving
      }

      isSavingRef.current = true
      
      try {
        const result = await autoSaveConsultation(
          clinicId,
          consultationId,
          clinicalData,
          consultationData?.updatedAt
        )

        if (result.success) {
          if (result.completed) {
            // Consultation is completed, stop auto-save
            setConsultationData({
              ...consultationData,
              status: 'completed',
            })
            return
          }

          if (result.consultation) {
            lastSavedRef.current = new Date()
            setConsultationData({
              ...consultationData,
              status: result.consultation.status,
              updatedAt: result.consultation.updatedAt,
            })
          }
        }

        if (result.requiresRefresh) {
          // Conflict detected - show warning
          console.warn('Consultation was modified by another user')
        }
      } catch (error) {
        console.error('Auto-save to consultation service failed:', error)
        // Fallback to localStorage on error
        saveToLocal()
      } finally {
        isSavingRef.current = false
      }
    }, AUTO_SAVE_DEBOUNCE_MS)

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [
    enabled,
    consultationId,
    clinicId,
    clinicalData,
    consultationData,
    setConsultationData,
  ])

  // Fallback: save to localStorage (for forms not in consultation)
  useEffect(() => {
    if (!enabled) {
      return
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      saveToLocal()
    }, AUTO_SAVE_DEBOUNCE_MS)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [labResultForm, vaccinationForm, prescriptionRenewalForm, labIntegrationForm, enabled])

  const saveToLocal = useCallback(() => {
    try {
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify({
        forms: {
          labResultForm,
          vaccinationForm,
          prescriptionRenewalForm,
          labIntegrationForm,
        },
        consultationData,
        lastSavedAt: new Date().toISOString(),
      }))
    } catch (error) {
      console.error('Auto-save to localStorage failed:', error)
    }
  }, [labResultForm, vaccinationForm, prescriptionRenewalForm, labIntegrationForm, consultationData])

  const loadAutoSave = useCallback(() => {
    try {
      const saved = localStorage.getItem(AUTO_SAVE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        return {
          forms: data.forms,
          consultationData: data.consultationData,
          lastSavedAt: data.lastSavedAt ? new Date(data.lastSavedAt) : null,
        }
      }
    } catch (error) {
      console.error('Failed to load auto-save data:', error)
    }
    return null
  }, [])

  const clearAutoSave = useCallback(() => {
    try {
      localStorage.removeItem(AUTO_SAVE_KEY)
      lastSavedRef.current = null
    } catch (error) {
      console.error('Failed to clear auto-save data:', error)
    }
  }, [])

  const getLastSavedAt = useCallback(() => {
    return lastSavedRef.current
  }, [])

  const isSaving = useCallback(() => {
    return isSavingRef.current
  }, [])

  return {
    loadAutoSave,
    clearAutoSave,
    getLastSavedAt,
    isSaving,
  }
}
