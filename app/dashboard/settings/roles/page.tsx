'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api-client'
import { store } from '@/lib/store'
import { Button } from '@/components/ui/button-redesigned'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Shield, Save } from 'lucide-react'
import { PageTransition } from '@/components/animations/page-transition'
import { SlideIn } from '@/components/animations/feedback-animations'

interface RolePermissions {
  role: string
  displayName: string
  permissions: {
    patients: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    appointments: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    medical_records: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    prescriptions: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    invoices: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    payments: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    specialties: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    calendar: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    schedule: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    'live-monitor': { view: boolean; create: boolean; edit: boolean; delete: boolean }
    staff_management: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    staff_management_limited: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    reports: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    dashboard: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    vitals: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  }
}

export default function RolesPage() {
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const user = store.getUser()
    if (user?.clinicId) {
      setClinicId(user.clinicId)
    }
  }, [])

  useEffect(() => {
    if (!clinicId) return
    fetchRolePermissions()
  }, [clinicId])

  const fetchRolePermissions = async () => {
    try {
      const response = await apiFetch(`/clinics/${clinicId}/roles`)
      if (response.ok) {
        const data = await response.json()
        setRolePermissions(data.data || [])
      }
    } catch (error) {
      toast.error('فشل تحميل الصلاحيات')
    }
  }

  const handlePermissionChange = (
    roleIndex: number,
    module: string,
    action: string,
    value: boolean
  ) => {
    const newPermissions = [...rolePermissions]
    ;(newPermissions[roleIndex].permissions as any)[module][action] = value
    setRolePermissions(newPermissions)
  }

  const handleSave = async () => {
    if (!clinicId) return
    setIsSaving(true)

    try {
      const response = await apiFetch(`/clinics/${clinicId}/roles`, {
        method: 'PUT',
        body: JSON.stringify({ rolePermissions })
      })

      if (response.ok) {
        toast.success('تم حفظ الصلاحيات بنجاح')
      } else {
        toast.error('فشل حفظ الصلاحيات')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الصلاحيات')
    } finally {
      setIsSaving(false)
    }
  }

  const moduleNames: Record<string, string> = {
    patients: 'المرضى',
    appointments: 'المواعيد',
    medical_records: 'السجلات الطبية',
    prescriptions: 'الأدوية',
    invoices: 'الفواتير',
    payments: 'المدفوعات',
    specialties: 'التخصصات',
    calendar: 'التقويم',
    schedule: 'الجدول',
    'live-monitor': 'المراقب المباشر',
    staff_management: 'إدارة طاقم العمل',
    staff_management_limited: 'إدارة الاستقبال',
    reports: 'التقارير',
    dashboard: 'لوحة التحكم',
    vitals: 'العلامات الحيوية',
  }

  const actionNames: Record<string, string> = {
    view: 'عرض',
    create: 'إنشاء',
    edit: 'تعديل',
    delete: 'حذف',
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <SlideIn direction="up" delay={0.1}>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-8 h-8 text-medical-blue" />
              إدارة الأدوار والصلاحيات
            </h1>
            <p className="text-slate-600 mt-1">
              إدارة صلاحيات الوصول لكل دور في النظام
            </p>
          </div>
        </SlideIn>

        {/* Save Button */}
        <SlideIn direction="up" delay={0.2}>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </SlideIn>

        {/* Role Permissions Cards */}
        {rolePermissions.map((role, roleIndex) => (
          <SlideIn key={role.role} direction="up" delay={0.3 + roleIndex * 0.1}>
            <Card>
              <CardHeader>
                <CardTitle>{role.displayName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.keys(role.permissions).map((module) => (
                  <div key={module} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">{moduleNames[module] || module}</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {Object.keys(actionNames).map((action) => (
                        <div key={action} className="flex items-center space-x-2 space-x-reverse">
                          <Checkbox
                            id={`${role.role}-${module}-${action}`}
                            checked={(role.permissions as any)[module][action]}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(roleIndex, module, action, checked as boolean)
                            }
                          />
                          <Label htmlFor={`${role.role}-${module}-${action}`} className="cursor-pointer">
                            {actionNames[action]}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </SlideIn>
        ))}
      </div>
    </PageTransition>
  )
}
