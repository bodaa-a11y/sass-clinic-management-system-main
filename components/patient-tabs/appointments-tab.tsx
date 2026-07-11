'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Clock, Filter } from 'lucide-react'

interface Appointment {
  id: string
  appointmentDate: string
  startTime: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'done' | 'in-waiting-room' | 'in-progress' | 'no-show'
  notes?: string
  doctorName: string
}

interface AppointmentsTabProps {
  appointments: Appointment[]
}

export function AppointmentsTab({ appointments }: AppointmentsTabProps) {
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA')
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: 'معلّق' },
      confirmed: { variant: 'default', label: 'مؤكد' },
      cancelled: { variant: 'destructive', label: 'ملغى' },
      done: { variant: 'outline', label: 'منتهٍ' },
      'in-waiting-room': { variant: 'default', label: 'في غرفة الانتظار' },
      'in-progress': { variant: 'default', label: 'قيد الفحص' },
      'no-show': { variant: 'destructive', label: 'لم يحضر' },
    }
    const config = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const filteredAppointments = appointments.filter((appointment) => {
    if (filterDate && !appointment.appointmentDate.includes(filterDate)) {
      return false
    }
    if (filterStatus && appointment.status !== filterStatus) {
      return false
    }
    return true
  })

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    return new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">المواعيد</h3>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-40"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">كل الحالات</option>
            <option value="pending">معلّق</option>
            <option value="confirmed">مؤكد</option>
            <option value="in-waiting-room">في غرفة الانتظار</option>
            <option value="in-progress">قيد الفحص</option>
            <option value="done">منتهٍ</option>
            <option value="cancelled">ملغى</option>
            <option value="no-show">لم يحضر</option>
          </select>
        </div>
      </div>

      {sortedAppointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>لا توجد مواعيد لهذا المريض</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedAppointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{formatDate(appointment.appointmentDate)}</span>
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{appointment.startTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">د. {appointment.doctorName}</span>
                    </div>
                    {appointment.notes && (
                      <p className="text-sm text-gray-500 mt-2">{appointment.notes}</p>
                    )}
                  </div>
                  <div>
                    {getStatusBadge(appointment.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
