'use client'

import { useState, useEffect } from 'react'
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
import { Building2, Users, Calendar, DollarSign, Server, Plus, Power, PowerOff, Edit, Trash2, Eye, LogOut } from 'lucide-react'
import { PageTransition } from '@/components/animations/page-transition'
import { SlideIn } from '@/components/animations/feedback-animations'
import { useRouter } from 'next/navigation'

interface Clinic {
  id: string
  name: string
  slug: string
  facilityType: 'single_clinic' | 'multi_clinic' | 'medical_center'
  edition: 'basic' | 'pro' | 'enterprise'
  isActive: boolean
  subscriptionExpiry: string | null
  createdAt: string
  stats: {
    patientCount: number
    appointmentCount: number
    doctorCount: number
    revenue: number
  }
}

export default function SuperAdminPage() {
  const router = useRouter()
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null)
  
  const [clinicForm, setClinicForm] = useState({
    name: '',
    slug: '',
    facilityType: 'single_clinic' as 'single_clinic' | 'multi_clinic' | 'medical_center',
    edition: 'basic' as 'basic' | 'pro' | 'enterprise',
    subscriptionExpiry: '',
  })

  useEffect(() => {
    const user = store.getUser()
    if (user?.role !== 'super_admin') {
      window.location.href = user?.role === 'super_admin' ? '/admin/login' : '/dashboard/login'
      return
    }
    fetchClinics()
  }, [])

  const fetchClinics = async () => {
    try {
      const response = await apiFetch('/super-admin/clinics')
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
      const response = await apiFetch(`/super-admin/clinics/${clinicId}/status`, {
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
      const response = await apiFetch('/super-admin/clinics', {
        method: 'POST',
        body: JSON.stringify(clinicForm)
      })

      if (response.ok) {
        toast.success('تم إنشاء المنشأة بنجاح')
        setIsDialogOpen(false)
        setClinicForm({
          name: '',
          slug: '',
          facilityType: 'single_clinic',
          edition: 'basic',
          subscriptionExpiry: '',
        })
        fetchClinics()
      } else {
        toast.error('فشل إنشاء المنشأة')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء المنشأة')
    }
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-8 h-8 text-medical-blue" />
                لوحة تحكم السوبر أدمن
              </h1>
              <p className="text-slate-600 mt-1">
                إدارة المنشآت الطبية والاشتراكات
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </Button>
          </div>
        </SlideIn>

        {/* Stats Cards */}
        <SlideIn direction="up" delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي المنشآت</p>
                    <p className="text-2xl font-bold">{clinics.length}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-medical-blue" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">المنشآت النشطة</p>
                    <p className="text-2xl font-bold">{clinics.filter(c => c.isActive).length}</p>
                  </div>
                  <Power className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي المرضى</p>
                    <p className="text-2xl font-bold">
                      {clinics.reduce((sum, c) => sum + c.stats.patientCount, 0)}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
                    <p className="text-2xl font-bold">
                      ${clinics.reduce((sum, c) => sum + c.stats.revenue, 0).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
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
            <CardHeader>
              <CardTitle>المنشآت الطبية</CardTitle>
            </CardHeader>
            <CardContent>
              {clinics.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  لا توجد منشآت
                </div>
              ) : (
                <div className="space-y-4">
                  {clinics.map((clinic) => (
                    <div
                      key={clinic.id}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{clinic.name}</h3>
                            <Badge variant={clinic.isActive ? 'default' : 'secondary'}>
                              {clinic.isActive ? 'نشط' : 'معطل'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {facilityTypeNames[clinic.facilityType]} - {editionNames[clinic.edition]}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleClinicStatus(clinic.id, clinic.isActive)}
                            className={clinic.isActive ? 'text-red-600 border-red-600' : 'text-green-600 border-green-600'}
                          >
                            {clinic.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedClinic(clinic)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                        <div>
                          <p className="text-xs text-gray-600">المرضى</p>
                          <p className="font-semibold">{clinic.stats.patientCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">المواعيد</p>
                          <p className="font-semibold">{clinic.stats.appointmentCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">الأطباء</p>
                          <p className="font-semibold">{clinic.stats.doctorCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">الإيرادات</p>
                          <p className="font-semibold">${clinic.stats.revenue.toLocaleString()}</p>
                        </div>
                      </div>

                      {clinic.subscriptionExpiry && (
                        <div className="pt-2">
                          <p className="text-xs text-gray-600">
                            انتهاء الاشتراك: {new Date(clinic.subscriptionExpiry).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </SlideIn>

        {/* Create Clinic Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء منشأة جديدة</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateClinic} className="space-y-4">
              <div>
                <Label htmlFor="name">اسم المنشأة *</Label>
                <Input
                  id="name"
                  value={clinicForm.name}
                  onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug">الرابط (Slug) *</Label>
                <Input
                  id="slug"
                  value={clinicForm.slug}
                  onChange={(e) => setClinicForm({ ...clinicForm, slug: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="facilityType">نوع المنشأة *</Label>
                <Select
                  value={clinicForm.facilityType}
                  onValueChange={(value: 'single_clinic' | 'multi_clinic' | 'medical_center') =>
                    setClinicForm({ ...clinicForm, facilityType: value })
                  }
                >
                  <SelectTrigger>
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
                <Label htmlFor="edition">النسخة *</Label>
                <Select
                  value={clinicForm.edition}
                  onValueChange={(value: 'basic' | 'pro' | 'enterprise') =>
                    setClinicForm({ ...clinicForm, edition: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">أساسي</SelectItem>
                    <SelectItem value="pro">احترافي</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subscriptionExpiry">تاريخ انتهاء الاشتراك</Label>
                <Input
                  id="subscriptionExpiry"
                  type="date"
                  value={clinicForm.subscriptionExpiry}
                  onChange={(e) => setClinicForm({ ...clinicForm, subscriptionExpiry: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button type="submit" className="flex-1">
                  إنشاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Clinic Details Dialog */}
        {selectedClinic && (
          <Dialog open={!!selectedClinic} onOpenChange={() => setSelectedClinic(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>تفاصيل المنشأة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>اسم المنشأة</Label>
                  <p className="font-semibold">{selectedClinic.name}</p>
                </div>
                <div>
                  <Label>الرابط</Label>
                  <p className="font-semibold">{selectedClinic.slug}</p>
                </div>
                <div>
                  <Label>نوع المنشأة</Label>
                  <p className="font-semibold">{facilityTypeNames[selectedClinic.facilityType]}</p>
                </div>
                <div>
                  <Label>النسخة</Label>
                  <p className="font-semibold">{editionNames[selectedClinic.edition]}</p>
                </div>
                <div>
                  <Label>الحالة</Label>
                  <Badge variant={selectedClinic.isActive ? 'default' : 'secondary'}>
                    {selectedClinic.isActive ? 'نشط' : 'معطل'}
                  </Badge>
                </div>
                {selectedClinic.subscriptionExpiry && (
                  <div>
                    <Label>تاريخ انتهاء الاشتراك</Label>
                    <p className="font-semibold">
                      {new Date(selectedClinic.subscriptionExpiry).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                )}
                <div>
                  <Label>تاريخ الإنشاء</Label>
                  <p className="font-semibold">
                    {new Date(selectedClinic.createdAt).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-600">المرضى</p>
                    <p className="font-semibold">{selectedClinic.stats.patientCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">المواعيد</p>
                    <p className="font-semibold">{selectedClinic.stats.appointmentCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">الأطباء</p>
                    <p className="font-semibold">{selectedClinic.stats.doctorCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">الإيرادات</p>
                    <p className="font-semibold">${selectedClinic.stats.revenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </PageTransition>
  )
}
