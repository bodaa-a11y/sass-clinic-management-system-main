import { useState, useEffect } from 'react'
import { useDoctorStore } from '../stores/doctor-store'
import { fetchLabResults, addLabResult, shareLabResult } from '../services/lab-service'
import { LabResultForm } from '../types/lab.types'
import { LabResult } from '../types/doctor.types'
import { toast } from 'sonner'

export const useLabResults = () => {
  const { clinicId, labResultForm, setLabResultForm, resetLabResultForm, setDialogOpen, selectedPatient } = useDoctorStore()
  const [labResults, setLabResults] = useState<LabResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleAddLabResult = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clinicId) return

    try {
      await addLabResult(clinicId, labResultForm)
      toast.success('تم إضافة نتيجة المختبر بنجاح')
      setDialogOpen('labResult', false)
      resetLabResultForm()
      // Refetch lab results
      await refetchLabResults()
    } catch {
      toast.error('حدث خطأ أثناء إضافة نتيجة المختبر')
    }
  }

  // Set patientId and doctorId from selectedPatient when dialog opens
  const handleOpenLabResultDialog = () => {
    if (selectedPatient) {
      setLabResultForm({
        patientId: selectedPatient.patientId,
        patientName: selectedPatient.patientName || '',
        doctorId: selectedPatient.doctorId || '',
        testName: '',
        testType: '',
        result: '',
        normalRange: '',
        notes: ''
      })
    }
    setDialogOpen('labResult', true)
  }

  const handleShareLabResult = async (labResultId: string) => {
    if (!clinicId) return

    try {
      await shareLabResult(clinicId, labResultId)
      toast.success('تمت مشاركة النتيجة مع المريض')
      await refetchLabResults()
    } catch {
      toast.error('حدث خطأ أثناء مشاركة النتيجة')
    }
  }

  const refetchLabResults = async () => {
    if (!clinicId) return

    setIsLoading(true)
    try {
      const data = await fetchLabResults(clinicId)
      setLabResults(data)
    } catch (error) {
      console.error('Failed to fetch lab results:', error)
      setLabResults([]) // Return empty array on error
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch lab results on mount (only when clinicId is available)
  useEffect(() => {
    if (clinicId) {
      refetchLabResults()
    }
  }, [clinicId])

  return {
    labResults,
    labResultForm,
    isLoading,
    handleAddLabResult,
    handleShareLabResult,
    handleOpenLabResultDialog,
    refetchLabResults,
  }
}
