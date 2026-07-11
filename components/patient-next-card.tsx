'use client'

import { Badge } from '@/components/ui/badge-redesigned'
import { Button } from '@/components/ui/button'
import { User, Activity, Calendar, Stethoscope } from 'lucide-react'

interface PatientData {
  patient: {
    id: string
    fullName: string
    phone: string
    dateOfBirth?: string
    allergies?: string
  }
  medicalRecords?: Array<{
    diagnosis: string
    createdAt: string
  }>
  stats?: {
    totalVisits: number
    lastVisitDate?: string
  }
}

interface PatientNextCardProps {
  patientData: PatientData | null
  onStartExam: () => void
}

export function PatientNextCard({ patientData, onStartExam }: PatientNextCardProps) {
  if (!patientData || !patientData.patient) {
    return (
      <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
        <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">لا يوجد مريض تالي</p>
      </div>
    )
  }

  const { patient, stats } = patientData

  // Calculate age
  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null
    const birth = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const age = patient ? calculateAge(patient.dateOfBirth) : null

  // Determine if first visit or follow-up
  const isFirstVisit = !stats || stats.totalVisits <= 1

  return (
    <div className="bg-white rounded-lg border border-blue-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-700" />
          المريض التالي
        </h3>
        <Badge variant={isFirstVisit ? 'default' : 'secondary'} className="text-xs">
          {isFirstVisit ? 'أول مرة' : 'إعادة'}
        </Badge>
      </div>

      {/* Patient Info */}
      <div className="space-y-3">
        <div>
          <p className="text-xl font-bold text-gray-900">{patient.fullName}</p>
          <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
            {age && <span>{age} سنة</span>}
            {patient.phone && <span>• {patient.phone}</span>}
          </div>
        </div>

        {/* Vital Signs */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            العلامات الحيوية
          </h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-gray-500">ضغط الدم:</span>
              <span className="font-medium text-gray-900 mr-1">120/80</span>
            </div>
            <div>
              <span className="text-gray-500">النبض:</span>
              <span className="font-medium text-gray-900 mr-1">72</span>
            </div>
            <div>
              <span className="text-gray-500">الحرارة:</span>
              <span className="font-medium text-gray-900 mr-1">36.5°</span>
            </div>
          </div>
        </div>

        {/* Visit History */}
        {stats && stats.lastVisitDate && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>آخر زيارة: {new Date(stats.lastVisitDate).toLocaleDateString('ar-SA')}</span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <Button
        onClick={onStartExam}
        className="w-full bg-blue-700 hover:bg-blue-800 text-white"
        size="lg"
      >
        <Stethoscope className="w-5 h-5 ml-2" />
        بدء الفحص
      </Button>
    </div>
  )
}
