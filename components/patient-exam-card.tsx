'use client'

import { Badge } from '@/components/ui/badge-redesigned'
import { User, Activity, Calendar, AlertTriangle, FileText } from 'lucide-react'

interface PatientData {
  patient: {
    id: string
    fullName: string
    phone: string
    dateOfBirth?: string
    allergies?: string
    medicalHistory?: string
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

interface PatientExamCardProps {
  patientData: PatientData
  isPrescriptionStepOpen?: boolean
}

export function PatientExamCard({ patientData, isPrescriptionStepOpen = false }: PatientExamCardProps) {
  const { patient, medicalRecords, stats } = patientData

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

  // Parse allergies
  const hasAllergies = patient?.allergies && patient.allergies.trim().length > 0
  const allergiesList = hasAllergies ? (patient!.allergies || '').split(',').map(a => a.trim()) : []

  // Get recent records
  const recentRecords = medicalRecords?.slice(0, 2) || []

  return (
    <div className="bg-white rounded-lg border border-blue-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{patient?.fullName}</h2>
            <div className="flex items-center gap-3 text-gray-600 mt-1">
              {age && <span>{age} سنة</span>}
              {patient?.phone && <span>• {patient.phone}</span>}
              <span>• {patient?.id.slice(0, 8)}</span>
            </div>
          </div>
        </div>
        <Badge variant={isFirstVisit ? 'default' : 'secondary'} className="text-sm px-4 py-2">
          {isFirstVisit ? 'أول مرة' : 'إعادة'}
        </Badge>
      </div>

      {/* Allergies Alert */}
      {hasAllergies && (
        <div className={`bg-red-50 border-2 border-red-300 rounded-xl p-4 ${isPrescriptionStepOpen ? 'animate-pulse' : ''}`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-700" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-red-800 text-lg mb-2">⚠️ الحساسية مطلوب</h4>
              <div className="flex flex-wrap gap-2">
                {allergiesList.map((allergy, idx) => (
                  <Badge key={idx} className="bg-red-200 text-red-900 hover:bg-red-300 border-red-400 text-sm px-3 py-1">
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vital Signs */}
      <div>
        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-700" />
          العلامات الحيوية
        </h3>
        <div className="grid grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">ضغط الدم</p>
            <p className="text-xl font-bold text-gray-900 mt-1">120/80</p>
            <p className="text-xs text-gray-400">mmHg</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">النبض</p>
            <p className="text-xl font-bold text-gray-900 mt-1">72</p>
            <p className="text-xs text-gray-400">bpm</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">الحرارة</p>
            <p className="text-xl font-bold text-gray-900 mt-1">36.5</p>
            <p className="text-xs text-gray-400">°C</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">الوزن</p>
            <p className="text-xl font-bold text-gray-900 mt-1">70</p>
            <p className="text-xs text-gray-400">kg</p>
          </div>
        </div>
      </div>

      {/* Medical History */}
      {patient?.medicalHistory && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">التاريخ الطبي</h3>
          <p className="text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-4">
            {patient.medicalHistory}
          </p>
        </div>
      )}

      {/* Recent Medical Records */}
      {recentRecords.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            السجلات الطبية السابقة
          </h3>
          <div className="space-y-2">
            {recentRecords.map((record, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="font-medium text-gray-900">{record.diagnosis}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(record.createdAt).toLocaleDateString('ar-SA')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visit Stats */}
      {stats && (
        <div className="pt-4 border-t flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>إجمالي الزيارات: <strong className="text-gray-900">{stats.totalVisits}</strong></span>
          </div>
          {stats.lastVisitDate && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>آخر زيارة: <strong className="text-gray-900">{new Date(stats.lastVisitDate).toLocaleDateString('ar-SA')}</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
