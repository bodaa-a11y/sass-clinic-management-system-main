'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api-client'
import { store } from '@/lib/store'
import { useRealtimeData } from '@/lib/use-realtime-data'
import { useTenant } from '@/lib/tenant-context'
import { PageTransition } from '@/components/animations/page-transition'
import { AdminTabs } from './components/admin-tabs'
import { AdminDashboard } from './components/admin-dashboard'
import { StaffTab } from './components/staff-tab'
import { PermissionsTab } from './components/permissions-tab'

interface Staff {
  id: string
  name: string
  email: string
  phone?: string
  role: 'doctor' | 'receptionist' | 'nurse'
  isActive: boolean
  department?: string
}

interface RolePermissions {
  role: string
  roleLabel: string
  permissions: string[]
}

export default function AdminPageV2() {
  const [clinicId, setClinicId] = useState<string | null>(null)
  const { facilityType } = useTenant()

  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([
    {
      role: 'doctor',
      roleLabel: 'طبيب',
      permissions: ['dashboard', 'appointments', 'patients', 'pharmacy', 'reports']
    },
    {
      role: 'receptionist',
      roleLabel: 'استقبال',
      permissions: ['dashboard', 'appointments', 'patients']
    },
    {
      role: 'clinic_admin',
      roleLabel: 'مشرف العيادة',
      permissions: ['dashboard', 'appointments', 'patients', 'finance', 'reports', 'settings', 'staff']
    }
  ])

  useEffect(() => {
    const user = store.getUser()
    if (user?.clinicId) {
      setClinicId(user.clinicId)
    }
  }, [])

  const { data: staff } = useRealtimeData<Staff[]>(
    clinicId ? `/clinics/${clinicId}/staff` : '',
    { interval: 30000, enabled: !!clinicId }
  )

  const handleAddStaff = async (data: any) => {
    if (!clinicId) return
    try {
      await apiFetch(`/clinics/${clinicId}/staff`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
    } catch (error) {
      console.error('Failed to add staff:', error)
    }
  }

  const handleEditStaff = async (id: string, data: any) => {
    if (!clinicId) return
    try {
      await apiFetch(`/clinics/${clinicId}/staff/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
    } catch (error) {
      console.error('Failed to edit staff:', error)
    }
  }

  const handleDeleteStaff = async (id: string) => {
    if (!clinicId) return
    try {
      await apiFetch(`/clinics/${clinicId}/staff/${id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Failed to delete staff:', error)
    }
  }

  const handleSavePermissions = async (data: RolePermissions[]) => {
    if (!clinicId) return
    try {
      await apiFetch(`/clinics/${clinicId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissions: data })
      })
      setRolePermissions(data)
    } catch (error) {
      console.error('Failed to save permissions:', error)
    }
  }

  // Calculate dashboard stats
  const totalStaff = staff?.length || 0
  const activeDoctors = staff?.filter(s => s.role === 'doctor' && s.isActive).length || 0
  const activeReceptionists = staff?.filter(s => s.role === 'receptionist' && s.isActive).length || 0

  return (
    <PageTransition>
      <div className="space-y-6">
        <AdminTabs>
          {/* Dashboard Tab */}
          <AdminDashboard
            totalStaff={totalStaff}
            activeDoctors={activeDoctors}
            activeReceptionists={activeReceptionists}
            todayAppointments={0} // TODO: Fetch from API
            monthlyRevenue="0" // TODO: Calculate from invoices
            pendingInvoices={0} // TODO: Fetch from API
            clinicName={undefined} // TODO: Fetch from API
            facilityType={facilityType}
          />

          {/* Staff Tab */}
          <StaffTab
            staff={staff || []}
            onAdd={handleAddStaff}
            onEdit={handleEditStaff}
            onDelete={handleDeleteStaff}
            facilityType={facilityType}
          />

          {/* Permissions Tab */}
          <PermissionsTab
            permissions={rolePermissions}
            onSave={handleSavePermissions}
          />

          {/* Settings Tab - Placeholder */}
          <div className="text-center py-12">
            <p className="text-gray-500">قسم الإعدادات قيد التطوير...</p>
          </div>
        </AdminTabs>
      </div>
    </PageTransition>
  )
}
