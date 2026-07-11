import { useState } from 'react'
import { useDoctorStore } from '../stores/doctor-store'
import {
  fetchPrescriptionRenewals,
  submitPrescriptionRenewal,
  approvePrescriptionRenewal,
  rejectPrescriptionRenewal,
} from '../services/prescription-renewal-service'
import { PrescriptionRenewalForm } from '../types/lab.types'
import { toast } from 'sonner'

export const usePrescriptionRenewals = () => {
  const {
    clinicId,
    prescriptionRenewalForm,
    setPrescriptionRenewalForm,
    resetPrescriptionRenewalForm,
    setDialogOpen,
  } = useDoctorStore()
  const [prescriptionRenewals, setPrescriptionRenewals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handlePrescriptionRenewal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clinicId) return

    try {
      await submitPrescriptionRenewal(clinicId, prescriptionRenewalForm)
      toast.success('تم إرسال طلب تجديد الوصفة بنجاح')
      setDialogOpen('prescriptionRenewal', false)
      resetPrescriptionRenewalForm()
      await refetchPrescriptionRenewals()
    } catch {
      toast.error('حدث خطأ أثناء إرسال طلب تجديد الوصفة')
    }
  }

  const handleApproveRenewal = async (renewalId: string) => {
    if (!clinicId) return

    try {
      await approvePrescriptionRenewal(clinicId, renewalId)
      toast.success('تمت الموافقة على تجديد الوصفة')
      await refetchPrescriptionRenewals()
    } catch {
      toast.error('حدث خطأ أثناء الموافقة على تجديد الوصفة')
    }
  }

  const handleRejectRenewal = async (renewalId: string) => {
    if (!clinicId) return

    try {
      await rejectPrescriptionRenewal(clinicId, renewalId)
      toast.success('تم رفض طلب تجديد الوصفة')
      await refetchPrescriptionRenewals()
    } catch {
      toast.error('حدث خطأ أثناء رفض طلب تجديد الوصفة')
    }
  }

  const refetchPrescriptionRenewals = async () => {
    if (!clinicId) return

    setIsLoading(true)
    try {
      const data = await fetchPrescriptionRenewals(clinicId)
      setPrescriptionRenewals(data)
    } catch {
      toast.error('فشل جلب طلبات تجديد الوصفة')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    prescriptionRenewals,
    prescriptionRenewalForm,
    isLoading,
    handlePrescriptionRenewal,
    handleApproveRenewal,
    handleRejectRenewal,
    refetchPrescriptionRenewals,
  }
}
