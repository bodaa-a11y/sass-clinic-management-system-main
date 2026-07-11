export interface LabResultForm {
  patientId: string
  patientName: string
  doctorId: string
  testName: string
  testType: string
  result: string
  normalRange: string
  notes: string
}

export interface VaccinationForm {
  patientId: string
  patientName: string
  vaccineName: string
  vaccineType: string
  doseNumber: number
  administrationDate: string
  nextDueDate: string
  batchNumber: string
  site: string
  notes: string
}

export interface PrescriptionRenewalForm {
  patientId: string
  patientName: string
  medicationName: string
  dosage: string
  frequency: string
  originalPrescriptionDate: string
  notes: string
}

export interface LabIntegrationForm {
  labName: string
  labType: 'internal' | 'external'
  apiEndpoint: string
  apiKey: string
  supportedTests: string[]
}
