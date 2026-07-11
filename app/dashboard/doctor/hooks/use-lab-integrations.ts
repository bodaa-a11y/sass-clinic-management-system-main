import { useState } from 'react'
import { useDoctorStore } from '../stores/doctor-store'
import { fetchLabIntegrations, addLabIntegration } from '../services/lab-service'
import { LabIntegrationForm } from '../types/lab.types'
import { toast } from 'sonner'

export const useLabIntegrations = () => {
  const {
    clinicId,
    labIntegrationForm,
    setLabIntegrationForm,
    resetLabIntegrationForm,
    setDialogOpen,
  } = useDoctorStore()
  const [labIntegrations, setLabIntegrations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleAddLabIntegration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clinicId) return

    try {
      await addLabIntegration(clinicId, labIntegrationForm)
      toast.success('تم إضافة تكامل المختبر بنجاح')
      setDialogOpen('labIntegration', false)
      resetLabIntegrationForm()
      await refetchLabIntegrations()
    } catch {
      toast.error('حدث خطأ أثناء إضافة تكامل المختبر')
    }
  }

  const refetchLabIntegrations = async () => {
    if (!clinicId) return

    setIsLoading(true)
    try {
      const data = await fetchLabIntegrations(clinicId)
      setLabIntegrations(data)
    } catch {
      toast.error('فشل جلب تكاملات المختبر')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    labIntegrations,
    labIntegrationForm,
    isLoading,
    handleAddLabIntegration,
    refetchLabIntegrations,
  }
}
