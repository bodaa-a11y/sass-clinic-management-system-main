'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { store } from '@/lib/store'
import { can } from '@/lib/permissions'

interface LayoutGuardProps {
  children: React.ReactNode
  allowedRoles?: string[]
  module?: string
  requiredPermission?: string
}

export function LayoutGuard({ children, allowedRoles, module, requiredPermission }: LayoutGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const user = store.getUser()

    if (!user) {
      // Not logged in, redirect to login
      router.push('/dashboard/login')
      return
    }

    // Check role restriction
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      console.warn(`[LayoutGuard] User ${user.role} not in allowed roles:`, allowedRoles)
      router.push('/dashboard')
      return
    }

    // Check module permission
    if (module && user.permissions) {
      if (!can(user.permissions, module, 'view')) {
        console.warn(`[LayoutGuard] User ${user.role} does not have view permission for module:`, module)
        router.push('/dashboard')
        return
      }
    }

    // Check specific permission
    if (requiredPermission && user.permissions) {
      const [resource, action] = requiredPermission.split(':')
      if (!can(user.permissions, resource, action as any)) {
        console.warn(`[LayoutGuard] User ${user.role} does not have permission:`, requiredPermission)
        router.push('/dashboard')
        return
      }
    }

    setIsAuthorized(true)
    setIsLoading(false)
  }, [allowedRoles, module, requiredPermission, router, pathname])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
