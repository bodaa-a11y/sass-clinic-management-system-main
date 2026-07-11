'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useDoctorStore } from './stores/doctor-store'
import { DoctorHeader } from './components/doctor-layout/doctor-header'
import { ExamModeContainer } from './components/exam-mode/exam-mode-container'
import { WaitingModeContainer } from './components/waiting-mode/waiting-mode-container'
import { MedicalRecordsModeContainer } from './components/medical-records-mode/medical-records-mode-container'
import { LabResultDialog } from './components/dialogs/lab-result-dialog'
import { VaccinationDialog } from './components/dialogs/vaccination-dialog'
import { PrescriptionRenewalDialog } from './components/dialogs/prescription-renewal-dialog'
import { LabIntegrationDialog } from './components/dialogs/lab-integration-dialog'
import { useDoctorExam } from './hooks/use-doctor-exam'
import { ExamExitDialog } from './components/dialogs/exam-exit-dialog'
import { useLabResults } from './hooks/use-lab-results'
import { useVaccinations } from './hooks/use-vaccinations'
import { usePrescriptionRenewals } from './hooks/use-prescription-renewals'
import { useLabIntegrations } from './hooks/use-lab-integrations'
import { useWaitingPatients } from './hooks/use-waiting-patients'
import { useInProgressAppointments } from './hooks/use-in-progress-appointments'
import { useAutoSave } from './hooks/use-auto-save'
import { useTenant } from '@/lib/tenant-context'
import { PageTransition } from '@/components/animations/page-transition'
import { store } from '@/lib/store'
import { DoctorDashboard } from './components/doctor-dashboard'

export default function DoctorPage() {
  const { facilityType, clinicId: tenantClinicId } = useTenant()

  // Validate clinicId from tenant-context
  if (!tenantClinicId) {
    console.error('[DoctorPage] No clinicId from tenant-context')
  }

  // Initialize clinicId from store (selective subscription)
  const clinicId = useDoctorStore((state) => state.clinicId)
  const setClinicId = useDoctorStore((state) => state.setClinicId)
  const setUserId = useDoctorStore((state) => state.setUserId)
  const setUserRole = useDoctorStore((state) => state.setUserRole)
  const setPatientData = useDoctorStore((state) => state.setPatientData)
  const setSelectedPatient = useDoctorStore((state) => state.setSelectedPatient)
  const patientData = useDoctorStore((state) => state.patientData)
  const isExamMode = useDoctorStore((state) => state.isExamMode)
  const isMedicalRecordsMode = useDoctorStore((state) => state.isMedicalRecordsMode)
  const isPrescriptionStepOpen = useDoctorStore((state) => state.isPrescriptionStepOpen)
  const setMedicalRecordsMode = useDoctorStore((state) => state.setMedicalRecordsMode)

  useEffect(() => {
    // Use clinicId from tenant-context first (single source of truth)
    if (tenantClinicId) {
      console.log('[DoctorPage] Setting clinicId from tenant-context:', tenantClinicId)
      setClinicId(tenantClinicId)
      // Also set userId and userRole from store.getUser()
      const userData = store.getUser()
      if (userData?.id) {
        setUserId(userData.id)
        setUserRole(userData.role || null)
      }
      return
    }

    console.error('[DoctorPage] No tenantClinicId available, falling back to API')
    // Fetch user data from API if tenantClinicId is not available
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const result = await response.json()
          const userData = result.data?.user
          if (userData?.clinicId) {
            console.log('[DoctorPage] Setting clinicId from API:', userData.clinicId)
            setClinicId(userData.clinicId)
            setUserId(userData.id)
            setUserRole(userData.role || null)
            // Save to localStorage for backward compatibility
            store.login('', userData)
          }
        }
      } catch (error) {
        console.error('[DoctorPage] Failed to fetch user data:', error)
        // Fallback to store.getUser()
        const userData = store.getUser()
        if (userData?.clinicId) {
          console.log('[DoctorPage] Setting clinicId from store fallback:', userData.clinicId)
          setClinicId(userData.clinicId)
          setUserId(userData.id)
          setUserRole(userData.role || null)
        }
      }
    }

    fetchUserData()
  }, [setClinicId, setUserId, setUserRole, tenantClinicId])

  // Custom hooks
  const { waitingPatients, isLoading: waitingLoading } = useWaitingPatients()
  const { appointments: inProgressAppointments, isLoading: inProgressLoading } = useInProgressAppointments()
  const {
    selectedPatient,
    isSubmitting,
    isLoadingPatientData,
    handleStartExam,
    handleBackToWaitingList,
    handleStepChange,
    handleExamSubmit,
    showExitDialog,
    handleConfirmExit,
    handleCancelExit,
  } = useDoctorExam()
  
  const {
    labResults,
    labResultForm,
    isLoading: labLoading,
    handleAddLabResult,
    handleOpenLabResultDialog,
  } = useLabResults()
  
  const {
    vaccinationForm,
    isLoading: vaccinationLoading,
    handleAddVaccination,
  } = useVaccinations()
  
  const {
    prescriptionRenewalForm,
    isLoading: prescriptionRenewalLoading,
    handlePrescriptionRenewal,
  } = usePrescriptionRenewals()
  
  const {
    labIntegrationForm,
    isLoading: labIntegrationLoading,
    handleAddLabIntegration,
  } = useLabIntegrations()

  // Auto-save
  useAutoSave()

  // Handle patient selection from waiting list
  const handlePatientSelect = async (appointment: any) => {
    // Use tenantClinicId as single source of truth
    const effectiveClinicId = tenantClinicId || clinicId
    if (!effectiveClinicId) {
      console.error('[DoctorPage] No clinicId available for patient selection')
      toast.error('فشل تحميل بيانات المريض: معرف العيادة غير متوفر')
      return
    }
    
    try {
      console.log('[DoctorPage] Fetching patient data for:', appointment.patientId)
      const { fetchPatientData } = await import('./services/patient-service')
      const data = await fetchPatientData(effectiveClinicId, appointment.patientId)
      setPatientData(data)
      setSelectedPatient(appointment)
    } catch (error) {
      console.error('[DoctorPage] Failed to fetch patient data:', error)
      toast.error('فشل تحميل بيانات المريض')
    }
  }

  // Fetch next patient data
  const [nextPatientData, setNextPatientData] = useState<any>(null)

  useEffect(() => {
    // Use tenantClinicId as single source of truth
    const effectiveClinicId = tenantClinicId || clinicId
    if (!effectiveClinicId || waitingPatients.length === 0) return

    // Find next patient (first in waiting room who is not in-progress)
    const nextPatient = waitingPatients
      .filter(p => p.status === 'in-waiting-room' || p.status === 'confirmed')
      .sort((a, b) => {
        const today = new Date().toISOString().split('T')[0]
        const timeA = new Date(`${today}T${a.startTime}`)
        const timeB = new Date(`${today}T${b.startTime}`)
        return timeA.getTime() - timeB.getTime()
      })[0]

    if (nextPatient) {
      const fetchNextPatient = async () => {
        try {
          console.log('[DoctorPage] Fetching next patient data for:', nextPatient.patientId)
          const { fetchPatientData } = await import('./services/patient-service')
          const data = await fetchPatientData(effectiveClinicId, nextPatient.patientId)
          setNextPatientData(data)
        } catch (error) {
          console.error('[DoctorPage] Failed to fetch next patient data:', error)
        }
      }
      fetchNextPatient()
    } else {
      setNextPatientData(null)
    }
  }, [tenantClinicId, clinicId, waitingPatients])

  // Dialog states from store (selective subscription)
  const dialogs = useDoctorStore((state) => state.dialogs)
  const setDialogOpen = useDoctorStore((state) => state.setDialogOpen)
  const setLabResultForm = useDoctorStore((state) => state.setLabResultForm)
  const setVaccinationForm = useDoctorStore((state) => state.setVaccinationForm)
  const setPrescriptionRenewalForm = useDoctorStore((state) => state.setPrescriptionRenewalForm)
  const setLabIntegrationForm = useDoctorStore((state) => state.setLabIntegrationForm)

  // Loading state
  if (waitingLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="h-screen overflow-hidden bg-gray-50 flex flex-col" dir="rtl">
        {/* Header */}
        <DoctorHeader
          isExamMode={isExamMode}
          patientName={selectedPatient?.patientName}
          facilityType={facilityType}
        />

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden p-6">
          {isMedicalRecordsMode && selectedPatient ? (
            /* Medical Records Mode - Full Width */
            <div className="lg:col-span-12 flex flex-col h-full overflow-hidden">
              <MedicalRecordsModeContainer
                patientName={selectedPatient.patientName}
                patientId={selectedPatient.patientId}
                onClose={() => setMedicalRecordsMode(false)}
              />
            </div>
          ) : isExamMode && selectedPatient ? (
            /* Exam Mode - Full Width */
            <div className="lg:col-span-12 flex flex-col h-full overflow-hidden">
              {isLoadingPatientData ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">جاري تحميل بيانات المريض...</p>
                  </div>
                </div>
              ) : patientData ? (
                <ExamModeContainer
                  patientName={selectedPatient.patientName}
                  patientId={selectedPatient.patientId}
                  patientData={patientData}
                  clinicId={clinicId || undefined}
                  onSubmit={handleExamSubmit}
                  onCancel={handleBackToWaitingList}
                  onStepChange={handleStepChange}
                  labResults={labResults}
                  onAddLabResult={handleOpenLabResultDialog}
                  isPrescriptionStepOpen={isPrescriptionStepOpen}
                  showExitDialog={showExitDialog}
                  onConfirmExit={handleConfirmExit}
                  onCancelExit={handleCancelExit}
                  radiologyImages={[]}
                  medicalDocuments={[]}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-600">فشل تحميل بيانات المريض</p>
                </div>
              )}
            </div>
          ) : (
            /* Waiting Mode - With Dashboard */
            <>
              {/* Doctor Dashboard Stats */}
              <div className="lg:col-span-12">
                <DoctorDashboard
                  todayAppointments={waitingPatients.length + inProgressAppointments.length}
                  completedConsultations={inProgressAppointments.length}
                  waitingPatients={waitingPatients.filter(p => p.status === 'in-waiting-room').length}
                  followUpNeeded={0}
                  avgConsultationTime={15}
                />
              </div>

              {/* Waiting Mode - Three Columns */}
              <WaitingModeContainer
                waitingPatients={waitingPatients}
                inProgressAppointments={inProgressAppointments}
                onStartExam={handleStartExam}
                onPatientSelect={handlePatientSelect}
                patientData={patientData}
                nextPatientData={nextPatientData}
                isPrescriptionStepOpen={isPrescriptionStepOpen}
              />
            </>
          )}
        </div>

        {/* Dialogs */}
        <LabResultDialog
          open={dialogs.labResult}
          onOpenChange={(open) => setDialogOpen('labResult', open)}
          formData={labResultForm}
          onFormChange={setLabResultForm}
          onSubmit={handleAddLabResult}
        />

        <VaccinationDialog
          open={dialogs.vaccination}
          onOpenChange={(open) => setDialogOpen('vaccination', open)}
          formData={vaccinationForm}
          onFormChange={setVaccinationForm}
          onSubmit={handleAddVaccination}
        />

        <PrescriptionRenewalDialog
          open={dialogs.prescriptionRenewal}
          onOpenChange={(open) => setDialogOpen('prescriptionRenewal', open)}
          formData={prescriptionRenewalForm}
          onFormChange={setPrescriptionRenewalForm}
          onSubmit={handlePrescriptionRenewal}
        />

        <LabIntegrationDialog
          open={dialogs.labIntegration}
          onOpenChange={(open) => setDialogOpen('labIntegration', open)}
          formData={labIntegrationForm}
          onFormChange={setLabIntegrationForm}
          onSubmit={handleAddLabIntegration}
        />
      </div>
    </PageTransition>
  )
}
