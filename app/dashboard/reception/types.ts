export interface Appointment {
  id: string
  patientId: string
  patientName?: string
  patientPhone?: string
  startTime: string
  appointmentDate?: string
  date?: string
  status: 'pending' | 'confirmed' | 'in-waiting-room' | 'in-progress' | 'done' | 'cancelled' | 'no-show'
  doctorId?: string
  doctorName?: string
  isRecurring?: boolean
  recurringPattern?: 'daily' | 'weekly' | 'monthly'
  recurringEndDate?: string
  priority?: 'normal' | 'priority' | 'emergency'
}

export interface Patient {
  id: string
  fullName: string
  phone: string
  email?: string
  dateOfBirth?: string
  address?: string
  insuranceNumber?: string
  insuranceProvider?: string
  medicalHistory?: string
  currentMedications?: string
  emergencyContact?: string
  emergencyPhone?: string
}
