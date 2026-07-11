'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, Stethoscope } from 'lucide-react'

interface AppointmentCardProps {
  appointment: {
    id: string
    patientName: string
    doctorName?: string
    startTime: string
    appointmentDate?: string
    status: 'pending' | 'confirmed' | 'in-waiting-room' | 'in-progress' | 'done' | 'cancelled' | 'no-show'
  }
  onClick?: () => void
  showActions?: boolean
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'جديد', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'مؤكد', color: 'bg-green-100 text-green-800' },
  'in-waiting-room': { label: 'في الانتظار', color: 'bg-orange-100 text-orange-800' },
  'in-progress': { label: 'في الكشف', color: 'bg-purple-100 text-purple-800' },
  done: { label: 'منجز', color: 'bg-blue-100 text-blue-800' },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-800' },
  'no-show': { label: 'عدم حضور', color: 'bg-gray-100 text-gray-800' }
}

export function AppointmentCard({ appointment, onClick, showActions = true }: AppointmentCardProps) {
  const { label, color } = STATUS_CONFIG[appointment.status] || { label: appointment.status, color: 'bg-gray-100 text-gray-800' }

  return (
    <Card 
      className={`hover:shadow-md transition-shadow cursor-pointer ${onClick ? 'hover:border-blue-300' : ''}`}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{appointment.patientName}</h3>
                <Badge className={color}>{label}</Badge>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{appointment.startTime}</span>
              </div>
              {appointment.doctorName && (
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" />
                  <span>{appointment.doctorName}</span>
                </div>
              )}
              {appointment.appointmentDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(appointment.appointmentDate).toLocaleDateString('ar-SA')}</span>
                </div>
              )}
            </div>
          </div>
          
          {showActions && (
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <User className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
