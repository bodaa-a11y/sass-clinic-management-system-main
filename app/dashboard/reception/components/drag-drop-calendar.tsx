'use client'

import { useState } from 'react'
import { GripVertical, Clock, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card-redesigned'
import { Badge } from '@/components/ui/badge-redesigned'

interface Appointment {
  id: string
  patientName: string
  time: string
  appointmentDate: string
  status: string
  type: string
}

interface DragDropCalendarProps {
  appointments: Appointment[]
  onAppointmentMove: (appointmentId: string, newDate: string, newTime: string) => void
}

export function DragDropCalendar({ appointments, onAppointmentMove }: DragDropCalendarProps) {
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null)

  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    setDraggedAppointment(appointment)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetDate: string, targetTime: string) => {
    e.preventDefault()
    if (draggedAppointment) {
      onAppointmentMove(draggedAppointment.id, targetDate, targetTime)
      setDraggedAppointment(null)
    }
  }

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ]

  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">سحب وإفلات المواعيد</h3>
        <p className="text-sm text-muted-foreground">
          اسحب الموعد لتغيير الوقت أو التاريخ
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div className="font-medium text-sm">الوقت</div>
            {days.map((day) => (
              <div key={day} className="font-medium text-sm text-center">
                {day}
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-8 gap-2 mb-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {time}
              </div>
              {days.map((day, dayIndex) => {
                const date = new Date()
                const dayOffset = dayIndex === 0 ? 0 : dayIndex
                date.setDate(date.getDate() + dayOffset)
                const dateString = date.toISOString().split('T')[0]

                const appointment = appointments.find(
                  (apt) => apt.time === time && apt.appointmentDate === dateString
                )

                return (
                  <div
                    key={`${day}-${time}`}
                    className={`min-h-[60px] border rounded-lg p-2 transition-colors ${
                      draggedAppointment ? 'border-dashed border-blue-500' : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, dateString, time)}
                  >
                    {appointment ? (
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, appointment)}
                        className={`p-2 rounded ${getStatusColor(appointment.status)} cursor-move`}
                      >
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 opacity-50" />
                          <div className="flex-1">
                            <p className="font-medium text-xs truncate">{appointment.patientName}</p>
                            <p className="text-xs opacity-75">{appointment.type}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                        فارغ
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
