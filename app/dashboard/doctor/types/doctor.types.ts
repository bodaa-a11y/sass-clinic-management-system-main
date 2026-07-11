export interface Patient {
  id: string
  fullName: string
  phone: string
  dateOfBirth?: string
  allergies?: string
  medicalHistory?: string
}

export interface Appointment {
  id: string
  patientId: string
  patientName: string
  patientPhone?: string
  startTime: string
  status: 'pending' | 'confirmed' | 'in-waiting-room' | 'in-progress' | 'done' | 'cancelled' | 'no-show'
}

export interface PatientData {
  patient: Patient
  medicalRecords?: Array<{
    diagnosis: string
    createdAt: string
  }>
  stats?: {
    totalVisits: number
    lastVisitDate?: string
  }
}

export interface LabResult {
  id: string
  patientId: string
  patientName: string
  testName: string
  testType: string
  result: string
  normalRange?: string
  status: 'pending' | 'completed' | 'reviewed'
  testDate: string
  notes?: string
  sharedWithPatient?: boolean
  sharedDate?: string
}

export interface Vaccination {
  id: string
  patientId: string
  patientName: string
  vaccineName: string
  vaccineType: string
  doseNumber: number
  administrationDate: string
  nextDueDate?: string
  batchNumber?: string
  site: string
  notes?: string
}

export interface PrescriptionRenewal {
  id: string
  patientId: string
  patientName: string
  medicationName: string
  dosage: string
  frequency: string
  originalPrescriptionDate: string
  renewalDate?: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
}

export interface LabIntegration {
  id: string
  labName: string
  labType: 'internal' | 'external'
  apiEndpoint?: string
  apiKey?: string
  status: 'active' | 'inactive'
  supportedTests: string[]
}
