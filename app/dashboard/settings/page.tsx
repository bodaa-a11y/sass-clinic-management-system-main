'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import { store } from '@/lib/store'
import { Button } from '@/components/ui/button-redesigned'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Input } from '@/components/ui/input-redesigned'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getTwoFactorService, storeTwoFactorConfig, getStoredTwoFactorConfig } from '@/lib/auth-2fa'
import { toast } from 'sonner'
import { Copy, Check, Settings, Link as LinkIcon, Plus, Trash2, RefreshCw } from 'lucide-react'
import { PageTransition } from '@/components/animations/page-transition'
import { SlideIn } from '@/components/animations/feedback-animations'
import { HoverScale } from '@/components/animations/micro-interactions'

interface Clinic {
  id: string
  name: string
  slug: string
  phone?: string
  address?: string
}

interface Specialty {
  id: string
  name: string
  description?: string
  icon?: string
  doctorCount?: number
}

interface Doctor {
  id: string
  name: string
  specialtyId?: string
}

interface Department {
  id: string
  name: string
  description?: string
  headDoctorId?: string
  status: 'active' | 'inactive'
}

export default function SettingsPage() {
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false)
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    description: '',
    headDoctorId: '',
    status: 'active' as 'active' | 'inactive'
  })
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [newSpecialty, setNewSpecialty] = useState({ name: '', description: '', icon: '' })
  const [isAddingSpecialty, setIsAddingSpecialty] = useState(false)
  const [clinicConfig, setClinicConfig] = useState<any>(null)
  const [isRefreshingConfig, setIsRefreshingConfig] = useState(false)
  const [advancedSettings, setAdvancedSettings] = useState({
    cancellationPolicy: 24,
    taxRate: 15,
    defaultConsultationFee: 100,
    autoInvoice: false,
    emailNotifications: false,
    smsNotifications: false,
    smsProvider: 'custom' as 'twilio' | 'custom',
    emailProvider: 'custom' as 'sendgrid' | 'custom',
    smsApiKey: '',
    emailApiKey: '',
    senderPhone: '',
    senderEmail: ''
  })
  const [isSavingAdvanced, setIsSavingAdvanced] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorSecret, setTwoFactorSecret] = useState('')
  const [twoFactorBackupCodes, setTwoFactorBackupCodes] = useState<string[]>([])
  const [isTwoFactorSetupOpen, setIsTwoFactorSetupOpen] = useState(false)
  const [twoFactorVerifyToken, setTwoFactorVerifyToken] = useState('')

  useEffect(() => {
    setIsMounted(true)
    const user = store.getUser()
    if (user?.clinicId || user?.role === 'super_admin') {
      setClinicId(user.clinicId || null)
      // Load clinic config
      const config = store.getClinicConfig()
      setClinicConfig(config)

      // Load 2FA config
      if (user?.id) {
        const twoFactorConfig = getStoredTwoFactorConfig(user.id)
        if (twoFactorConfig) {
          setTwoFactorEnabled(twoFactorConfig.enabled)
        }
      }
    } else {
      setIsLoading(false)
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard/login'
      }
    }
  }, [])

  useEffect(() => {
    if (!clinicId) return
    fetchClinic()
    fetchSpecialties()
    fetchDoctors()
    // fetchDepartments() // Disabled - departments feature not implemented
  }, [clinicId])

  const handleRefreshConfig = async () => {
    // Token is now in httpOnly cookie, sent automatically
    setIsRefreshingConfig(true)
    try {
      const newConfig = await store.refreshClinicConfig()
      if (newConfig) {
        setClinicConfig(newConfig)
        toast.success('تم تحديث إعدادات العيادة بنجاح')
        // Dispatch event to update TenantContext
        window.dispatchEvent(new Event('clinicConfigUpdated'))
      } else {
        toast.error('فشل تحديث إعدادات العيادة')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الإعدادات')
    } finally {
      setIsRefreshingConfig(false)
    }
  }

  const fetchSpecialties = async () => {
    if (!clinicId) return
    try {
      const response = await apiFetch(`/clinics/${clinicId}/specialties`)
      if (response.ok) {
        const data = await response.json()
        setSpecialties(data.data || [])
      }
    } catch {
      toast.error('فشل تحميل التخصصات')
    }
  }

  const fetchDepartments = async () => {
    if (!clinicId) return
    try {
      const response = await apiFetch(`/clinics/${clinicId}/departments`)
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.data || [])
      }
    } catch {
      toast.error('فشل تحميل الأقسام')
    }
  }

  const fetchDoctors = async () => {
    if (!clinicId) return
    try {
      const response = await apiFetch(`/clinics/${clinicId}/staff?role=doctor`)
      if (response.ok) {
        const data = await response.json()
        setDoctors(data.data || [])
      }
    } catch {
      toast.error('فشل تحميل بيانات الأطباء')
    }
  }

  // Calculate doctor count for each specialty
  const getSpecialtyDoctorCount = (specialtyId: string) => {
    return doctors.filter(doctor => doctor.specialtyId === specialtyId).length
  }

  const fetchClinic = async () => {
    if (!clinicId) return
    try {
      const response = await apiFetch(`/clinics/${clinicId}`)
      if (response.ok) {
        const data = await response.json()
        setClinic(data.data)
        setFormData({
          name: data.data.name || '',
          phone: data.data.phone || '',
          address: data.data.address || '',
        })
      } else {
        toast.error('فشل تحميل بيانات العيادة')
      }
    } catch {
      toast.error('حدث خطأ أثناء تحميل البيانات')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clinicId) return

    setIsSaving(true)
    try {
      const response = await apiFetch(`/clinics/${clinicId}`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        toast.success('تم تحديث بيانات العيادة بنجاح')
        fetchClinic()
      } else {
        toast.error('فشل تحديث البيانات')
      }
    } catch {
      toast.error('حدث خطأ أثناء الحفظ')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyLink = async () => {
    const bookingLink = `${window.location.origin}/book/${clinic?.slug}`
    try {
      await navigator.clipboard.writeText(bookingLink)
      setCopied(true)
      toast.success('تم نسخ الرابط')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('فشل تحميل بيانات الأطباء')
    }
  }

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clinicId) return

    try {
      const response = await apiFetch(`/clinics/${clinicId}/departments`, {
        method: 'POST',
        body: JSON.stringify(departmentForm)
      })

      if (response.ok) {
        toast.success('تم إضافة القسم بنجاح')
        setIsDepartmentDialogOpen(false)
        setDepartmentForm({
          name: '',
          description: '',
          headDoctorId: '',
          status: 'active'
        })
        fetchDepartments()
      } else {
        toast.error('فشل إضافة القسم')
      }
    } catch {
      toast.error('حدث خطأ أثناء إضافة القسم')
    }
  }

  const handleDeleteDepartment = async (departmentId: string) => {
    if (!clinicId) return

    const confirmMessage = 'هل أنت متأكد من حذف هذا القسم؟'
    if (!confirm(confirmMessage)) return

    try {
      const response = await apiFetch(`/clinics/${clinicId}/departments?department_id=${departmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('تم حذف القسم بنجاح')
        fetchDepartments()
      } else {
        toast.error('فشل حذف القسم')
      }
    } catch {
      toast.error('حدث خطأ أثناء حذف القسم')
    }
  }

  const handleAddSpecialty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSpecialty.name.trim()) {
      toast.error('الرجاء إدخال اسم التخصص')
      return
    }

    setIsAddingSpecialty(true)
    try {
      const response = await apiFetch(`/clinics/${clinicId}/specialties`, {
        method: 'POST',
        body: JSON.stringify({
          name: newSpecialty.name.trim(),
          description: newSpecialty.description.trim(),
          icon: newSpecialty.icon.trim(),
        }),
      })

      if (response.ok) {
        toast.success('تم إضافة التخصص بنجاح')
        setNewSpecialty({ name: '', description: '', icon: '' })
        fetchSpecialties()
      } else {
        const error = await response.json()
        toast.error(error.error || 'فشل إضافة التخصص')
      }
    } catch {
      toast.error('حدث خطأ أثناء إضافة التخصص')
    } finally {
      setIsAddingSpecialty(false)
    }
  }

  const handleDeleteSpecialty = async (specialtyId: string) => {
    const doctorCount = getSpecialtyDoctorCount(specialtyId)

    let confirmMessage = 'هل أنت متأكد من حذف هذا التخصص؟'
    if (doctorCount > 0) {
      confirmMessage = `⚠️ هناك ${doctorCount} طبيب مرتبط بهذا التخصص.\n\nهل أنت متأكد من الحذف؟ سيتم إلغاء ارتباط الأطباء بهذا التخصص.`
    }

    if (!confirm(confirmMessage)) return

    try {
      const response = await apiFetch(`/clinics/${clinicId}/specialties?specialty_id=${specialtyId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('تم حذف التخصص بنجاح')
        fetchSpecialties()
        fetchDoctors() // Refresh doctors to show updated specialty
      } else {
        const error = await response.json()
        toast.error(error.error || 'فشل حذف التخصص')
      }
    } catch {
      toast.error('حدث خطأ أثناء حذف التخصص')
    }
  }

  const handleSaveAdvancedSettings = async () => {
    if (!clinicId) return

    setIsSavingAdvanced(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('تم حفظ الإعدادات المتقدمة بنجاح')
    } catch {
      toast.error('فشل حفظ الإعدادات')
    } finally {
      setIsSavingAdvanced(false)
    }
  }

  const handleSetupTwoFactor = () => {
    const user = store.getUser()
    if (!user?.email) {
      toast.error('يجب أن يكون لديك بريد إلكتروني لإعداد 2FA')
      return
    }

    const twoFactorService = getTwoFactorService()
    const { secret, backupCodes } = twoFactorService.enable(user.email)

    setTwoFactorSecret(secret)
    setTwoFactorBackupCodes(backupCodes)
    setIsTwoFactorSetupOpen(true)
  }

  const handleVerifyTwoFactor = () => {
    const twoFactorService = getTwoFactorService()
    const result = twoFactorService.verify(twoFactorVerifyToken)

    if (result.success) {
      const user = store.getUser()
      if (user?.id) {
        storeTwoFactorConfig(user.id, twoFactorService.getConfig())
        setTwoFactorEnabled(true)
        setIsTwoFactorSetupOpen(false)
        setTwoFactorVerifyToken('')
        toast.success('تم تفعيل المصادقة الثنائية بنجاح')
      }
    } else {
      toast.error(result.error || 'فشل التحقق من الرمز')
    }
  }

  const handleDisableTwoFactor = () => {
    const twoFactorService = getTwoFactorService()
    twoFactorService.disable()

    const user = store.getUser()
    if (user?.id) {
      storeTwoFactorConfig(user.id, twoFactorService.getConfig())
      setTwoFactorEnabled(false)
      toast.success('تم تعطيل المصادقة الثنائية')
    }
  }

  if (!isMounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="space-y-4 w-full max-w-2xl p-4">
          <div className="animate-pulse border border-slate-200 rounded-xl p-6">
            <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-10 bg-slate-200 rounded w-full"></div>
              <div className="h-10 bg-slate-200 rounded w-full"></div>
              <div className="h-10 bg-slate-200 rounded w-full"></div>
            </div>
          </div>
          <div className="animate-pulse border border-slate-200 rounded-xl p-6">
            <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded w-full"></div>
              <div className="h-4 bg-slate-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="flex flex-col" dir="rtl">
        {/* Header */}
        <div className="flex-shrink-0">
          <SlideIn direction="up" delay={0.1}>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-8 h-8 text-medical-blue" />
                إعدادات العيادة
              </h1>
              <p className="text-slate-600 mt-1">إدارة بيانات العيادة والإعدادات</p>
            </div>
          </SlideIn>
        </div>

        {/* Main Content - Flex-1 with inner scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto">

      {/* Booking Link Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            رابط الحجز الخاص بعيادتك
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <code className="text-sm text-gray-700 flex-1 break-all">
              http://localhost:3000/book/{clinic?.slug}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 ml-1" />
                  تم النسخ ✓
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 ml-1" />
                  نسخ الرابط
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            شارك هذا الرابط مع مرضاك ليتمكنوا من حجز المواعيد مباشرة
          </p>
        </CardContent>
      </Card>

      {/* Clinic Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>بيانات العيادة</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم العيادة *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسم العيادة"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="أدخل رقم الهاتف"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="أدخل عنوان العيادة"
              />
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Specialties Section */}
      <Card>
        <CardHeader>
          <CardTitle>التخصصات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Specialty Form */}
          <form onSubmit={handleAddSpecialty} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                placeholder="اسم التخصص *"
                value={newSpecialty.name}
                onChange={(e) => setNewSpecialty({ ...newSpecialty, name: e.target.value })}
              />
              <Input
                placeholder="وصف (اختياري)"
                value={newSpecialty.description}
                onChange={(e) => setNewSpecialty({ ...newSpecialty, description: e.target.value })}
              />
              <Input
                placeholder="رمز (اختياري)"
                value={newSpecialty.icon}
                onChange={(e) => setNewSpecialty({ ...newSpecialty, icon: e.target.value })}
                maxLength={10}
              />
            </div>
            <Button type="submit" disabled={isAddingSpecialty} size="sm">
              <Plus className="w-4 h-4 ml-1" />
              {isAddingSpecialty ? 'جاري الإضافة...' : 'إضافة تخصص'}
            </Button>
          </form>

          {/* Specialties List */}
          {specialties.length === 0 ? (
            <p className="text-center text-gray-500 py-4">لا توجد تخصصات مضافة</p>
          ) : (
            <div className="space-y-2">
              {specialties.map((specialty) => {
                const doctorCount = getSpecialtyDoctorCount(specialty.id)
                return (
                  <div key={specialty.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {specialty.icon && <span className="text-lg">{specialty.icon}</span>}
                      <div>
                        <div className="font-medium">{specialty.name}</div>
                        {specialty.description && (
                          <div className="text-sm text-gray-500">{specialty.description}</div>
                        )}
                        <div className="text-xs text-blue-600 mt-1">
                          {doctorCount === 0 ? 'لا يوجد أطباء' : `${doctorCount} طبيب`}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteSpecialty(specialty.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Departments Section - Disabled: feature not implemented */}
      {/* <Card>
        <CardHeader>
          <CardTitle>الأقسام</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              إدارة أقسام المركز الطبي
            </p>
            <Button
              size="sm"
              onClick={() => setIsDepartmentDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة قسم
            </Button>
          </div>
          {departments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد أقسام
            </div>
          ) : (
            <div className="space-y-3">
              {departments.map((department) => (
                <div
                  key={department.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{department.name}</div>
                    {department.description && (
                      <div className="text-sm text-gray-500">{department.description}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                        department.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {department.status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteDepartment(department.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card> */}

      {/* Clinic Config Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            إعدادات النظام
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">نوع العيادة</div>
                <div className="text-sm text-gray-500">
                  {clinicConfig?.facilityType || 'غير محدد'}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">الإصدار</div>
                <div className="text-sm text-gray-500">
                  {clinicConfig?.edition || 'غير محدد'}
                </div>
              </div>
            </div>
            <div>
              <div className="font-medium mb-2">الموديولات المفعلة ({clinicConfig?.enabledModules?.length || 0})</div>
              <div className="flex flex-wrap gap-2">
                {clinicConfig?.enabledModules?.map((module: string) => (
                  <span
                    key={module}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                  >
                    {module}
                  </span>
                )) || <span className="text-sm text-gray-500">لا توجد موديولات مفعلة</span>}
              </div>
            </div>
          </div>
          <div className="pt-4 border-t">
            <Button
              onClick={handleRefreshConfig}
              disabled={isRefreshingConfig}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`w-4 h-4 ml-2 ${isRefreshingConfig ? 'animate-spin' : ''}`} />
              {isRefreshingConfig ? 'جاري التحديث...' : 'تحديث الإعدادات من السيرفر'}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              استخدم هذا الزر بعد تعديل الإعدادات من قبل Super Admin لتحديث القائمة الجانبية
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            الإعدادات المتقدمة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="cancellationPolicy">سياسة الإلغاء (ساعات)</Label>
              <Input
                id="cancellationPolicy"
                type="number"
                value={advancedSettings.cancellationPolicy}
                onChange={(e) => setAdvancedSettings({ ...advancedSettings, cancellationPolicy: parseInt(e.target.value) || 24 })}
                placeholder="24"
              />
              <p className="text-xs text-gray-500 mt-1">
                الحد الأدنى المسموح به للإلغاء قبل الموعد بالساعات
              </p>
            </div>

            <div>
              <Label htmlFor="taxRate">نسبة الضريبة (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.1"
                value={advancedSettings.taxRate}
                onChange={(e) => setAdvancedSettings({ ...advancedSettings, taxRate: parseFloat(e.target.value) || 15 })}
                placeholder="15"
              />
              <p className="text-xs text-gray-500 mt-1">
                النسبة المئوية للضريبة المضافة على الفواتير
              </p>
            </div>

            <div>
              <Label htmlFor="defaultConsultationFee">رسوم الاستشارة الافتراضية (ر.س)</Label>
              <Input
                id="defaultConsultationFee"
                type="number"
                step="0.01"
                value={advancedSettings.defaultConsultationFee}
                onChange={(e) => setAdvancedSettings({ ...advancedSettings, defaultConsultationFee: parseFloat(e.target.value) || 100 })}
                placeholder="100.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                الرسوم الافتراضية لاستشارة الطبيب
              </p>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="autoInvoice"
                checked={advancedSettings.autoInvoice}
                onCheckedChange={(checked) => setAdvancedSettings({ ...advancedSettings, autoInvoice: checked as boolean })}
              />
              <Label htmlFor="autoInvoice" className="cursor-pointer">
                إنشاء فاتورة تلقائياً بعد الفحص
              </Label>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="emailNotifications"
                checked={advancedSettings.emailNotifications}
                onCheckedChange={(checked) => setAdvancedSettings({ ...advancedSettings, emailNotifications: checked as boolean })}
              />
              <Label htmlFor="emailNotifications" className="cursor-pointer">
                إشعارات البريد الإلكتروني للمواعيد
              </Label>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="smsNotifications"
                checked={advancedSettings.smsNotifications}
                onCheckedChange={(checked) => setAdvancedSettings({ ...advancedSettings, smsNotifications: checked as boolean })}
              />
              <Label htmlFor="smsNotifications" className="cursor-pointer">
                إشعارات SMS للمواعيد
              </Label>
            </div>

            {advancedSettings.smsNotifications && (
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <Label htmlFor="smsProvider">مزود SMS</Label>
                  <Select
                    value={advancedSettings.smsProvider}
                    onValueChange={(value: 'twilio' | 'custom') => setAdvancedSettings({ ...advancedSettings, smsProvider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">مخصص</SelectItem>
                      <SelectItem value="twilio">Twilio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="smsApiKey">مفتاح API</Label>
                  <Input
                    id="smsApiKey"
                    type="password"
                    value={advancedSettings.smsApiKey}
                    onChange={(e) => setAdvancedSettings({ ...advancedSettings, smsApiKey: e.target.value })}
                    placeholder="أدخل مفتاح API"
                  />
                </div>
                <div>
                  <Label htmlFor="senderPhone">رقم المرسل</Label>
                  <Input
                    id="senderPhone"
                    type="tel"
                    value={advancedSettings.senderPhone}
                    onChange={(e) => setAdvancedSettings({ ...advancedSettings, senderPhone: e.target.value })}
                    placeholder="+966500000000"
                  />
                </div>
              </div>
            )}

            {advancedSettings.emailNotifications && (
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <Label htmlFor="emailProvider">مزود البريد الإلكتروني</Label>
                  <Select
                    value={advancedSettings.emailProvider}
                    onValueChange={(value: 'sendgrid' | 'custom') => setAdvancedSettings({ ...advancedSettings, emailProvider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">مخصص</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="emailApiKey">مفتاح API</Label>
                  <Input
                    id="emailApiKey"
                    type="password"
                    value={advancedSettings.emailApiKey}
                    onChange={(e) => setAdvancedSettings({ ...advancedSettings, emailApiKey: e.target.value })}
                    placeholder="أدخل مفتاح API"
                  />
                </div>
                <div>
                  <Label htmlFor="senderEmail">بريد المرسل</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    value={advancedSettings.senderEmail}
                    onChange={(e) => setAdvancedSettings({ ...advancedSettings, senderEmail: e.target.value })}
                    placeholder="noreply@clinic.com"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <Button
              className="w-full"
              onClick={handleSaveAdvancedSettings}
              disabled={isSavingAdvanced}
            >
              {isSavingAdvanced ? 'جاري الحفظ...' : 'حفظ الإعدادات المتقدمة'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings - 2FA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            الأمان
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h3 className="font-medium">المصادقة الثنائية (2FA)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                إضافة طبقة أمان إضافية لحسابك
              </p>
            </div>
            <Button
              variant={twoFactorEnabled ? 'destructive' : 'default'}
              onClick={twoFactorEnabled ? handleDisableTwoFactor : handleSetupTwoFactor}
            >
              {twoFactorEnabled ? 'تعطيل 2FA' : 'تفعيل 2FA'}
            </Button>
          </div>
          {twoFactorEnabled && (
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-900 dark:text-green-100">
                ✓ المصادقة الثنائية مفعلة حالياً
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two Factor Setup Dialog */}
      <Dialog open={isTwoFactorSetupOpen} onOpenChange={setIsTwoFactorSetupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إعداد المصادقة الثنائية</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                رمز السر:
              </p>
              <code className="text-xs bg-white dark:bg-slate-800 p-2 rounded block break-all">
                {twoFactorSecret}
              </code>
            </div>
            <div>
              <Label htmlFor="verifyToken">أدخل الرمز المكون من 6 أرقام</Label>
              <Input
                id="verifyToken"
                type="text"
                maxLength={6}
                value={twoFactorVerifyToken}
                onChange={(e) => setTwoFactorVerifyToken(e.target.value)}
                placeholder="123456"
                className="text-center text-lg tracking-widest"
              />
            </div>
            <div>
              <Label>رموز النسخ الاحتياطي:</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {twoFactorBackupCodes.map((code, index) => (
                  <code key={index} className="text-xs bg-gray-100 dark:bg-slate-800 p-2 rounded text-center">
                    {code}
                  </code>
                ))}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                احفظ هذه الرموز في مكان آمن. يمكنك استخدامها إذا فقدت الوصول إلى تطبيق المصادقة.
              </p>
            </div>
            <Button onClick={handleVerifyTwoFactor} className="w-full">
              تحقق وتفعيل
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Department Dialog - Disabled: feature not implemented */}
      {/* <Dialog open={isDepartmentDialogOpen} onOpenChange={setIsDepartmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة قسم جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDepartment} className="space-y-4">
            <div>
              <Label htmlFor="departmentName">اسم القسم *</Label>
              <Input
                id="departmentName"
                value={departmentForm.name}
                onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="departmentDescription">الوصف</Label>
              <Input
                id="departmentDescription"
                value={departmentForm.description}
                onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="headDoctorId">رئيس القسم (اختياري)</Label>
              <select
                id="headDoctorId"
                value={departmentForm.headDoctorId}
                onChange={(e) => setDepartmentForm({ ...departmentForm, headDoctorId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">اختر طبيب</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="departmentStatus">الحالة</Label>
              <select
                id="departmentStatus"
                value={departmentForm.status}
                onChange={(e) => setDepartmentForm({ ...departmentForm, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDepartmentDialogOpen(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button type="submit" className="flex-1">
                إضافة
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog> */}
        </div>
      </div>
    </PageTransition>
  )
}
