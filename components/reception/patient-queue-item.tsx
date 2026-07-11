import { useWaitTimer } from '@/hooks/use-wait-timer'
import { useQueryData } from '@/lib/use-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Check, X, DollarSign } from 'lucide-react'
import { PatientProgressStepper } from '@/components/patient-progress-stepper'

interface PatientQueueItemProps {
  appointment: any
  clinicId: string | null
  canEditAppointments: boolean
  isUpdatingStatus: boolean
  handleStatusChange: (id: string, oldStatus: string, newStatus: string) => void
  getStatusBadge: (status: string) => React.ReactNode
}

export function PatientQueueItem({
  appointment,
  clinicId,
  canEditAppointments,
  isUpdatingStatus,
  handleStatusChange,
  getStatusBadge
}: PatientQueueItemProps) {
  const { waitMinutes, isOverThreshold, formattedWaitTime } = useWaitTimer(
    appointment.checkInTime || appointment.startTime,
    30
  )

  const { data: patientDebt } = useQueryData<{ data: { totalDue: number; hasDebt: boolean } }>(
    clinicId ? `/clinics/${clinicId}/patients/${appointment.patientId}/debt` : '',
    { enabled: !!clinicId }
  )

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all gap-3 ${isOverThreshold ? 'bg-red-50 border-red-300' : ''}`}>
      <div className="flex-1 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{appointment.patientName}</h4>
              {patientDebt?.data?.hasDebt && (
                <Badge variant="destructive" className="text-xs">
                  <DollarSign className="w-3 h-3 ml-1" />
                  Due: {patientDebt.data.totalDue}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{appointment.patientPhone}</p>
          </div>
          <div className="flex gap-2">
            {getStatusBadge(appointment.status)}
            <PatientProgressStepper status={appointment.status} size="sm" />
            <Badge variant={isOverThreshold ? 'destructive' : 'outline'} className={isOverThreshold ? 'animate-pulse' : ''}>
              <Clock className="w-3 h-3 ml-1" />
              {formattedWaitTime}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {appointment.startTime}
        </p>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        {appointment.status === 'pending' && canEditAppointments && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusChange(appointment.id, appointment.status, 'confirmed')}
            disabled={isUpdatingStatus}
            className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all"
          >
            <Check className="w-4 h-4" />
          </Button>
        )}
        {(appointment.status === 'pending' || appointment.status === 'confirmed') && canEditAppointments && (
          <Button
            size="sm"
            onClick={() => handleStatusChange(appointment.id, appointment.status, 'in-waiting-room')}
            disabled={isUpdatingStatus}
          >
            <Clock className="w-4 h-4 ml-2" />
            تسجيل وصول
          </Button>
        )}
        {canEditAppointments && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleStatusChange(appointment.id, appointment.status, 'cancelled')}
            disabled={isUpdatingStatus}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
