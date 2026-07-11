'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button-redesigned'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Shield, Save, RefreshCw } from 'lucide-react'
import { SlideIn } from '@/components/animations/feedback-animations'

interface Permission {
  id: string
  label: string
  description: string
}

interface RolePermissions {
  role: string
  roleLabel: string
  permissions: string[]
}

interface PermissionsTabProps {
  permissions: RolePermissions[]
  onSave: (data: RolePermissions[]) => void
}

const allPermissions: Permission[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'الوصول للوحة التحكم' },
  { id: 'appointments', label: 'المواعيد', description: 'إدارة المواعيد' },
  { id: 'patients', label: 'المرضى', description: 'إدارة بيانات المرضى' },
  { id: 'finance', label: 'المالية', description: 'إدارة الفواتير والمدفوعات' },
  { id: 'pharmacy', label: 'الصيدلية', description: 'إدارة الأدوية والوصفات' },
  { id: 'reports', label: 'التقارير', description: 'عرض التقارير والإحصائيات' },
  { id: 'settings', label: 'الإعدادات', description: 'إدارة إعدادات النظام' },
  { id: 'staff', label: 'الموظفين', description: 'إدارة الموظفين' }
]

export function PermissionsTab({ permissions, onSave }: PermissionsTabProps) {
  const [localPermissions, setLocalPermissions] = useState<RolePermissions[]>(permissions)
  const [isSaving, setIsSaving] = useState(false)

  const togglePermission = (role: string, permissionId: string) => {
    setLocalPermissions(prev =>
      prev.map(rolePerm => {
        if (rolePerm.role === role) {
          const hasPermission = rolePerm.permissions.includes(permissionId)
          return {
            ...rolePerm,
            permissions: hasPermission
              ? rolePerm.permissions.filter(p => p !== permissionId)
              : [...rolePerm.permissions, permissionId]
          }
        }
        return rolePerm
      })
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(localPermissions)
      toast.success('تم حفظ الصلاحيات بنجاح')
    } catch (error) {
      toast.error('فشل حفظ الصلاحيات')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setLocalPermissions(permissions)
    toast.info('تم إعادة الصلاحيات')
  }

  return (
    <SlideIn direction="up" delay={0.2}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة الصلاحيات</h2>
            <p className="text-sm text-gray-500 mt-1">تحديد صلاحيات الوصول لكل دور</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 ml-2" />
              إعادة
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 ml-2" />
              {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="space-y-6">
          {localPermissions.map((rolePerm) => (
            <Card key={rolePerm.role}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {rolePerm.roleLabel}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {allPermissions.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-3 space-x-reverse">
                      <Checkbox
                        id={`${rolePerm.role}-${permission.id}`}
                        checked={rolePerm.permissions.includes(permission.id)}
                        onCheckedChange={() => togglePermission(rolePerm.role, permission.id)}
                      />
                      <div className="space-y-1 leading-none">
                        <label
                          htmlFor={`${rolePerm.role}-${permission.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {permission.label}
                        </label>
                        <p className="text-xs text-gray-500">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-blue-900">
              <Shield className="w-4 h-4" />
              <span>
                <strong>نصيحة أمنية:</strong> تأكد من منح الصلاحيات الضرورية فقط لكل دور لتقليل المخاطر الأمنية.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </SlideIn>
  )
}
