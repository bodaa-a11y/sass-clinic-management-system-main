export interface Prescription {
  medicationName: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

export interface ExamForm {
  diagnosis: string
  clinicalNotes: string
  treatmentPlan: string
}

export interface ExamSubmission {
  patientId: string
  diagnosis: string
  clinicalNotes: string
  treatmentPlan: string
  prescriptions: Prescription[]
  createInvoice: boolean
  scheduleFollowUp: boolean
  followUpDate?: string
}
