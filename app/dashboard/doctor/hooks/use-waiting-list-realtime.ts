import { useEffect, useRef } from 'react'

export const useWaitingListRealtime = (clinicId: string | null, onMessage: () => void) => {
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!clinicId) return

    // Create SSE connection
    const connect = () => {
      try {
        const eventSource = new EventSource(`/api/clinics/${clinicId}/waiting-list/events`)
        eventSourceRef.current = eventSource

        // Listen for messages
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'error') {
              console.warn('[SSE] Server error:', data.error)
              return // Don't trigger refetch on error
            }
            onMessage() // Trigger refetch
          } catch (e) {
            console.warn('[SSE] Failed to parse event:', e)
          }
        }

        // Handle errors
        eventSource.onerror = (error) => {
          console.warn('[SSE] Connection error, will attempt to reconnect...')
          // Close the connection
          eventSource.close()
          eventSourceRef.current = null
          
          // Attempt to reconnect after 5 seconds
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[SSE] Attempting to reconnect...')
            connect()
          }, 5000)
        }

        // Log successful connection
        eventSource.onopen = () => {
          console.log('[SSE] Connected successfully')
        }
      } catch (error) {
        console.error('[SSE] Failed to create connection:', error)
      }
    }

    connect()

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [clinicId, onMessage])

  return eventSourceRef.current
}
