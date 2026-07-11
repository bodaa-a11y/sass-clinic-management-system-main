import { useEffect, useRef } from 'react'

export const useAppointmentsRealtime = (clinicId: string | null, onData: (data: any[]) => void) => {
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    // Close existing connection before creating new one
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    if (!clinicId) return

    // Create SSE connection
    const eventSource = new EventSource(`/api/clinics/${clinicId}/appointments/events`)
    eventSourceRef.current = eventSource

    // Listen for messages
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'error') {
          console.error('SSE Error from server:', data.error)
          return // Don't trigger update on error
        }
        if (data.type === 'initial' || data.type === 'update') {
          onData(data.data) // Send data directly instead of triggering refetch
        }
      } catch (e) {
        console.error('Failed to parse SSE event:', e)
      }
    }

    // Handle errors
    eventSource.onerror = (error) => {
      console.error('SSE Error:', error)
      // Close the connection
      eventSource.close()
    }

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [clinicId, onData])

  return eventSourceRef.current
}
