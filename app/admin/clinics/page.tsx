'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api-client'
import { store } from '@/lib/store'
import { Button } from '@/components/ui/button-redesigned'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Badge } from '@/components/ui/badge-redesigned'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input-redesigned'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Building2, Users, Calendar, Plus, Power, PowerOff, Edit, Settings, LogOut } from 'lucide-react'
import { PageTransition } from '@/components/animations/page-transition'
import { SlideIn } from '@/components/animations/feedback-animations'

interface Clinic {
  id: string
  name: string
  slug: string
  phone?: string
  isActive: boolean
  createdAt: string
  facilityType: 'single_clinic' | 'multi_clinic' | 'medical_center'
  edition: 'basic' | 'pro' | 'enterprise'
  enabledModules: string[]
  config: Record<string, any>
  patientCount: number
  appointmentCount: number
}

export default function AdminClinicsPage() {
  const router = useRouter()
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null)

  const [clinicForm, setClinicForm] = useState({
    name: '',
    slug: '',
    phone: '',
    email: '',
    password: '',
    facilityType: 'single_clinic' as 'single_clinic' | 'multi_clinic' | 'medical_center',
    edition: 'basic' as 'basic' | 'pro' | 'enterprise',
  })

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    facilityType: 'single_clinic' as 'single_clinic' | 'multi_clinic' | 'medical_center',
    edition: 'basic' as 'basic' | 'pro' | 'enterprise',
    isActive: true,
  })

  useEffect(() => {
    const user = store.getUser()
    if (user?.role !== 'super_admin') {
      window.location.href = '/dashboard/login'
      return
    }
    fetchClinics()
  }, [])

  const fetchClinics = async () => {
    try {
      const response = await apiFetch('/admin/clinics')
      if (response.ok) {
        const data = await response.json()
        setClinics(data.data || [])
      }
    } catch (error) {
      toast.error('فشل تحميل المنشآت')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleClinicStatus = async (clinicId: string, isActive: boolean) => {
    try {
      const response = await apiFetch(`/admin/clinics/${clinicId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !isActive })
      })

      if (response.ok) {
        toast.success(isActive ? 'تم تعطيل المنشأة' : 'تم تفعيل المنشأة')
        fetchClinics()
      } else {
        toast.error('فشل تغيير حالة المنشأة')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تغيير حالة المنشأة')
    }
  }

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await apiFetch('/admin/clinics', {
        method: 'POST',
        body: JSON.stringify(clinicForm)
      })

      if (response.ok) {
        toast.success('تم إنشاء المنشأة بنجاح')
        setIsDialogOpen(false)
        setClinicForm({
          name: '',
          slug: '',
          phone: '',
          email: '',
          password: '',
          facilityType: 'single_clinic',
          edition: 'basic',
        })
        fetchClinics()
      } else {
        toast.error('فشل إنشاء المنشأة')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء المنشأة')
    }
  }

  const handleEditClinic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClinic) return

    try {
      const response = await apiFetch(`/admin/clinics/${selectedClinic.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        toast.success('تم تحديث المنشأة بنجاح')
        setIsEditDialogOpen(false)
        setSelectedClinic(null)
        fetchClinics()
      } else {
        toast.error('فشل تحديث المنشأة')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث المنشأة')
    }
  }

  const openEditDialog = (clinic: Clinic) => {
    setSelectedClinic(clinic)
    setEditForm({
      name: clinic.name,
      phone: clinic.phone || '',
      facilityType: clinic.facilityType,
      edition: clinic.edition,
      isActive: clinic.isActive,
    })
    setIsEditDialogOpen(true)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/super-admin/logout', { method: 'POST' })
    } catch (error) {
      console.error('Failed to clear cookie:', error)
    }
    store.logout()
    toast.success('تم تسجيل الخروج بنجاح')
    router.push('/admin/login')
  }

  const facilityTypeNames: Record<string, string> = {
    single_clinic: 'عيادة فردية',
    multi_clinic: 'عيادة متعددة',
    medical_center: 'مركز طبي',
  }

  const editionNames: Record<string, string> = {
    basic: 'أساسي',
    pro: 'احترافي',
    enterprise: 'Enterprise',
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <SlideIn direction="up" delay={0.1}>
          <div className="bg-gradient-to-r from-medical-blue/10 to-purple-50 rounded-xl p-6 border border-medical-blue/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-medical-blue flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  إدارة المنشآت الطبية
                </h1>
                <p className="text-slate-600 mt-2">
                  إدارة المنشآت الطبية والاشتراكات والتحكم في نوع الباقة لكل منشأة
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push('/super-admin')}
                  className="gap-2 bg-white hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4" />
                  لوحة السوبر أدمن الجديدة
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="gap-2 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </Button>
              </div>
            </div>
          </div>
        </SlideIn>

        {/* Stats Cards */}
        <SlideIn direction="up" delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">إجمالي المنشآت</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{clinics.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-medical-blue" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">المنشآت النشطة</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{clinics.filter(c => c.isActive).length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                    <Power className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">إجمالي المرضى</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {clinics.reduce((sum, c) => sum + (Number(c.patientCount) || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">إجمالي المواعيد</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {clinics.reduce((sum, c) => sum + (Number(c.appointmentCount) || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </SlideIn>

        {/* Create Clinic Button */}
        <SlideIn direction="up" delay={0.3}>
          <div className="flex justify-end">
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              إنشاء منشأة جديدة
            </Button>
          </div>
        </SlideIn>

        {/* Clinics List */}
        <SlideIn direction="up" delay={0.4}>
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-xl">المنشآت الطبية</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {clinics.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">لا توجد منشآت</p>
                  <p className="text-gray-400 text-sm mt-1">ابدأ بإنشاء منشأة طبية جديدة</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clinics.map((clinic) => (
                    <div
                      key={clinic.id}
                      className="border border-gray-200 rounded-xl p-6 space-y-4 hover:shadow-md transition-all hover:border-medical-blue/30"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-medical-blue/10 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-medical-blue" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-slate-900">{clinic.name}</h3>
                              <p className="text-sm text-gray-500">{clinic.slug}</p>
                            </div>
                            <Badge variant={clinic.isActive ? 'default' : 'secondary'} className="mr-2">
                              {clinic.isActive ? 'نشط' : 'معطل'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                              {facilityTypeNames[clinic.facilityType]}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                              {editionNames[clinic.edition]}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {clinic.enabledModules.slice(0, 5).map((module, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                {module}
                              </span>
                            ))}
                            {clinic.enabledModules.length > 5 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                +{clinic.enabledModules.length - 5}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(clinic)}
                            className="gap-2 hover:bg-blue-50 hover:border-blue-200"
                          >
                            <Edit className="w-4 h-4" />
                            تعديل الباقة
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleClinicStatus(clinic.id, clinic.isActive)}
                            className={clinic.isActive 
                              ? 'text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300' 
                              : 'text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300'}
                          >
                            {clinic.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <p className="text-xs text-gray-600 font-medium">المرضى</p>
                          </div>
                          <p className="text-xl font-bold text-slate-900 mt-1">{clinic.patientCount}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            <p className="text-xs text-gray-600 font-medium">المواعيد</p>
                          </div>
                          <p className="text-xl font-bold text-slate-900 mt-1">{clinic.appointmentCount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </SlideIn>

        {/* Create Clinic Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">إنشاء منشأة جديدة</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateClinic} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">اسم العيادة *</Label>
                  <Input
                    id="name"
                    value={clinicForm.name}
                    onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                    required
                    className="mt-1"
                    placeholder="مثال: عيادة الشفاء"
                  />
                </div>
                <div>
                  <Label htmlFor="slug" className="text-sm font-medium">Slug *</Label>
                  <Input
                    id="slug"
                    value={clinicForm.slug}
                    onChange={(e) => setClinicForm({ ...clinicForm, slug: e.target.value })}
                    required
                    className="mt-1"
                    placeholder="مثال: al-shifa"
                    dir="ltr"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-medium">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={clinicForm.phone}
                  onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })}
                  className="mt-1"
                  placeholder="مثال: 0501234567"
                  dir="ltr"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium">البريد الإلكتروني للمسؤول *</Label>
                <Input
                  id="email"
                  type="email"
                  value={clinicForm.email}
                  onChange={(e) => setClinicForm({ ...clinicForm, email: e.target.value })}
                  required
                  className="mt-1"
                  placeholder="admin@example.com"
                  dir="ltr"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-sm font-medium">كلمة المرور *</Label>
                <Input
                  id="password"
                  type="password"
                  value={clinicForm.password}
                  onChange={(e) => setClinicForm({ ...clinicForm, password: e.target.value })}
                  required
                  minLength={8}
                  className="mt-1"
                  placeholder="8 أحرف على الأقل"
                  dir="ltr"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="facilityType" className="text-sm font-medium">نوع العيادة</Label>
                  <Select
                    value={clinicForm.facilityType}
                    onValueChange={(value: any) => setClinicForm({ ...clinicForm, facilityType: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_clinic">عيادة فردية</SelectItem>
                      <SelectItem value="multi_clinic">عيادة متعددة</SelectItem>
                      <SelectItem value="medical_center">مركز طبي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edition" className="text-sm font-medium">الباقة</Label>
                  <Select
                    value={clinicForm.edition}
                    onValueChange={(value: any) => setClinicForm({ ...clinicForm, edition: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">أساسي</SelectItem>
                      <SelectItem value="pro">احترافي</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button type="submit" className="flex-1">
                  إنشاء المنشأة
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Clinic Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">تعديل إعدادات المنشأة</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditClinic} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name" className="text-sm font-medium">اسم العيادة</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone" className="text-sm font-medium">رقم الهاتف</Label>
                  <Input
                    id="edit-phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="mt-1"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-facilityType" className="text-sm font-medium">نوع العيادة</Label>
                  <Select
                    value={editForm.facilityType}
                    onValueChange={(value: any) => setEditForm({ ...editForm, facilityType: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_clinic">عيادة فردية</SelectItem>
                      <SelectItem value="multi_clinic">عيادة متعددة</SelectItem>
                      <SelectItem value="medical_center">مركز طبي</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-2 bg-blue-50 p-2 rounded">
                    ℹ️ سيتم تحديث الموديولات تلقائياً عند تغيير نوع العيادة
                  </p>
                </div>
                <div>
                  <Label htmlFor="edit-edition" className="text-sm font-medium">الباقة</Label>
                  <Select
                    value={editForm.edition}
                    onValueChange={(value: any) => setEditForm({ ...editForm, edition: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">أساسي</SelectItem>
                      <SelectItem value="pro">احترافي</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-medical-blue focus:ring-medical-blue"
                />
                <Label htmlFor="edit-isActive" className="text-sm font-medium cursor-pointer">نشط</Label>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button type="submit" className="flex-1">
                  حفظ التغييرات
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  )
}
