'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card-redesigned'
import { Badge } from '@/components/ui/badge-redesigned'
import { Calendar, Clock, User } from 'lucide-react'
import { Appointment } from '../types'

interface WeeklyCalendarProps {
  appointments: Appointment[]
  onAppointmentMove: (appointmentId: string, newDate: string, newTime: string) => void
}

export function WeeklyCalendar({ appointments, onAppointmentMove }: WeeklyCalendarProps) {
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null)

  // Get the current week dates
  const getWeekDates = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)) // Start from Monday

    const weekDates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      weekDates.push(date)
    }
    return weekDates
  }

  const weekDates = getWeekDates()
  const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

  // Time slots (9 AM to 6 PM)
  const timeSlots = []
  for (let hour = 9; hour <= 18; hour++) {
    timeSlots.push(`${hour}:00`)
  }

  const getAppointmentsForSlot = (date: Date, time: string) => {
    const dateString = date.toISOString().split('T')[0]
    return appointments.filter(a => {
      const appointmentDate = a.appointmentDate || a.date
      return appointmentDate === dateString && a.startTime === time
    })
  }

  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    setDraggedAppointment(appointment)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, date: Date, time: string) => {
    e.preventDefault()
    if (draggedAppointment) {
      const dateString = date.toISOString().split('T')[0]
      onAppointmentMove(draggedAppointment.id, dateString, time)
      setDraggedAppointment(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200'
      case 'in-waiting-room': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'done': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1200px]">
        {/* Header row with day names and dates */}
        <div className="grid grid-cols-8 gap-2 mb-4">
          <div className="font-semibold text-gray-900">الوقت</div>
          {weekDates.map((date, index) => {
            const dayIndex = date.getDay()
            return (
              <div key={index} className="text-center">
                <div className="font-semibold text-gray-900">{dayNames[dayIndex]}</div>
                <div className="text-sm text-gray-600">{date.toLocaleDateString('ar-EG')}</div>
              </div>
            )
          })}
        </div>

        {/* Calendar grid */}
        <div className="space-y-2">
          {timeSlots.map(time => (
            <div key={time} className="grid grid-cols-8 gap-2">
              <div className="flex items-center justify-center font-medium text-gray-900 text-sm">
                {time}
              </div>
              {weekDates.map((date, dayIndex) => {
                const slotAppointments = getAppointmentsForSlot(date, time)
                return (
                  <div
                    key={dayIndex}
                    className="min-h-[80px] bg-gray-50 rounded border border-gray-200 p-2"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, date, time)}
                  >
                    {slotAppointments.map(appointment => (
                      <Card
                        key={appointment.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, appointment)}
                        className={`cursor-move hover:shadow-md transition-shadow ${getStatusColor(appointment.status)} border`}
                      >
                        <CardContent className="pt-2 pb-2 px-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-xs truncate">
                              {appointment.patientName || 'مريض غير معروف'}
                            </span>
                            {appointment.priority === 'emergency' && (
                              <Badge variant="destructive" className="text-xs px-1 py-0">!</Badge>
                            )}
                          </div>
                          {appointment.doctorName && (
                            <div className="text-xs opacity-80 truncate">{appointment.doctorName}</div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
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
