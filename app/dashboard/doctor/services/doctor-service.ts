import { apiFetch } from '@/lib/api-client'

export interface Doctor {
  id: string
  name: string
  role: string
}

/**
 * Fetch all doctors for a clinic
 */
export const fetchDoctors = async (clinicId: string): Promise<Doctor[]> => {
  const response = await apiFetch(`/clinics/${clinicId}/staff?role=doctor`)
  if (!response.ok) {
    throw new Error('Failed to fetch doctors')
  }
  return response.json()
}

/**
 * Fetch doctor by ID
 */
export const fetchDoctorById = async (clinicId: string, doctorId: string): Promise<Doctor> => {
  const response = await apiFetch(`/clinics/${clinicId}/staff/${doctorId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch doctor')
  }
  return response.json()
}
