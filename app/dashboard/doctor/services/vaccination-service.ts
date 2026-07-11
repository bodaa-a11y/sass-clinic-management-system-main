import { apiFetch } from '@/lib/api-client'
import { VaccinationForm } from '../types/lab.types'

/**
 * Fetch vaccinations for a clinic
 */
export const fetchVaccinations = async (clinicId: string): Promise<any[]> => {
  const response = await apiFetch(`/clinics/${clinicId}/vaccinations`)
  if (!response.ok) {
    throw new Error('Failed to fetch vaccinations')
  }
  return response.json()
}

/**
 * Add new vaccination
 */
export const addVaccination = async (clinicId: string, formData: VaccinationForm): Promise<any> => {
  const response = await apiFetch(`/clinics/${clinicId}/vaccinations`, {
    method: 'POST',
    body: JSON.stringify(formData),
  })
  if (!response.ok) {
    throw new Error('Failed to add vaccination')
  }
  return response.json()
}
