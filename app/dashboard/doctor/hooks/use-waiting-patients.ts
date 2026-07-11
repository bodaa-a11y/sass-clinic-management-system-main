import { useEffect, useState, useCallback } from 'react'
import { useDoctorStore } from '../stores/doctor-store'
import { Appointment } from '../types/doctor.types'
import { useWaitingListRealtime } from './use-waiting-list-realtime'

export const useWaitingPatients = () => {
  const { clinicId, setWaitingPatients, setLoading } = useDoctorStore()
  const [waitingPatients, setLocalWaitingPatients] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchWaitingPatients = useCallback(async () => {
    if (!clinicId) {
      setIsLoading(false)
      return
    }

    // Set timeout to ensure loading state is cleared even if fetch hangs
    const timeoutId = setTimeout(() => {
      setIsLoading(false)
    }, 10000) // 10 second timeout

    try {
      const { apiFetch } = await import('@/lib/api-client')
      const response = await apiFetch(`/clinics/${clinicId}/appointments?status=in-waiting-room`)
      const data = await response.json()
      const patients = Array.isArray(data) ? data : data.data || []
      setWaitingPatients(patients)
      setLocalWaitingPatients(patients)
    } catch (error) {
      console.error('Failed to fetch waiting patients:', error)
      setLocalWaitingPatients([])
    } finally {
      clearTimeout(timeoutId)
      setIsLoading(false)
    }
  }, [clinicId, setWaitingPatients])

  // SSE for real-time updates
  useWaitingListRealtime(clinicId, fetchWaitingPatients)

  // Initial fetch
  useEffect(() => {
    if (clinicId) {
      fetchWaitingPatients()
    } else {
      setIsLoading(false)
    }
  }, [clinicId, fetchWaitingPatients])

  // Smart polling fallback (every 30s)
  useEffect(() => {
    if (!clinicId) return

    const interval = setInterval(() => {
      fetchWaitingPatients()
    }, 30000)

    return () => clearInterval(interval)
  }, [clinicId, fetchWaitingPatients])

  return {
    waitingPatients: Array.isArray(waitingPatients) ? waitingPatients : [],
    isLoading,
    refetch: fetchWaitingPatients,
  }
}
