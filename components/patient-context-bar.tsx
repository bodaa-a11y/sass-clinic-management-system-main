'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card-redesigned'
import { Badge } from '@/components/ui/badge-redesigned'
import { User, Activity, AlertTriangle, FileText, Calendar } from 'lucide-react'

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

interface PatientContextBarProps {
  patientData: PatientData
  isPrescriptionStepOpen?: boolean
}

export function PatientContextBar({ patientData, isPrescriptionStepOpen = false }: PatientContextBarProps) {
  const { patient, medicalRecords, stats } = patientData

  // Calculate age from date of birth
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

  // Parse allergies and check if any exist
  const hasAllergies = patient?.allergies && patient.allergies.trim().length > 0
  const allergiesList = hasAllergies ? (patient!.allergies || '').split(',').map(a => a.trim()) : []

  // Get last 2 medical records for brief history
  const recentRecords = medicalRecords?.slice(0, 2) || []

  return (
    <div className="h-full flex flex-col bg-white/90 backdrop-blur-sm rounded-lg border overflow-hidden">
      <div className="p-4 space-y-4 overflow-y-auto">
        {/* Patient Identity Card */}
        {patient && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-lg">{patient.fullName}</h3>
                <div className="text-sm text-gray-600 mt-1 font-mono">
                  {patient.id.slice(0, 8)}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  {age && <span>{age} سنة</span>}
                  {patient.phone && <span>• {patient.phone}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vital Signs */}
        <div>
          <h3 className="font-semibold text-sm text-gray-500 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-700" />
            العلامات الحيوية
          </h3>
          <div className="space-y-2 bg-white rounded-lg p-3 border border-gray-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">ضغط الدم</span>
              <span className="font-bold text-slate-900">120/80 mmHg</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">النبض</span>
              <span className="font-bold text-slate-900">72 bpm</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">الحرارة</span>
              <span className="font-bold text-slate-900">36.5°C</span>
            </div>
          </div>
        </div>

        {/* Allergies Alert */}
        {hasAllergies && (
          <motion.div
            className="bg-red-50 border-2 border-red-300 rounded-xl p-4"
            animate={isPrescriptionStepOpen ? {
              scale: [1, 1.05, 1],
            } : {}}
            transition={{
              duration: 1,
              repeat: isPrescriptionStepOpen ? Infinity : 0,
              repeatDelay: 0.5,
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-700" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-red-800 text-base mb-2">⚠️ الحساسية مطلوب</h4>
                <div className="flex flex-wrap gap-2">
                  {allergiesList.map((allergy, idx) => (
                    <Badge key={idx} className="bg-red-200 text-red-900 hover:bg-red-300 border-red-400 text-sm px-3 py-1">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Medical History Brief */}
        {patient && patient.medicalHistory && (
          <div>
            <h3 className="font-semibold text-sm text-gray-500 mb-2">التاريخ الطبي</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {patient.medicalHistory}
            </p>
          </div>
        )}

        {/* Recent Medical Records */}
        {recentRecords.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm text-gray-500 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              السجلات الطبية السابقة
            </h3>
            <div className="space-y-2">
              {recentRecords.map((record, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-gray-100">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{record.diagnosis}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(record.createdAt).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visit Stats */}
        {stats && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">إجمالي الزيارات:</span>
              <span className="font-medium text-slate-900">{stats.totalVisits}</span>
            </div>
            {stats.lastVisitDate && (
              <div className="flex items-center gap-2 text-sm mt-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">آخر زيارة:</span>
                <span className="font-medium text-slate-900">
                  {new Date(stats.lastVisitDate).toLocaleDateString('ar-SA')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
