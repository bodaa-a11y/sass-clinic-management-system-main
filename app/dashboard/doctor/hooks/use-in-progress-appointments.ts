import { useEffect, useState, useCallback } from 'react'
import { useDoctorStore } from '../stores/doctor-store'
import { Appointment } from '../stores/slices/patient-slice'

export const useInProgressAppointments = () => {
  const { clinicId, userId, userRole } = useDoctorStore()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchInProgressAppointments = useCallback(async () => {
    if (!clinicId) {
      setAppointments([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/clinics/${clinicId}/appointments?status=in-progress`)
      const data = await response.json()
      const appointmentsList = Array.isArray(data) ? data : data.data || []

      // Role-based filtering:
      // - clinic_admin: can see all in-progress appointments
      // - doctor: can see only their own in-progress appointments
      let filteredAppointments = appointmentsList
      if (userRole === 'doctor' && userId) {
        filteredAppointments = appointmentsList.filter(
          (apt: Appointment) => apt.doctorId === userId
        )
      }

      setAppointments(filteredAppointments)
    } catch (error) {
      console.error('Failed to fetch in-progress appointments:', error)
      setAppointments([])
    } finally {
      setIsLoading(false)
    }
  }, [clinicId, userId, userRole])

  useEffect(() => {
    if (clinicId) {
      fetchInProgressAppointments()
    }
  }, [clinicId, fetchInProgressAppointments])

  // Poll every 30 seconds
  useEffect(() => {
    if (!clinicId) return

    const interval = setInterval(() => {
      fetchInProgressAppointments()
    }, 30000)

    return () => clearInterval(interval)
  }, [clinicId, fetchInProgressAppointments])

  return {
    appointments,
    isLoading,
    refetch: fetchInProgressAppointments,
  }
}
