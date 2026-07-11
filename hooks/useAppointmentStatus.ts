'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import { store } from '@/lib/store'
import { toast } from 'sonner'
import {
  validateStatusTransition,
  AppointmentStatus,
} from '@/lib/appointment-status-validator'

interface UseAppointmentStatusOptions {
  onSuccess?: (newStatus: AppointmentStatus) => void
  onError?: (error: Error) => void
}

export function useAppointmentStatus(options: UseAppointmentStatusOptions = {}) {
  const queryClient = useQueryClient()
  const [isUpdating, setIsUpdating] = useState(false)

  const mutation = useMutation({
    mutationFn: async ({
      appointmentId,
      newStatus,
    }: {
      appointmentId: string
      newStatus: AppointmentStatus
    }) => {
      const user = store.getUser()
      const response = await apiFetch(
        `/clinics/${user?.clinicId}/appointments/${appointmentId}`,
        {
          method: 'PUT',
          body: { status: newStatus },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update status')
      }

      return response.json()
    },
    onMutate: async (variables) => {
      setIsUpdating(true)

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['appointments'] })

      // Snapshot previous value
      const previousAppointments = queryClient.getQueryData(['appointments'])

      // Optimistically update
      queryClient.setQueryData(['appointments'], (old: any) => {
        if (!old) return old

        return old.map((apt: any) =>
          apt.id === variables.appointmentId
            ? { ...apt, status: variables.newStatus }
            : apt
        )
      })

      // Return context for rollback
      return { previousAppointments }
    },
    onError: (error, variables, context) => {
      // Rollback to previous value
      if (context?.previousAppointments) {
        queryClient.setQueryData(['appointments'], context.previousAppointments)
      }

      toast.error('فشل تحديث الحالة', {
        description: error.message,
      })

      options.onError?.(error)
      setIsUpdating(false)
    },
    onSuccess: (data, variables) => {
      toast.success('تم تحديث الحالة بنجاح')
      options.onSuccess?.(variables.newStatus)

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['medical-records'] })

      setIsUpdating(false)
    },
  })

  const updateStatus = async (
    appointmentId: string,
    currentStatus: AppointmentStatus,
    newStatus: AppointmentStatus
  ) => {
    const user = store.getUser()

    // Validate transition
    const validation = validateStatusTransition(
      currentStatus,
      newStatus,
      user?.role || ''
    )

    if (!validation.valid) {
      toast.error('Transition not allowed', {
        description: validation.reason,
      })
      return
    }

    return mutation.mutate({ appointmentId, newStatus })
  }

  return {
    updateStatus,
    isUpdating: isUpdating || mutation.isPending,
    error: mutation.error as Error | null,
  }
}

/**
 * Special hook for "Next Patient" workflow in Doctor Control Center
 * Handles two status changes atomically:
 * 1. Current patient: in-progress → done
 * 2. Next patient: in-waiting-room → in-progress
 */
export function useNextPatient() {
  const queryClient = useQueryClient()
  const [isUpdating, setIsUpdating] = useState(false)

  const mutation = useMutation({
    mutationFn: async ({
      currentAppointmentId,
      nextAppointmentId,
    }: {
      currentAppointmentId?: string
      nextAppointmentId: string
    }) => {
      const user = store.getUser()

      // Update current patient to done (if exists)
      if (currentAppointmentId) {
        await apiFetch(
          `/clinics/${user?.clinicId}/appointments/${currentAppointmentId}`,
          {
            method: 'PUT',
            body: { status: 'done' },
          }
        )
      }

      // Update next patient to in-progress
      const response = await apiFetch(
        `/clinics/${user?.clinicId}/appointments/${nextAppointmentId}`,
        {
          method: 'PUT',
          body: { status: 'in-progress' },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update appointments')
      }

      return response.json()
    },
    onMutate: async (variables) => {
      setIsUpdating(true)

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['appointments'] })

      // Snapshot previous value
      const previousAppointments = queryClient.getQueryData(['appointments'])

      // Optimistically update both appointments
      queryClient.setQueryData(['appointments'], (old: any) => {
        if (!old) return old

        return old.map((apt: any) => {
          if (variables.currentAppointmentId && apt.id === variables.currentAppointmentId) {
            return { ...apt, status: 'done' }
          }
          if (apt.id === variables.nextAppointmentId) {
            return { ...apt, status: 'in-progress' }
          }
          return apt
        })
      })

      return { previousAppointments }
    },
    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousAppointments) {
        queryClient.setQueryData(['appointments'], context.previousAppointments)
      }

      toast.error('فشل الانتقال للمريض التالي', {
        description: error.message,
      })

      setIsUpdating(false)
    },
    onSuccess: () => {
      toast.success('تم الانتقال للمريض التالي بنجاح')

      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['medical-records'] })

      setIsUpdating(false)
    },
  })

  const nextPatient = async (
    currentAppointmentId: string | undefined,
    nextAppointmentId: string
  ) => {
    return mutation.mutate({ currentAppointmentId, nextAppointmentId })
  }

  return {
    nextPatient,
    isUpdating: isUpdating || mutation.isPending,
    error: mutation.error as Error | null,
  }
}
