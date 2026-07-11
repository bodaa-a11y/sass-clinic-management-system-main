import { apiFetch } from '@/lib/api-client'
import { PatientData } from '../types/doctor.types'

/**
 * Fetch patient data by ID
 */
export const fetchPatientData = async (clinicId: string, patientId: string): Promise<PatientData> => {
  const response = await apiFetch(`/clinics/${clinicId}/patients/${patientId}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch patient data' }))
    console.error('[PatientService] Failed to fetch patient data:', error)
    throw new Error(error.error || 'Failed to fetch patient data')
  }
  const result = await response.json()
  // API returns { data: { patient, appointments, medicalRecords, ... } }
  // We need to return PatientData format
  return {
    patient: result.data?.patient || result.patient,
    medicalRecords: result.data?.medicalRecords || result.medicalRecords || [],
    stats: result.data?.stats || result.stats || {
      totalVisits: 0,
      lastVisitDate: null,
    },
  }
}

/**
 * Fetch all patients for a clinic
 */
export const fetchPatients = async (clinicId: string): Promise<any[]> => {
  const response = await apiFetch(`/clinics/${clinicId}/patients`)
  if (!response.ok) {
    throw new Error('Failed to fetch patients')
  }
  return response.json()
}

/**
 * Create new patient
 */
export const createPatient = async (clinicId: string, patientData: any): Promise<any> => {
  const response = await apiFetch(`/clinics/${clinicId}/patients`, {
    method: 'POST',
    body: JSON.stringify(patientData),
  })
  if (!response.ok) {
    throw new Error('Failed to create patient')
  }
  return response.json()
}

/**
 * Update patient data
 */
export const updatePatient = async (clinicId: string, patientId: string, patientData: any): Promise<any> => {
  const response = await apiFetch(`/clinics/${clinicId}/patients/${patientId}`, {
    method: 'PUT',
    body: JSON.stringify(patientData),
  })
  if (!response.ok) {
    throw new Error('Failed to update patient')
  }
  return response.json()
}
