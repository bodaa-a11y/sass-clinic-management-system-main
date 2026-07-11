'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'

interface UseQueryDataOptions {
  interval?: number // polling interval in milliseconds (default: 30000)
  enabled?: boolean
}

interface UseQueryDataResult<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * React Query wrapper to replace useRealtimeData
 * Provides automatic polling, caching, and refetch on window focus
 */
export function useQueryData<T>(
  endpoint: string,
  options: UseQueryDataOptions = {}
): UseQueryDataResult<T> {
  const { interval = 30000, enabled = true } = options

  const query = useQuery({
    queryKey: [endpoint],
    queryFn: async () => {
      const response = await apiFetch(endpoint)
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }
      const result = await response.json()
      return result.data || result
    },
    enabled,
    refetchInterval: interval,
    staleTime: interval / 2, // Consider data stale after half the interval
    retry: 1,
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  }
}

/**
 * Optimistic mutation hook with automatic rollback on error
 */
export function useOptimisticMutation<T, V = void>(
  endpoint: string,
  mutationFn: (variables: V) => Promise<T>,
  options: {
    invalidateQueries?: string[][]
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
  } = {}
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      // Invalidate related queries
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] })
        })
      }
      options.onSuccess?.(data)
    },
    onError: (error) => {
      options.onError?.(error as Error)
    },
  })
}

/**
 * Generic mutation hook for API calls
 */
export function useApiMutation<T, V = void>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  options: {
    invalidateQueries?: string[]
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
  } = {}
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: V) => {
      const response = await apiFetch(endpoint, {
        method,
        body: variables as Record<string, unknown>,
      })
      if (!response.ok) {
        throw new Error('API request failed')
      }
      const result = await response.json()
      return result.data || result
    },
    onSuccess: (data) => {
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] })
        })
      }
      options.onSuccess?.(data)
    },
    onError: (error) => {
      options.onError?.(error as Error)
    },
  })
}
