import { useState, useCallback } from 'react'
import { useDoctorStore } from '../stores/doctor-store'
import { toast } from 'sonner'

interface MedicalDocument {
  id: string
  title: string
  documentType: string
  status: string
  description?: string
  fileUrl?: string
  url?: string
  imageUrl?: string
  rejectionReason?: string
  createdAt: string
  unifiedType?: string
  patientId: string
}

export const useMedicalDocuments = () => {
  const { clinicId } = useDoctorStore()
  const [documents, setDocuments] = useState<MedicalDocument[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchMedicalDocuments = useCallback(async (patientId: string) => {
    if (!clinicId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/clinics/${clinicId}/medical-documents?patientId=${patientId}`)
      const data = await response.json()
      setDocuments(data)
    } catch (error) {
      console.error('Failed to fetch medical documents:', error)
      toast.error('فشل جلب المستندات الطبية')
    } finally {
      setIsLoading(false)
    }
  }, [clinicId])

  return {
    documents,
    isLoading,
    fetchMedicalDocuments,
  }
}
