import { useState, useEffect, useCallback } from 'react'
import { useDoctorStore } from '../stores/doctor-store'
import { completeExam, startConsultation, completeConsultation } from '../services/exam-service'
import { ExamSubmission } from '../types/exam.types'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { store } from '@/lib/store'
import { useExamGuard } from './use-exam-guard'
import { useAutoSave } from './use-auto-save'
import { useTenant } from '@/lib/tenant-context'

export const useDoctorExam = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clinicId: tenantClinicId } = useTenant()
  
  const selectedPatient = useDoctorStore((state) => state.selectedPatient)
  const clinicId = useDoctorStore((state) => state.clinicId)
  const setExamMode = useDoctorStore((state) => state.setExamMode)
  const setMedicalRecordsMode = useDoctorStore((state) => state.setMedicalRecordsMode)
  const setSelectedMedicalRecordId = useDoctorStore((state) => state.setSelectedMedicalRecordId)
  const setSelectedPatient = useDoctorStore((state) => state.setSelectedPatient)
  const setPatientData = useDoctorStore((state) => state.setPatientData)
  const resetPatientState = useDoctorStore((state) => state.resetPatientState)
  const resetUIState = useDoctorStore((state) => state.resetUIState)
  const consultationData = useDoctorStore((state) => state.consultationData)
  const setConsultationData = useDoctorStore((state) => state.setConsultationData)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [conflictDetected, setConflictDetected] = useState(false)
  const [isLoadingConsultation, setIsLoadingConsultation] = useState(false)
  const [unsavedDataDetected, setUnsavedDataDetected] = useState(false)
  const [unsavedData, setUnsavedData] = useState<any>(null)
  const [isLoadingPatientData, setIsLoadingPatientData] = useState(false)
  
  const { showExitDialog, handleBackToWaitingList: handleBackWithGuard, handleConfirmExit, handleCancelExit } = useExamGuard()

  // Use tenantClinicId as single source of truth
  const effectiveClinicId = tenantClinicId || clinicId

  // Auto-save hook integration
  const { getLastSavedAt, isSaving, loadAutoSave } = useAutoSave({
    consultationId: consultationData?.consultationId,
    clinicId: consultationData?.clinicId,
    clinicalData: consultationData,
    enabled: !!consultationData?.consultationId,
  })

  // 1. Smart Hydration - Load consultation from URL
  useEffect(() => {
    const consultationId = searchParams.get('consultationId')
    const patientId = searchParams.get('patientId')

    if (consultationId && effectiveClinicId) {
      // Load existing consultation from server
      console.log('[DoctorExam] Loading consultation from URL:', consultationId)
      loadConsultation(consultationId)
    } else if (patientId && effectiveClinicId) {
      // Check for active consultation for this patient
      console.log('[DoctorExam] Checking active consultation for patient:', patientId)
      checkActiveConsultation(patientId)
    }
  }, [searchParams, effectiveClinicId])

  // 2. Auto-restore from localStorage on mount
  useEffect(() => {
    if (!consultationData?.consultationId) {
      const saved = loadAutoSave()
      if (saved && saved.consultationData) {
        setConsultationData(saved.consultationData)
        setExamMode(true) // Restore exam mode when data is restored
        toast.success('تم استعادة البيانات المحفوظة تلقائياً')
      }
    }
  }, [])

  const loadConsultation = async (consultationId: string) => {
    if (!effectiveClinicId) {
      console.error('[DoctorExam] No clinicId available for loading consultation')
      toast.error('فشل تحميل بيانات الاستشارة: معرف العيادة غير متوفر')
      return
    }

    console.log('[DoctorExam] Loading consultation:', consultationId)
    setIsLoadingConsultation(true)
    try {
      const response = await fetch(`/api/clinics/${effectiveClinicId}/consultations/${consultationId}`)
      if (response.ok) {
        const { consultation } = await response.json()
        console.log('[DoctorExam] Consultation loaded:', consultation)
        
        // Check for unsaved data in localStorage
        const localStorageKey = 'cura-doctor-autosave'
        const savedLocal = localStorage.getItem(localStorageKey)
        
        if (savedLocal) {
          try {
            const localData = JSON.parse(savedLocal)
            const localLastSaved = new Date(localData.lastSavedAt)
            const serverUpdatedAt = new Date(consultation.updatedAt)
            
            // If local data is newer than server data (within 5 minutes)
            if (localLastSaved > serverUpdatedAt && 
                (localLastSaved.getTime() - serverUpdatedAt.getTime()) < 300000) {
              setUnsavedData(localData.consultationData)
              setUnsavedDataDetected(true)
              // Don't set consultation data yet, wait for user choice
              setIsLoadingConsultation(false)
              return
            }
          } catch (error) {
            console.error('Failed to parse localStorage data:', error)
          }
        }
        
        // Load patient data
        console.log('[DoctorExam] Loading patient data for:', consultation.patientId)
        const { fetchPatientData } = await import('../services/patient-service')
        const patientData = await fetchPatientData(effectiveClinicId, consultation.patientId)
        setPatientData(patientData)
        
        // Set selected patient based on consultation
        setSelectedPatient({
          id: consultation.appointmentId || consultation.id,
          patientId: consultation.patientId,
          doctorId: consultation.doctorId,
          patientName: patientData?.patient?.fullName || 'Unknown',
          patientPhone: patientData?.patient?.phone,
          startTime: consultation.startTime || new Date().toISOString(),
          status: consultation.status || 'in-progress',
        })
        
        setConsultationData({
          consultationId: consultation.id,
          clinicId: consultation.clinicId,
          patientId: consultation.patientId,
          doctorId: consultation.doctorId,
          status: consultation.status,
          vitals: consultation.clinicalData?.vitals,
          specialtyData: consultation.clinicalData?.specialtyData,
          sectionsProgress: consultation.clinicalData?.sectionsProgress,
          updatedAt: consultation.updatedAt,
        })
        
        // Enter exam mode after loading consultation
        setExamMode(true)
        console.log('[DoctorExam] Exam mode activated')
      }
    } catch (error) {
      console.error('[DoctorExam] Failed to load consultation:', error)
      toast.error('فشل تحميل بيانات الاستشارة')
    } finally {
      setIsLoadingConsultation(false)
    }
  }

  const checkActiveConsultation = async (patientId: string) => {
    if (!effectiveClinicId) {
      console.error('[DoctorExam] No clinicId available for checking active consultation')
      return
    }

    try {
      const response = await fetch(`/api/clinics/${effectiveClinicId}/consultations/active?patientId=${patientId}`)
      if (response.ok) {
        const { consultation } = await response.json()
        if (consultation) {
          setConsultationData({
            consultationId: consultation.id,
            clinicId: consultation.clinicId,
            status: consultation.status,
            vitals: consultation.clinicalData?.vitals,
            specialtyData: consultation.clinicalData?.specialtyData,
            sectionsProgress: consultation.clinicalData?.sectionsProgress,
            updatedAt: consultation.updatedAt,
          })
          // Update URL to include consultationId
          router.push(`/dashboard/doctor?consultationId=${consultation.id}`)
        }
      }
    } catch (error) {
      console.error('[DoctorExam] Failed to check active consultation:', error)
    }
  }

  const handleStartExam = async (appointment: any) => {
    if (!effectiveClinicId) {
      console.error('[DoctorExam] No clinicId available for starting exam')
      toast.error('فشل بدء جلسة الفحص: معرف العيادة غير متوفر')
      return
    }

    try {
      console.log('[DoctorExam] Starting exam for appointment:', appointment.id)
      
      // Check if this is the same patient currently in exam
      const isCurrentPatient = consultationData?.patientId === appointment.patientId

      if (isCurrentPatient && consultationData?.consultationId) {
        // Same patient - just enter exam mode
        console.log('[DoctorExam] Same patient, entering exam mode')
        setExamMode(true)
        setSelectedPatient(appointment)
        router.push(`/dashboard/doctor?consultationId=${consultationData.consultationId}&tab=vitals`)
        toast.success('تم العودة لجلسة الفحص')
        return
      }

      // 1. Set exam mode immediately to avoid PatientExamCard flash
      console.log('[DoctorExam] Setting exam mode and loading patient data')
      setExamMode(true)
      setSelectedPatient(appointment)
      setIsLoadingPatientData(true)

      // 2. Fetch patient data in parallel with consultation start
      const { fetchPatientData } = await import('../services/patient-service')
      const [data, result] = await Promise.all([
        fetchPatientData(effectiveClinicId, appointment.patientId),
        startConsultation(effectiveClinicId, appointment.id, appointment.patientId, appointment.doctorId)
      ])

      setPatientData(data)
      setIsLoadingPatientData(false)

      console.log('[DoctorExam] Patient data loaded, consultation started:', result)

      // 3. Load consultation data if it's existing
      if (result.isExisting) {
        await loadConsultation(result.consultationId)
      } else {
        setConsultationData({
          consultationId: result.consultationId,
          clinicId: effectiveClinicId,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          status: 'in-progress',
          vitals: {},
          specialtyData: {},
          sectionsProgress: {},
        })
      }

      // 4. Update URL with consultationId
      router.push(`/dashboard/doctor?consultationId=${result.consultationId}&tab=vitals`)

      toast.success(result.isExisting ? 'تم متابعة جلسة الفحص' : 'تم بدء جلسة الفحص')
    } catch (error) {
      console.error('[DoctorExam] Failed to start exam:', error)
      setIsLoadingPatientData(false)
      const errorMessage = error instanceof Error ? error.message : 'فشل بدء جلسة الفحص'
      toast.error(errorMessage)
      // Revert exam mode on error
      setExamMode(false)
    }
  }

  const handleBackToWaitingList = () => {
    setExamMode(false)
    setSelectedPatient(null)
    setPatientData(null)
    resetUIState()
    setConsultationData({})
    router.push('/dashboard/doctor')
  }

  const handleStepChange = (step: number) => {
    // Update URL state for tab navigation
    const tabs = ['vitals', 'examination', 'diagnosis', 'prescription']
    const currentTab = tabs[step] || 'vitals'
    router.push(`/dashboard/doctor?consultationId=${consultationData?.consultationId}&tab=${currentTab}`)
    
    // Update section progress
    setConsultationData({
      ...consultationData,
      sectionsProgress: {
        ...consultationData?.sectionsProgress,
        [currentTab]: true,
      },
    })
  }

  const handleConflictResolution = async (keepLocal: boolean) => {
    if (!consultationData?.consultationId || !effectiveClinicId) return

    if (keepLocal) {
      // Force local version - reload consultation and update
      await loadConsultation(consultationData.consultationId)
    } else {
      // Keep server version - reload from server
      await loadConsultation(consultationData.consultationId)
    }
    setConflictDetected(false)
  }

  const handleUnsavedDataChoice = async (useLocal: boolean) => {
    if (useLocal && unsavedData) {
      // Use local data from localStorage
      setConsultationData(unsavedData)
      toast.success('تم استعادة التعديلات غير المحفوظة')
    } else {
      // Use server data - clear localStorage and reload
      localStorage.removeItem('cura-doctor-autosave')
      if (consultationData?.consultationId) {
        await loadConsultation(consultationData.consultationId)
      }
    }
    setUnsavedDataDetected(false)
    setUnsavedData(null)
  }

  const handleExamSubmit = async (examData: ExamSubmission) => {
    if (!selectedPatient || !clinicId || !consultationData?.consultationId) return

    setIsSubmitting(true)
    try {
      // Use consultationData.patientId to ensure consistency
      const examDataWithCorrectPatientId = {
        ...examData,
        patientId: consultationData.patientId || examData.patientId,
      }

      // Use new consultation completion protocol
      const result = await completeConsultation(clinicId, consultationData.consultationId, examDataWithCorrectPatientId)

      if (result.success) {
        toast.success('تم إتمام الفحص وأرشفته بنجاح', {
          description: 'تم حفظ السجل الطبي',
          action: {
            label: 'عرض السجل الطبي',
            onClick: () => {
              setMedicalRecordsMode(true)
              setSelectedMedicalRecordId(result.medicalRecordId || null)
            },
          },
        })

        // Update consultation status to stop auto-save
        setConsultationData({
          ...consultationData,
          status: 'completed',
        })

        handleBackToWaitingList()
      } else {
        toast.error('فشل إتمام الفحص')
      }
    } catch (error) {
      console.error('Failed to complete exam:', error)
      toast.error('حدث خطأ أثناء إتمام الفحص')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    selectedPatient,
    clinicId,
    consultationId: consultationData?.consultationId,
    isSubmitting,
    isLoadingConsultation,
    isLoadingPatientData,
    conflictDetected,
    unsavedDataDetected,
    lastSavedAt: getLastSavedAt(),
    isSaving: isSaving(),
    handleStartExam,
    handleBackToWaitingList: handleBackWithGuard,
    handleStepChange,
    handleExamSubmit,
    handleConflictResolution,
    handleUnsavedDataChoice,
    showExitDialog,
    handleConfirmExit,
    handleCancelExit,
  }
}
