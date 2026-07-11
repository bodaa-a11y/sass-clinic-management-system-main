'use client'

import { useMemo } from 'react'
import { store } from '@/lib/store'
import { can } from '@/lib/permissions'

export function usePermission(module: string) {
  const user = store.getUser()

  const permissions = useMemo(() => {
    if (!user?.permissions) {
      return {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
      }
    }

    return {
      canView: can(user.permissions, module, 'view'),
      canCreate: can(user.permissions, module, 'create'),
      canEdit: can(user.permissions, module, 'edit'),
      canDelete: can(user.permissions, module, 'delete'),
    }
  }, [user?.permissions, module])

  return permissions
}

export function useSpecificPermission(permission: string) {
  const user = store.getUser()

  const [resource, action] = permission.split(':')

  const hasPermission = useMemo(() => {
    if (!user?.permissions) return false
    return can(user.permissions, resource, action as any)
  }, [user?.permissions, permission])

  return hasPermission
}
