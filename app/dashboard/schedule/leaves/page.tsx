'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api-client'
import { store } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { ArrowRight, Trash2, Calendar } from 'lucide-react'

interface Doctor {
  id: string
  name: string
  specialty: string
}

interface Leave {
  id: string
  doctorId: string
  doctorName: string
  leaveDate: string
  reason: string | null
  createdAt: string
}

export default function LeavesPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [leaveDate, setLeaveDate] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clinicId, setClinicId] = useState<string | null>(null)

  // Get clinicId from localStorage inside useEffect
  useEffect(() => {
    const user = store.getUser()
    if (user?.clinicId) {
      setClinicId(user.clinicId)
    } else {
      setIsLoading(false)
      toast.error('لم يتم العثور على معرف العيادة')
    }
  }, [])

  // Fetch doctors when clinicId is available
  useEffect(() => {
    if (clinicId) {
      fetchDoctors()
    }
  }, [clinicId])

  // Fetch leaves when doctor is selected
  useEffect(() => {
    if (clinicId && selectedDoctor) {
      fetchLeaves()
    }
  }, [clinicId, selectedDoctor])

  const fetchDoctors = async () => {
    try {
      const response = await apiFetch(`/clinics/${clinicId}/staff`)
      if (response.ok) {
        const data = await response.json()
        setDoctors(data.data.filter((s: any) => s.role === 'doctor'))
      }
    } catch {
      toast.error('فشل تحميل قائمة الأطباء')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLeaves = async () => {
    try {
      const response = await apiFetch(`/clinics/${clinicId}/leaves?doctor_id=${selectedDoctor}`)
      if (response.ok) {
        const data = await response.json()
        setLeaves(data.data)
      }
    } catch {
      toast.error('فشل تحميل الإجازات')
    }
  }

  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDoctor || !leaveDate) {
      toast.error('الرجاء اختيار الدكتور والتاريخ')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await apiFetch(`/clinics/${clinicId}/leaves`, {
        method: 'POST',
        body: JSON.stringify({
          doctorId: selectedDoctor,
          leaveDate,
          reason: reason || undefined,
        }),
      })

      if (response.ok) {
        toast.success('تم إضافة الإجازة بنجاح')
        setLeaveDate('')
        setReason('')
        fetchLeaves()
      } else {
        const error = await response.json()
        toast.error(error.error || 'فشل إضافة الإجازة')
      }
    } catch {
      toast.error('حدث خطأ أثناء إضافة الإجازة')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteLeave = async (leaveId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الإجازة؟')) return

    try {
      const response = await apiFetch(`/clinics/${clinicId}/leaves?leave_id=${leaveId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('تم حذف الإجازة بنجاح')
        fetchLeaves()
      } else {
        const error = await response.json()
        toast.error(error.error || 'فشل حذف الإجازة')
      }
    } catch {
      toast.error('حدث خطأ أثناء حذف الإجازة')
    }
  }

  // Get tomorrow's date for min date input
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p>جاري تحميل البيانات...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.push('/dashboard/schedule')}>
          <ArrowRight className="w-4 h-4 ml-2" />
          رجوع
        </Button>
        <h1 className="text-2xl font-bold">إدارة إجازات الأطباء</h1>
      </div>

      {/* Add Leave Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            إضافة إجازة جديدة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddLeave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doctor">اختر الدكتور</Label>
                <select
                  id="doctor"
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">اختر دكتور...</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} {doctor.specialty ? `(${doctor.specialty})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">تاريخ الإجازة</Label>
                <Input
                  id="date"
                  type="date"
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  min={minDate}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">السبب (اختياري)</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="مثال: إجازة مرضية"
                />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
              {isSubmitting ? 'جاري الإضافة...' : 'إضافة إجازة'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Leaves Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الإجازات</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDoctor ? (
            <p className="text-center text-gray-500 py-8">الرجاء اختيار دكتور لعرض إجازاته</p>
          ) : leaves.length === 0 ? (
            <p className="text-center text-gray-500 py-8">لا توجد إجازات مسجلة لهذا الدكتور</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الدكتور</TableHead>
                  <TableHead>تاريخ الإجازة</TableHead>
                  <TableHead>السبب</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>{leave.doctorName}</TableCell>
                    <TableCell>{leave.leaveDate}</TableCell>
                    <TableCell>{leave.reason || '-'}</TableCell>
                    <TableCell>{new Date(leave.createdAt).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteLeave(leave.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
