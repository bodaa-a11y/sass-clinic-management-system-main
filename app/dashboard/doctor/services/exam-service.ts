import { apiFetch } from '@/lib/api-client'
import { ExamSubmission } from '../types/exam.types'

/**
 * Start consultation session
 * Creates a new consultation or returns existing active one
 */
export const startConsultation = async (
  clinicId: string,
  appointmentId: string,
  patientId: string,
  doctorId: string
): Promise<{ consultationId: string; status: string; isExisting: boolean }> => {
  const response = await apiFetch(`/clinics/${clinicId}/consultations/start`, {
    method: 'POST',
    body: JSON.stringify({
      appointmentId,
      patientId,
      doctorId,
    }),
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to start consultation')
  }
  const data = await response.json()
  return {
    consultationId: data.consultationId,
    status: data.status,
    isExisting: data.isExisting || false,
  }
}

/**
 * Auto-save clinical data to consultation
 */
export const autoSaveConsultation = async (
  clinicId: string,
  consultationId: string,
  clinicalData: any,
  expectedUpdatedAt?: string
): Promise<{ success: boolean; consultation?: any; requiresRefresh?: boolean; completed?: boolean }> => {
  const response = await apiFetch(
    `/clinics/${clinicId}/consultations/${consultationId}/auto-save`,
    {
      method: 'POST',
      body: JSON.stringify({
        ...clinicalData,
        expectedUpdatedAt,
      }),
    }
  )

  if (response.status === 409) {
    const data = await response.json()
    return { success: false, requiresRefresh: true }
  }

  if (!response.ok) {
    throw new Error('Failed to auto-save consultation')
  }

  const data = await response.json()
  return {
    success: true,
    consultation: data.consultation,
    completed: data.completed || false
  }
}

/**
 * Update consultation status
 */
export const updateConsultationStatus = async (
  clinicId: string,
  consultationId: string,
  status: 'arrived' | 'in-progress' | 'completed' | 'cancelled'
): Promise<void> => {
  const response = await apiFetch(`/clinics/${clinicId}/consultations/${consultationId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('[ExamService] Failed to update consultation status:', errorData)
    throw new Error(errorData.error || 'Failed to update consultation status')
  }
}

/**
 * Complete consultation and archive to medical record
 */
export const completeConsultation = async (
  clinicId: string,
  consultationId: string,
  examData: ExamSubmission
): Promise<{ success: boolean; medicalRecordId?: string }> => {
  try {
    // 1. Update consultation status to completed
    await updateConsultationStatus(clinicId, consultationId, 'completed')

    // 2. Get consultation details to get doctorId
    const consultationResponse = await apiFetch(`/clinics/${clinicId}/consultations/${consultationId}`)
    if (!consultationResponse.ok) {
      throw new Error('Failed to fetch consultation')
    }
    const { consultation } = await consultationResponse.json()

    // 3. Archive consultation to medical record (snapshot)
    const response = await apiFetch(`/clinics/${clinicId}/consultations/${consultationId}/archive`, {
      method: 'POST',
      body: JSON.stringify({
        chiefComplaint: examData.diagnosis, // Using diagnosis as fallback
        diagnosis: examData.diagnosis,
        clinicalNotes: examData.clinicalNotes,
        treatmentPlan: examData.treatmentPlan,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to archive consultation')
    }

    const { medicalRecordId } = await response.json()
    console.log('completeConsultation - medicalRecordId:', medicalRecordId)

    // 4. Add prescriptions if any
    if (examData.prescriptions && examData.prescriptions.length > 0) {
      await addPrescriptions(clinicId, medicalRecordId, examData.prescriptions, examData.patientId, consultation.doctorId)
    }

    return { success: true, medicalRecordId }
  } catch (error) {
    console.error('Failed to complete consultation:', error)
    return { success: false }
  }
}

/**
 * Update appointment status (legacy support)
 */
export const updateAppointmentStatus = async (
  clinicId: string,
  appointmentId: string,
  status: string
): Promise<void> => {
  const response = await apiFetch(`/clinics/${clinicId}/appointments/${appointmentId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
  if (!response.ok) {
    throw new Error('Failed to update appointment status')
  }
}

/**
 * Create medical record (legacy support)
 */
export const createMedicalRecord = async (
  clinicId: string,
  recordData: any
): Promise<any> => {
  const response = await apiFetch(`/clinics/${clinicId}/medical-records`, {
    method: 'POST',
    body: JSON.stringify(recordData),
  })
  if (!response.ok) {
    throw new Error('Failed to create medical record')
  }
  return response.json()
}

/**
 * Add prescriptions to medical record
 */
export const addPrescriptions = async (
  clinicId: string,
  medicalRecordId: string,
  medications: any[],
  patientId: string,
  doctorId: string
): Promise<void> => {
  const response = await apiFetch(`/clinics/${clinicId}/prescriptions`, {
    method: 'POST',
    body: JSON.stringify({
      medicalRecordId,
      patientId,
      doctorId,
      medications: medications.map((m: any) => `${m.medicationName} - ${m.dosage} - ${m.frequency} - ${m.duration}`).join('\n'),
      instructions: medications.map((m: any) => m.instructions || 'حسب التعليمات').join('\n') || 'حسب التعليمات',
      status: 'active',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to add prescriptions')
  }
}

/**
 * Create invoice
 */
export const createInvoice = async (clinicId: string, invoiceData: any): Promise<any> => {
  const response = await apiFetch(`/clinics/${clinicId}/invoices`, {
    method: 'POST',
    body: JSON.stringify(invoiceData),
  })
  if (!response.ok) {
    throw new Error('Failed to create invoice')
  }
  return response.json()
}

/**
 * Schedule follow-up appointment
 */
export const scheduleFollowUp = async (
  clinicId: string,
  appointmentData: any
): Promise<any> => {
  const response = await apiFetch(`/clinics/${clinicId}/appointments`, {
    method: 'POST',
    body: JSON.stringify(appointmentData),
  })
  if (!response.ok) {
    throw new Error('Failed to schedule follow-up')
  }
  return response.json()
}

/**
 * Complete exam workflow (legacy - kept for backward compatibility)
 */
export const completeExam = async (
  clinicId: string,
  appointmentId: string,
  examData: ExamSubmission,
  doctorId: string
): Promise<{ success: boolean; invoiceNumber?: string }> => {
  try {
    // Update appointment status to in-progress
    await updateAppointmentStatus(clinicId, appointmentId, 'in-progress')

    // Create medical record
    const medicalRecord = await createMedicalRecord(clinicId, {
      patientId: examData.patientId,
      doctorId,
      chiefComplaint: examData.diagnosis,
      diagnosis: examData.diagnosis,
      clinicalNotes: examData.clinicalNotes,
      treatmentPlan: examData.treatmentPlan,
    })

    // Add prescriptions if any
    if (examData.prescriptions && examData.prescriptions.length > 0) {
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      await addPrescriptions(clinicId, medicalRecord.data.id, examData.prescriptions, examData.patientId, user?.id || '')
    }

    // Create invoice if requested
    let invoiceNumber
    if (examData.createInvoice) {
      const invoice = await createInvoice(clinicId, {
        patientId: examData.patientId,
        appointmentId,
        items: [{
          description: 'فحص طبي',
          quantity: 1,
          unitPrice: '100.00',
          totalPrice: '100.00',
          itemType: 'consultation',
        }],
        totalAmount: '100.00',
        subtotal: '100.00',
        taxAmount: '0',
        discountAmount: '0',
        dueDate: new Date().toISOString().split('T')[0],
      })
      invoiceNumber = invoice.data.invoiceNumber
    }

    // Schedule follow-up if requested
    if (examData.scheduleFollowUp && examData.followUpDate) {
      await scheduleFollowUp(clinicId, {
        patientId: examData.patientId,
        doctorId,
        appointmentDate: examData.followUpDate,
        startTime: '09:00',
        endTime: '09:30',
        notes: 'موعد متابعة',
        status: 'pending',
      })
    }

    return { success: true, invoiceNumber }
  } catch (error) {
    console.error('Failed to complete exam:', error)
    return { success: false }
  }
}
