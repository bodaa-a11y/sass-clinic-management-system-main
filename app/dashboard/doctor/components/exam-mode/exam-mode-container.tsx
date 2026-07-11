import { PatientExamCard } from '@/components/patient-exam-card'
import { ExamHeader } from './exam-header'
import { ExamTabs } from './exam-tabs'
import { ExamExitDialog } from '../dialogs/exam-exit-dialog'
import { PatientSidebar } from '../patient-sidebar'
import { useState, useEffect } from 'react'

interface ExamModeContainerProps {
  patientName: string
  patientId: string
  patientData: any
  clinicId?: string
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  onStepChange: (step: number) => void
  labResults?: any[]
  onAddLabResult: () => void
  isPrescriptionStepOpen: boolean
  showExitDialog?: boolean
  onConfirmExit?: (save: boolean) => void
  onCancelExit?: () => void
  radiologyImages?: any[]
  medicalDocuments?: any[]
  onAddRadiology?: () => void
  onAddDocument?: () => void
}

export function ExamModeContainer({
  patientName,
  patientId,
  patientData,
  clinicId,
  onSubmit,
  onCancel,
  onStepChange,
  labResults,
  onAddLabResult,
  isPrescriptionStepOpen,
  showExitDialog,
  onConfirmExit,
  onCancelExit,
  radiologyImages = [],
  medicalDocuments = [],
  onAddRadiology,
  onAddDocument,
}: ExamModeContainerProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string>('')

  // Track current step based on isPrescriptionStepOpen
  useEffect(() => {
    if (isPrescriptionStepOpen) {
      setCurrentStep(5) // Prescription is the last step
    } else {
      setCurrentStep(1) // Default to first step
    }
  }, [isPrescriptionStepOpen])

  // Simulate auto-save indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAutoSaving(true)
      setTimeout(() => {
        setIsAutoSaving(false)
        const now = new Date()
        setLastSaved(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`)
      }, 1000)
    }, 10000) // Auto-save every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const handleStepChange = (step: number) => {
    setCurrentStep(step)
    onStepChange(step)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden">
      {/* Main Content - Exam Form (60%) */}
      <div className="lg:col-span-7 overflow-y-auto">
        <div className="space-y-6">
          <ExamHeader 
            patientName={patientName} 
            onClose={onCancel}
            currentStep={currentStep}
            totalSteps={5}
            isAutoSaving={isAutoSaving}
            lastSaved={lastSaved}
          />

          <PatientExamCard
            patientData={patientData}
            isPrescriptionStepOpen={isPrescriptionStepOpen}
          />

          <ExamTabs
            patientName={patientName}
            patientId={patientId}
            clinicId={clinicId}
            onSubmit={onSubmit}
            onCancel={onCancel}
            onStepChange={handleStepChange}
            labResults={labResults}
            onAddLabResult={onAddLabResult}
            isPrescriptionStepOpen={isPrescriptionStepOpen}
          />
        </div>
      </div>

      {/* Sidebar - Patient Info (40%) */}
      <div className="lg:col-span-5 overflow-hidden">
        <PatientSidebar
          patientData={patientData}
          labResults={labResults}
          radiologyImages={radiologyImages}
          medicalDocuments={medicalDocuments}
          onAddLabResult={onAddLabResult}
          onAddRadiology={onAddRadiology}
          onAddDocument={onAddDocument}
        />
      </div>

      {showExitDialog && onConfirmExit && onCancelExit && (
        <ExamExitDialog
          open={showExitDialog}
          onOpenChange={onCancelExit}
          onConfirm={onConfirmExit}
        />
      )}
    </div>
  )
}
