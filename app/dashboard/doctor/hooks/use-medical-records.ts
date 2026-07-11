import { useEffect, useState } from 'react'
import { useDoctorStore } from '../stores/doctor-store'

export interface MedicalRecord {
  id: string
  patientId: string
  doctorId: string
  visitDate: string
  chiefComplaint: string
  diagnosis: string
  clinicalNotes?: string
  treatmentPlan: string
  symptoms?: string
  vitalSigns?: string
  followUpDate?: string
  createdAt: string
  updatedAt: string
}

export const useMedicalRecords = (patientId?: string) => {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const clinicId = useDoctorStore((state) => state.clinicId)

  useEffect(() => {
    if (!patientId || !clinicId) return

    const fetchRecords = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/clinics/${clinicId}/medical-records?patientId=${patientId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch medical records')
        }

        const data = await response.json()
        setRecords(data.records || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Failed to fetch medical records:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecords()
  }, [patientId, clinicId])

  return { records, isLoading, error }
}
