import { useState } from 'react'
import { useDoctorStore } from '../stores/doctor-store'
import { fetchVaccinations, addVaccination } from '../services/vaccination-service'
import { VaccinationForm } from '../types/lab.types'
import { toast } from 'sonner'

export const useVaccinations = () => {
  const { clinicId, vaccinationForm, setVaccinationForm, resetVaccinationForm, setDialogOpen } = useDoctorStore()
  const [vaccinations, setVaccinations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleAddVaccination = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clinicId) return

    try {
      await addVaccination(clinicId, vaccinationForm)
      toast.success('تم إضافة التطعيم بنجاح')
      setDialogOpen('vaccination', false)
      resetVaccinationForm()
      await refetchVaccinations()
    } catch {
      toast.error('حدث خطأ أثناء إضافة التطعيم')
    }
  }

  const refetchVaccinations = async () => {
    if (!clinicId) return

    setIsLoading(true)
    try {
      const data = await fetchVaccinations(clinicId)
      setVaccinations(data)
    } catch {
      toast.error('فشل جلب التطعيمات')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    vaccinations,
    vaccinationForm,
    isLoading,
    handleAddVaccination,
    refetchVaccinations,
  }
}
