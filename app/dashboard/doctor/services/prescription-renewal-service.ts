import { apiFetch } from '@/lib/api-client'
import { PrescriptionRenewalForm } from '../types/lab.types'

/**
 * Fetch prescription renewals for a clinic
 */
export const fetchPrescriptionRenewals = async (clinicId: string): Promise<any[]> => {
  const response = await apiFetch(`/clinics/${clinicId}/prescription-renewals`)
  if (!response.ok) {
    throw new Error('Failed to fetch prescription renewals')
  }
  return response.json()
}

/**
 * Submit prescription renewal request
 */
export const submitPrescriptionRenewal = async (
  clinicId: string,
  formData: PrescriptionRenewalForm
): Promise<any> => {
  const response = await apiFetch(`/clinics/${clinicId}/prescription-renewals`, {
    method: 'POST',
    body: JSON.stringify(formData),
  })
  if (!response.ok) {
    throw new Error('Failed to submit prescription renewal')
  }
  return response.json()
}

/**
 * Approve prescription renewal
 */
export const approvePrescriptionRenewal = async (
  clinicId: string,
  renewalId: string
): Promise<void> => {
  const response = await apiFetch(`/clinics/${clinicId}/prescription-renewals/${renewalId}/approve`, {
    method: 'POST',
    body: JSON.stringify({
      status: 'approved',
      renewalDate: new Date().toISOString(),
    }),
  })
  if (!response.ok) {
    throw new Error('Failed to approve prescription renewal')
  }
}

/**
 * Reject prescription renewal
 */
export const rejectPrescriptionRenewal = async (
  clinicId: string,
  renewalId: string
): Promise<void> => {
  const response = await apiFetch(`/clinics/${clinicId}/prescription-renewals/${renewalId}/reject`, {
    method: 'POST',
    body: JSON.stringify({
      status: 'rejected',
    }),
  })
  if (!response.ok) {
    throw new Error('Failed to reject prescription renewal')
  }
}
