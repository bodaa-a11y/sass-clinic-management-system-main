'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, AlertTriangle, Calendar, User, Activity } from 'lucide-react'

interface PatientQuickViewProps {
  patientId: string
  patientName: string
  clinicId?: string
}

interface MedicalRecord {
  id: string
  chiefComplaint: string
  diagnosis: string
  createdAt: string
  doctorName: string
}

interface PatientInfo {
  id: string
  fullName: string
  phone: string
  dateOfBirth?: string
  gender?: string
  medicalHistory?: string
  allergies?: string
}

export function PatientQuickView({ patientId, patientName, clinicId }: PatientQuickViewProps) {
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null)
  const [recentRecords, setRecentRecords] = useState<MedicalRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (patientId && clinicId) {
      fetchPatientData()
    } else {
      setIsLoading(false)
    }
  }, [patientId, clinicId])

  const fetchPatientData = async () => {
    if (!patientId || !clinicId) {
      setIsLoading(false)
      return
    }

    try {
      const [patientRes, recordsRes] = await Promise.all([
        apiFetch(`/clinics/${clinicId}/patients/${patientId}`),
        apiFetch(`/clinics/${clinicId}/medical-records?patientId=${patientId}&limit=3`)
      ])

      if (patientRes.ok) {
        const patientData = await patientRes.json()
        setPatientInfo(patientData.data)
      }

      if (recordsRes.ok) {
        const recordsData = await recordsRes.json()
        setRecentRecords(recordsData.data || [])
      }
    } catch {
      // Silently fail - this is optional data
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA')
  }

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            معلومات المريض
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          معلومات المريض
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="font-semibold">{patientName}</span>
            {patientInfo?.gender && (
              <Badge variant="outline" className="text-xs">
                {patientInfo.gender === 'male' ? 'ذكر' : 'أنثى'}
              </Badge>
            )}
            {patientInfo?.dateOfBirth && (
              <Badge variant="outline" className="text-xs">
                {calculateAge(patientInfo.dateOfBirth)} سنة
              </Badge>
            )}
          </div>
          {patientInfo?.phone && (
            <div className="text-sm text-gray-600">
              {patientInfo.phone}
            </div>
          )}
        </div>

        {/* Medical History */}
        {patientInfo?.medicalHistory && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-sm">التاريخ المرضي</span>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {patientInfo.medicalHistory}
            </p>
          </div>
        )}

        {/* Allergies */}
        {patientInfo?.allergies && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="font-medium text-sm text-red-700">الحساسية</span>
            </div>
            <p className="text-sm text-red-700 bg-red-50 p-2 rounded">
              {patientInfo.allergies}
            </p>
          </div>
        )}

        {/* Recent Medical Records */}
        {recentRecords.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="font-medium text-sm">آخر الفحوصات</span>
            </div>
            <div className="space-y-2">
              {recentRecords.slice(0, 2).map((record) => (
                <div key={record.id} className="text-sm bg-gray-50 p-2 rounded">
                  <div className="flex justify-between items-start">
                    <span className="font-medium">{record.diagnosis}</span>
                    <span className="text-xs text-gray-500">{formatDate(record.createdAt)}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {record.chiefComplaint}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recentRecords.length === 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-sm text-gray-500">سجل الفحوصات</span>
            </div>
            <p className="text-sm text-gray-500">
              لا يوجد فحوصات سابقة
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
