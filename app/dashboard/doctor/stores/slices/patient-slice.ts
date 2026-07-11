import { StateCreator } from 'zustand'

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
  doctorId: string
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

export interface PatientSlice {
  // State
  waitingPatients: Appointment[]
  selectedPatient: Appointment | null
  patientData: PatientData | null
  clinicId: string | null
  userId: string | null
  userRole: string | null
  selectedMedicalRecordId: string | null

  // Actions
  setWaitingPatients: (patients: Appointment[]) => void
  setSelectedPatient: (patient: Appointment | null) => void
  setPatientData: (data: PatientData | null) => void
  setClinicId: (id: string | null) => void
  setUserId: (id: string | null) => void
  setUserRole: (role: string | null) => void
  setSelectedMedicalRecordId: (id: string | null) => void
  resetPatientState: () => void
}

export const createPatientSlice: StateCreator<PatientSlice> = (set) => ({
  // Initial State
  waitingPatients: [],
  selectedPatient: null,
  patientData: null,
  clinicId: null,
  userId: null,
  userRole: null,
  selectedMedicalRecordId: null,

  // Actions
  setWaitingPatients: (patients) => set({ waitingPatients: patients }),
  setSelectedPatient: (patient) => set({ selectedPatient: patient }),
  setPatientData: (data) => set({ patientData: data }),
  setClinicId: (id) => set({ clinicId: id }),
  setUserId: (id) => set({ userId: id }),
  setUserRole: (role) => set({ userRole: role }),
  setSelectedMedicalRecordId: (id) => set({ selectedMedicalRecordId: id }),
  resetPatientState: () => set({
    selectedPatient: null,
    patientData: null,
    selectedMedicalRecordId: null,
  }),
})
