'use client'

import { Badge } from '@/components/ui/badge-redesigned'
import { Button } from '@/components/ui/button'
import { Clock, User, Stethoscope, AlertCircle, TrendingUp } from 'lucide-react'
import { PatientNextCard } from '@/components/patient-next-card'

interface Appointment {
  id: string
  patientId: string
  patientName: string
  startTime: string
  status: 'pending' | 'confirmed' | 'in-waiting-room' | 'in-progress' | 'done' | 'cancelled' | 'no-show'
  priority?: 'normal' | 'priority' | 'emergency'
  appointmentDate?: string
}

interface WaitingListBarProps {
  waitingPatients: Appointment[]
  inProgressAppointments?: Appointment[]
  onStartExam: (appointment: Appointment) => void
  onPatientSelect?: (appointment: Appointment) => void
  nextPatientData?: any
}

export function WaitingListBar({ waitingPatients, inProgressAppointments = [], onStartExam, onPatientSelect, nextPatientData }: WaitingListBarProps) {
  // Ensure waitingPatients is an array
  const patients = Array.isArray(waitingPatients) ? waitingPatients : []
  const inProgress = Array.isArray(inProgressAppointments) ? inProgressAppointments : []

  // Sort patients by appointment time (earliest first)
  const sortedPatients = [...patients].sort((a, b) => {
    const timeA = new Date(`${a.appointmentDate || new Date().toISOString().split('T')[0]}T${a.startTime}`)
    const timeB = new Date(`${b.appointmentDate || new Date().toISOString().split('T')[0]}T${b.startTime}`)
    return timeA.getTime() - timeB.getTime()
  })

  // Get next patient (first in sorted list who is not in-progress)
  const nextPatient = sortedPatients.find(p => p.status !== 'in-progress' && p.status !== 'done') || null

  // Calculate waiting time
  const getWaitingTime = (startTime: string, appointmentDate?: string) => {
    const now = new Date()
    const appointmentTime = new Date(`${appointmentDate || now.toISOString().split('T')[0]}T${startTime}`)
    const diffMs = now.getTime() - appointmentTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 0) return `في ${Math.abs(diffMins)} دقيقة`
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`
    if (diffMins < 120) return 'منذ ساعة'
    return `منذ ${Math.floor(diffMins / 60)} ساعة`
  }

  // Determine status badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-waiting-room':
        return <Badge variant="default" className="bg-blue-100 text-blue-700">في غرفة الانتظار</Badge>
      case 'confirmed':
        return <Badge variant="secondary">مؤكد</Badge>
      case 'pending':
        return <Badge variant="outline">قيد الانتظار</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Determine priority badge
  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'emergency':
        return <Badge variant="destructive" className="bg-red-500">طوارئ</Badge>
      case 'priority':
        return <Badge variant="default" className="bg-orange-500">أولوية</Badge>
      case 'normal':
      default:
        return null
    }
  }

  // Calculate statistics
  const stats = {
    totalWaiting: sortedPatients.length,
    inWaitingRoom: sortedPatients.filter(p => p.status === 'in-waiting-room').length,
    confirmed: sortedPatients.filter(p => p.status === 'confirmed').length,
    emergency: sortedPatients.filter(p => p.priority === 'emergency').length,
    avgWaitTime: sortedPatients.length > 0 
      ? Math.floor(sortedPatients.reduce((acc, p) => {
          const now = new Date()
          const appointmentTime = new Date(`${p.appointmentDate || now.toISOString().split('T')[0]}T${p.startTime}`)
          return acc + (now.getTime() - appointmentTime.getTime())
        }, 0) / patients.length / 60000)
      : 0
  }

  return (
    <div className="h-full flex flex-col bg-white/90 backdrop-blur-sm rounded-lg border overflow-hidden">
      {/* Quick Statistics Bar */}
      <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-1 text-gray-700">
            <User className="w-3 h-3" />
            <span className="font-medium">{stats.totalWaiting}</span>
            <span className="text-gray-500">الإجمالي</span>
          </div>
          <div className="flex items-center gap-1 text-blue-700">
            <Clock className="w-3 h-3" />
            <span className="font-medium">{stats.inWaitingRoom}</span>
            <span className="text-gray-500">في الغرفة</span>
          </div>
          <div className="flex items-center gap-1 text-green-700">
            <TrendingUp className="w-3 h-3" />
            <span className="font-medium">{stats.confirmed}</span>
            <span className="text-gray-500">مؤكد</span>
          </div>
          {stats.emergency > 0 && (
            <div className="flex items-center gap-1 text-red-700">
              <AlertCircle className="w-3 h-3" />
              <span className="font-medium">{stats.emergency}</span>
              <span className="text-gray-500">طوارئ</span>
            </div>
          )}
        </div>
      </div>

      {/* In-Progress Section */}
      {inProgress.length > 0 && (
        <div className="border-b bg-blue-50/50">
          <div className="p-4 border-b bg-blue-100/50">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-900">
              <Stethoscope className="w-4 h-4" />
              جاري الفحص
              <Badge variant="default" className="mr-auto bg-blue-600">
                {inProgress.length}
              </Badge>
            </h4>
          </div>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-50 sticky top-0">
                <tr>
                  <th className="text-right py-2 px-3 font-medium text-blue-900">الاسم</th>
                  <th className="text-right py-2 px-3 font-medium text-blue-900">الحالة</th>
                  <th className="text-right py-2 px-3 font-medium text-blue-900">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {inProgress.map((appointment) => (
                  <tr key={appointment.id} className="border-b border-blue-100 hover:bg-blue-50">
                    <td className="py-3 px-3 font-medium text-gray-900">{appointment.patientName}</td>
                    <td className="py-3 px-3">
                      <Badge variant="default" className="bg-green-100 text-green-700">جاري الفحص</Badge>
                    </td>
                    <td className="py-3 px-3">
                      <Button
                        size="sm"
                        onClick={() => onStartExam(appointment)}
                        className="bg-green-700 hover:bg-green-800 text-white"
                      >
                        متابعة
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Waiting List Section */}
      <div className="p-4 border-b bg-gray-50/50">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Clock className="w-5 h-5" />
          قائمة الانتظار
          <Badge variant="secondary" className="mr-auto">
            {sortedPatients.length}
          </Badge>
        </h3>
        {stats.avgWaitTime > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            متوسط وقت الانتظار: {stats.avgWaitTime} دقيقة
          </p>
        )}
      </div>

      {/* Compact Table */}
      <div className="flex-1 overflow-y-auto">
        {sortedPatients.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">لا يوجد مرضى في الانتظار</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-right py-2 px-3 font-medium text-gray-700">الاسم</th>
                <th className="text-right py-2 px-3 font-medium text-gray-700">الحالة</th>
                <th className="text-right py-2 px-3 font-medium text-gray-700">الوقت</th>
                <th className="text-right py-2 px-3 font-medium text-gray-700">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {sortedPatients.map((appointment) => (
                <tr 
                  key={appointment.id} 
                  className={`border-b hover:bg-gray-50 ${
                    appointment.priority === 'emergency' ? 'bg-red-50 border-red-200' : 'border-gray-100'
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onPatientSelect && onPatientSelect(appointment)}
                        className="font-medium text-gray-900 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        {appointment.patientName}
                      </button>
                      {getPriorityBadge(appointment.priority)}
                    </div>
                  </td>
                  <td className="py-3 px-3">{getStatusBadge(appointment.status)}</td>
                  <td className="py-3 px-3 text-xs text-gray-500">
                    {getWaitingTime(appointment.startTime, appointment.appointmentDate)}
                  </td>
                  <td className="py-3 px-3">
                    <Button
                      size="sm"
                      onClick={() => onStartExam(appointment)}
                      disabled={appointment.status === 'in-progress' || appointment.status === 'done'}
                      className={
                        appointment.priority === 'emergency'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-blue-700 hover:bg-blue-800 text-white'
                      }
                    >
                      بدء
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Next Patient Card */}
      <div className="p-4 border-t bg-gray-50/50">
        <PatientNextCard
          patientData={nextPatientData}
          onStartExam={() => nextPatient && onStartExam(nextPatient)}
        />
      </div>
    </div>
  )
}
