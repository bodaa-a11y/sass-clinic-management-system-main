import { apiFetch } from '@/lib/api-client'
import { LabResult } from '../types/doctor.types'
import { LabResultForm } from '../types/lab.types'

/**
 * Fetch lab results for a clinic
 */
export const fetchLabResults = async (clinicId: string): Promise<LabResult[]> => {
  const response = await apiFetch(`/clinics/${clinicId}/lab-results`)
  if (!response.ok) {
    throw new Error('Failed to fetch lab results')
  }
  return response.json()
}

/**
 * Add new lab result
 */
export const addLabResult = async (clinicId: string, formData: LabResultForm): Promise<LabResult> => {
  const response = await apiFetch(`/clinics/${clinicId}/lab-results`, {
    method: 'POST',
    body: JSON.stringify({
      ...formData,
      status: 'completed',
      testDate: new Date().toISOString(),
    }),
  })
  if (!response.ok) {
    throw new Error('Failed to add lab result')
  }
  return response.json()
}

/**
 * Share lab result with patient
 */
export const shareLabResult = async (clinicId: string, labResultId: string): Promise<void> => {
  const response = await apiFetch(`/clinics/${clinicId}/lab-results/${labResultId}/share`, {
    method: 'POST',
    body: JSON.stringify({ sharedDate: new Date().toISOString() }),
  })
  if (!response.ok) {
    throw new Error('Failed to share lab result')
  }
}

/**
 * Add lab integration
 */
export const addLabIntegration = async (clinicId: string, integrationData: any): Promise<any> => {
  const response = await apiFetch(`/clinics/${clinicId}/lab-integrations`, {
    method: 'POST',
    body: JSON.stringify(integrationData),
  })
  if (!response.ok) {
    throw new Error('Failed to add lab integration')
  }
  return response.json()
}

/**
 * Fetch lab integrations
 */
export const fetchLabIntegrations = async (clinicId: string): Promise<any[]> => {
  const response = await apiFetch(`/clinics/${clinicId}/lab-integrations`)
  if (!response.ok) {
    throw new Error('Failed to fetch lab integrations')
  }
  return response.json()
}
