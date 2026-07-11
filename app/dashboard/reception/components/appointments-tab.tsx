'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button-redesigned'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Badge } from '@/components/ui/badge-redesigned'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input-redesigned'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Calendar, Clock, Plus, Check, X, Bell, Search, Filter, DollarSign } from 'lucide-react'
import { SlideIn } from '@/components/animations/feedback-animations'
import { HoverScale } from '@/components/animations/micro-interactions'
import { QuickInvoice } from './quick-invoice'

interface Appointment {
  id: string
  patientId: string
  patientName: string
  startTime: string
  status: 'pending' | 'confirmed' | 'in-waiting-room' | 'in-progress' | 'done' | 'cancelled' | 'no-show'
  doctorId?: string
  doctorName?: string
  priority?: 'normal' | 'priority' | 'emergency'
  appointmentDate?: string
}

interface Doctor {
  id: string
  name: string
}

interface AppointmentsTabProps {
  appointments: Appointment[]
  doctors: Doctor[]
  onConfirm: (id: string) => void
  onCheckIn: (id: string) => void
  onCancel: (id: string) => void
  onCreate: (data: any) => void
  onSendReminder: (appointment: Appointment) => void
  clinicId: string | null
}

export function AppointmentsTab({
  appointments,
  doctors,
  onConfirm,
  onCheckIn,
  onCancel,
  onCreate,
  onSendReminder,
  clinicId
}: AppointmentsTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isQuickInvoiceOpen, setIsQuickInvoiceOpen] = useState(false)
  const [selectedAppointmentForInvoice, setSelectedAppointmentForInvoice] = useState<Appointment | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    notes: ''
  })

  const handleCreateQuickInvoice = (appointment: Appointment) => {
    setSelectedAppointmentForInvoice(appointment)
    setIsQuickInvoiceOpen(true)
  }

  const handleInvoiceCreated = (data: any) => {
    // Handle invoice creation
    console.log('Invoice created:', data)
    setIsQuickInvoiceOpen(false)
    setSelectedAppointmentForInvoice(null)
  }

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         apt.doctorName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      'pending': { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-700' },
      'confirmed': { label: 'مؤكد', className: 'bg-blue-100 text-blue-700' },
      'in-waiting-room': { label: 'في غرفة الانتظار', className: 'bg-purple-100 text-purple-700' },
      'in-progress': { label: 'جاري الفحص', className: 'bg-green-100 text-green-700' },
      'done': { label: 'مكتمل', className: 'bg-gray-100 text-gray-700' },
      'cancelled': { label: 'ملغي', className: 'bg-red-100 text-red-700' },
      'no-show': { label: 'لم يحضر', className: 'bg-gray-100 text-gray-500' }
    }
    const config = statusMap[status] || statusMap['pending']
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority?: string) => {
    if (priority === 'emergency') return <Badge className="bg-red-500">طوارئ</Badge>
    if (priority === 'priority') return <Badge className="bg-orange-500">أولوية</Badge>
    return null
  }

  return (
    <SlideIn direction="up" delay={0.1}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة المواعيد</h2>
            <p className="text-sm text-gray-500 mt-1">إدارة وحجز المواعيد الطبية</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <HoverScale>
                <Button>
                  <Plus className="w-4 h-4 ml-2" />
                  موعد جديد
                </Button>
              </HoverScale>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>حجز موعد جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); onCreate(appointmentForm); setIsDialogOpen(false); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patient">المريض</Label>
                    <Input
                      id="patient"
                      placeholder="اسم المريض"
                      value={appointmentForm.patientId}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, patientId: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="doctor">الطبيب</Label>
                    <Select value={appointmentForm.doctorId} onValueChange={(value) => setAppointmentForm({ ...appointmentForm, doctorId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الطبيب" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">التاريخ</Label>
                    <Input
                      id="date"
                      type="date"
                      value={appointmentForm.date}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">الوقت</Label>
                    <Input
                      id="time"
                      type="time"
                      value={appointmentForm.time}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={appointmentForm.notes}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                    placeholder="أي ملاحظات إضافية..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">حجز الموعد</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="بحث عن موعد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
              <SelectItem value="confirmed">مؤكد</SelectItem>
              <SelectItem value="in-waiting-room">في غرفة الانتظار</SelectItem>
              <SelectItem value="in-progress">جاري الفحص</SelectItem>
              <SelectItem value="done">مكتمل</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Appointments List */}
        <div className="grid gap-4">
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">لا توجد مواعيد</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className={
                appointment.priority === 'emergency' ? 'border-red-200 bg-red-50' : ''
              }>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{appointment.patientName}</h3>
                        {getPriorityBadge(appointment.priority)}
                        {getStatusBadge(appointment.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{appointment.startTime}</span>
                        </div>
                        {appointment.doctorName && (
                          <div className="flex items-center gap-1">
                            <span>الطبيب: {appointment.doctorName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {appointment.status === 'pending' && (
                        <Button size="sm" onClick={() => onConfirm(appointment.id)}>
                          <Check className="w-4 h-4 ml-1" />
                          تأكيد
                        </Button>
                      )}
                      {appointment.status === 'confirmed' && (
                        <Button size="sm" onClick={() => onCheckIn(appointment.id)}>
                          <Check className="w-4 h-4 ml-1" />
                          تسجيل الوصول
                        </Button>
                      )}
                      {(appointment.status === 'done' || appointment.status === 'in-progress') && (
                        <Button size="sm" variant="outline" onClick={() => handleCreateQuickInvoice(appointment)}>
                          <DollarSign className="w-4 h-4 ml-1" />
                          فاتورة
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => onSendReminder(appointment)}>
                        <Bell className="w-4 h-4 ml-1" />
                        تذكير
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => onCancel(appointment.id)}>
                        <X className="w-4 h-4 ml-1" />
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quick Invoice Dialog */}
        <Dialog open={isQuickInvoiceOpen} onOpenChange={setIsQuickInvoiceOpen}>
          <DialogContent className="max-w-3xl">
            {selectedAppointmentForInvoice && (
              <QuickInvoice
                patientName={selectedAppointmentForInvoice.patientName}
                patientId={selectedAppointmentForInvoice.patientId}
                appointmentId={selectedAppointmentForInvoice.id}
                onCreate={handleInvoiceCreated}
                onCancel={() => setIsQuickInvoiceOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SlideIn>
  )
}
