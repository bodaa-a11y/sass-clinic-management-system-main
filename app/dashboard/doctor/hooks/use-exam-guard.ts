import { useState } from 'react'
import { useDoctorStore } from '../stores/doctor-store'

export const useExamGuard = () => {
  const [showExitDialog, setShowExitDialog] = useState(false)
  const { isExamMode, setExamMode, setSelectedPatient, setPatientData, resetUIState } = useDoctorStore()

  const handleBackToWaitingList = () => {
    setShowExitDialog(true)
  }

  const handleConfirmExit = (save: boolean = false) => {
    // In the future, you can add auto-save logic here if save === true
    setExamMode(false)
    setSelectedPatient(null)
    setPatientData(null)
    resetUIState()
    setShowExitDialog(false)
  }

  const handleCancelExit = () => {
    setShowExitDialog(false)
  }

  return {
    showExitDialog,
    handleBackToWaitingList,
    handleConfirmExit,
    handleCancelExit,
  }
}
