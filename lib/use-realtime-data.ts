'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api-client'

interface UseRealtimeDataOptions {
  interval?: number // polling interval in milliseconds (default: 30000)
  enabled?: boolean
}

interface UseRealtimeDataResult<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useRealtimeData<T>(
  endpoint: string,
  options: UseRealtimeDataOptions = {}
): UseRealtimeDataResult<T> {
  const { interval = 30000, enabled = true } = options
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await apiFetch(endpoint)
      if (response.ok) {
        const result = await response.json()
        setData(result.data || result)
        setError(null)
      } else {
        throw new Error('Failed to fetch data')
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    if (!enabled) return

    fetchData()

    const intervalId = setInterval(() => {
      fetchData()
    }, interval)

    return () => clearInterval(intervalId)
  }, [endpoint, interval, enabled, fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
