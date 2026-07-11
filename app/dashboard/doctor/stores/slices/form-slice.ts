import { StateCreator } from 'zustand'

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

export interface ConsultationData {
  consultationId?: string
  clinicId?: string
  patientId?: string
  doctorId?: string
  status?: string
  vitals?: Record<string, any>
  specialtyData?: Record<string, any>
  sectionsProgress?: Record<string, boolean>
  updatedAt?: string
}

export interface FormSlice {
  // State
  labResultForm: LabResultForm
  vaccinationForm: VaccinationForm
  prescriptionRenewalForm: PrescriptionRenewalForm
  labIntegrationForm: LabIntegrationForm
  consultationData: ConsultationData

  // Actions
  setLabResultForm: (form: Partial<LabResultForm>) => void
  resetLabResultForm: () => void
  setVaccinationForm: (form: Partial<VaccinationForm>) => void
  resetVaccinationForm: () => void
  setPrescriptionRenewalForm: (form: Partial<PrescriptionRenewalForm>) => void
  resetPrescriptionRenewalForm: () => void
  setLabIntegrationForm: (form: Partial<LabIntegrationForm>) => void
  resetLabIntegrationForm: () => void
  setConsultationData: (data: Partial<ConsultationData>) => void
  resetConsultationData: () => void
  resetAllForms: () => void
}

export const createFormSlice: StateCreator<FormSlice> = (set) => ({
  // Initial State
  labResultForm: {
    patientId: '',
    patientName: '',
    doctorId: '',
    testName: '',
    testType: '',
    result: '',
    normalRange: '',
    notes: ''
  },
  vaccinationForm: {
    patientId: '',
    patientName: '',
    vaccineName: '',
    vaccineType: '',
    doseNumber: 1,
    administrationDate: new Date().toISOString().split('T')[0],
    nextDueDate: '',
    batchNumber: '',
    site: '',
    notes: ''
  },
  prescriptionRenewalForm: {
    patientId: '',
    patientName: '',
    medicationName: '',
    dosage: '',
    frequency: '',
    originalPrescriptionDate: '',
    notes: ''
  },
  labIntegrationForm: {
    labName: '',
    labType: 'external',
    apiEndpoint: '',
    apiKey: '',
    supportedTests: []
  },
  consultationData: {},

  // Actions
  setLabResultForm: (form) => set((state) => ({
    labResultForm: { ...state.labResultForm, ...form }
  })),
  resetLabResultForm: () => set({
    labResultForm: {
      patientId: '',
      patientName: '',
      doctorId: '',
      testName: '',
      testType: '',
      result: '',
      normalRange: '',
      notes: ''
    }
  }),
  setVaccinationForm: (form) => set((state) => ({
    vaccinationForm: { ...state.vaccinationForm, ...form }
  })),
  resetVaccinationForm: () => set({
    vaccinationForm: {
      patientId: '',
      patientName: '',
      vaccineName: '',
      vaccineType: '',
      doseNumber: 1,
      administrationDate: new Date().toISOString().split('T')[0],
      nextDueDate: '',
      batchNumber: '',
      site: '',
      notes: ''
    }
  }),
  setPrescriptionRenewalForm: (form) => set((state) => ({
    prescriptionRenewalForm: { ...state.prescriptionRenewalForm, ...form }
  })),
  resetPrescriptionRenewalForm: () => set({
    prescriptionRenewalForm: {
      patientId: '',
      patientName: '',
      medicationName: '',
      dosage: '',
      frequency: '',
      originalPrescriptionDate: '',
      notes: ''
    }
  }),
  setLabIntegrationForm: (form) => set((state) => ({
    labIntegrationForm: { ...state.labIntegrationForm, ...form }
  })),
  resetLabIntegrationForm: () => set({
    labIntegrationForm: {
      labName: '',
      labType: 'external',
      apiEndpoint: '',
      apiKey: '',
      supportedTests: []
    }
  }),
  setConsultationData: (data) => set((state) => ({
    consultationData: { ...state.consultationData, ...data }
  })),
  resetConsultationData: () => set({
    consultationData: {}
  }),
  resetAllForms: () => set({
    labResultForm: {
      patientId: '',
      patientName: '',
      doctorId: '',
      testName: '',
      testType: '',
      result: '',
      normalRange: '',
      notes: ''
    },
    vaccinationForm: {
      patientId: '',
      patientName: '',
      vaccineName: '',
      vaccineType: '',
      doseNumber: 1,
      administrationDate: new Date().toISOString().split('T')[0],
      nextDueDate: '',
      batchNumber: '',
      site: '',
      notes: ''
    },
    prescriptionRenewalForm: {
      patientId: '',
      patientName: '',
      medicationName: '',
      dosage: '',
      frequency: '',
      originalPrescriptionDate: '',
      notes: ''
    },
    labIntegrationForm: {
      labName: '',
      labType: 'external',
      apiEndpoint: '',
      apiKey: '',
      supportedTests: []
    },
    consultationData: {}
  }),
})
