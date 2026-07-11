'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Calendar, Phone, Mail, FileText, DollarSign, Heart, MapPin, AlertCircle } from 'lucide-react'

interface Patient {
  id: string
  fullName: string
  phone: string
  email?: string
  dateOfBirth?: string
  gender?: string
  address?: string
  emergencyContact?: string
  medicalHistory?: string
  allergies?: string
  createdAt: string
}

interface PatientStats {
  totalVisits: number
  cancelledCount: number
  lastVisitDate: string | null
  medicalRecordsCount: number
}

interface FinancialSummary {
  totalAmount: string
  paidAmount: string
  balanceAmount: string
  invoiceCount: number
}

interface OverviewTabProps {
  patient: Patient
  stats: PatientStats
  financialSummary: FinancialSummary
}

export function OverviewTab({ patient, stats, financialSummary }: OverviewTabProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA')
  }

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return 'غير محدد'
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1
    }
    return age
  }

  return (
    <div className="space-y-6">
      {/* Patient Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            معلومات المريض الأساسية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-500">الاسم الكامل</label>
              <p className="font-medium">{patient.fullName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">رقم الهاتف</label>
              <p className="font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {patient.phone}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">البريد الإلكتروني</label>
              <p className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {patient.email || 'غير محدد'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">تاريخ الميلاد</label>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'غير محدد'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">العمر</label>
              <p className="font-medium">{calculateAge(patient.dateOfBirth)} سنة</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">الجنس</label>
              <p className="font-medium">{patient.gender === 'male' ? 'ذكر' : patient.gender === 'female' ? 'أنثى' : 'غير محدد'}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-500">العنوان</label>
              <p className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {patient.address || 'غير محدد'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">جهة الاتصال للطوارئ</label>
              <p className="font-medium">{patient.emergencyContact || 'غير محدد'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            المعلومات الطبية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-gray-500">التاريخ الطبي</label>
            <p className="font-medium">{patient.medicalHistory || 'لا يوجد'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">الحساسية</label>
            <div className="flex items-start gap-2">
              {patient.allergies ? (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500 mt-1 flex-shrink-0" />
                  <p className="font-medium text-red-600">{patient.allergies}</p>
                </>
              ) : (
                <p className="font-medium text-gray-500">لا يوجد حساسية معروفة</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">إجمالي الزيارات</p>
                <p className="text-2xl font-bold">{stats.totalVisits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">السجلات الطبية</p>
                <p className="text-2xl font-bold">{stats.medicalRecordsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">آخر زيارة</p>
                <p className="text-lg font-bold">
                  {stats.lastVisitDate ? formatDate(stats.lastVisitDate) : 'لا يوجد'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-500">الرصيد المستحق</p>
                <p className="text-2xl font-bold">{financialSummary.balanceAmount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            الملخص المالي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">إجمالي الفواتير</p>
              <p className="text-2xl font-bold text-blue-700">{financialSummary.totalAmount}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">المدفوع</p>
              <p className="text-2xl font-bold text-green-700">{financialSummary.paidAmount}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">المتبقي</p>
              <p className="text-2xl font-bold text-red-700">{financialSummary.balanceAmount}</p>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">
            عدد الفواتير: {financialSummary.invoiceCount}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
