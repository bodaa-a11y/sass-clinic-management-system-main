'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Users, Calendar, DollarSign, TrendingUp, Building2, Activity, Clock, AlertCircle } from 'lucide-react'

interface AdminDashboardProps {
  totalStaff: number
  activeDoctors: number
  activeReceptionists: number
  todayAppointments: number
  monthlyRevenue: string
  pendingInvoices: number
  completedAppointments?: number
  totalPatients?: number
  waitingPatients?: number
  clinicName?: string
  facilityType?: string
}

export function AdminDashboard({
  totalStaff,
  activeDoctors,
  activeReceptionists,
  todayAppointments,
  monthlyRevenue,
  pendingInvoices,
  completedAppointments = 0,
  totalPatients = 0,
  waitingPatients = 0,
  clinicName,
  facilityType
}: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Clinic Info */}
      {clinicName && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{clinicName}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {facilityType === 'single_clinic' && 'عيادة فردية'}
              {facilityType === 'multi_clinic' && 'شركة عيادات'}
              {facilityType === 'medical_center' && 'مركز طبي'}
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الموظفين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStaff}</div>
            <p className="text-xs text-muted-foreground">
              {activeDoctors} طبيب • {activeReceptionists} استقبال
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مواعيد اليوم</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments}</div>
            <p className="text-xs text-muted-foreground">مواعيد مجدولة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مكتملة</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedAppointments}</div>
            <p className="text-xs text-muted-foreground">مواعيد مكتملة اليوم</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المرضى</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
            <p className="text-xs text-muted-foreground">مرضى مسجلين</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فواتير معلقة</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">بانتظار الدفع</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نشاط النظام</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">نشط</div>
            <p className="text-xs text-muted-foreground">جميع الأنظمة تعمل</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط وقت الانتظار</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">دقيقة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل النمو</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">+15%</div>
            <p className="text-xs text-muted-foreground">مقارنة بالشهر الماضي</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
