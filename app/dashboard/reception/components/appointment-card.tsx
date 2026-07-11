'use client'

import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card-redesigned'
import { Badge } from '@/components/ui/badge-redesigned'
import { Button } from '@/components/ui/button-redesigned'
import { Calendar, Clock, Check, X, UserPlus, Bell } from 'lucide-react'
import { PatientProgressStepper } from '@/components/patient-progress-stepper'
import { Appointment } from '../types'

interface AppointmentCardProps {
  appointment: Appointment
  onConfirm: (id: string) => void
  onCancel: (id: string) => void
  onCheckIn: (id: string) => void
  onSendReminder: (appointment: Appointment) => void
  onViewDetails: (appointment: Appointment) => void
}

export const AppointmentCard = memo(function AppointmentCard({
  appointment,
  onConfirm,
  onCancel,
  onCheckIn,
  onSendReminder,
  onViewDetails,
}: AppointmentCardProps) {
  const today = new Date().toISOString().split('T')[0]
  const appointmentDate = appointment.appointmentDate || appointment.date
  const isToday = appointmentDate === today

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewDetails(appointment)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{appointment.patientName || 'مريض غير معروف'}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <Calendar className="w-4 h-4" />
              <span>{appointmentDate}</span>
              <Clock className="w-4 h-4 ml-2" />
              <span>{appointment.startTime}</span>
            </div>
            <div className="mt-2">
              <PatientProgressStepper status={appointment.status} size="sm" />
            </div>
          </div>

          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {(() => {
              if (appointment.status === 'pending') {
                return (
                  <>
                    <Button size="sm" onClick={() => onConfirm(appointment.id)}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onCancel(appointment.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onSendReminder(appointment)}>
                      <Bell className="w-4 h-4" />
                    </Button>
                  </>
                )
              }

              if (appointment.status === 'confirmed') {
                if (isToday) {
                  return (
                    <Button size="sm" onClick={() => onCheckIn(appointment.id)}>
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  )
                }
                return (
                  <>
                    <Button size="sm" variant="destructive" onClick={() => onCancel(appointment.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                )
              }

              if (appointment.status === 'in-waiting-room' && isToday) {
                return (
                  <Button size="sm" variant="outline">
                    في الانتظار
                  </Button>
                )
              }

              if (appointment.status === 'in-progress' && isToday) {
                return (
                  <Button size="sm" variant="outline">
                    جاري الفحص
                  </Button>
                )
              }

              if (appointment.status === 'done' && isToday) {
                return (
                  <Button size="sm" variant="outline">
                    <Check className="w-4 h-4" />
                  </Button>
                )
              }

              return null
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
