'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Calendar, Users, DollarSign, Clock, TrendingUp, AlertCircle } from 'lucide-react'

interface ReceptionDashboardProps {
  todayAppointments: number
  totalPatients: number
  pendingInvoices: number
  waitingPatients: number
  completedAppointments?: number
}

export function ReceptionDashboard({
  todayAppointments,
  totalPatients,
  pendingInvoices,
  waitingPatients,
  completedAppointments = 0
}: ReceptionDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-900">مواعيد اليوم</CardTitle>
          <Calendar className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">{todayAppointments}</div>
          <p className="text-xs text-blue-700">مواعيد مجدولة لهذا اليوم</p>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-900">مكتملة</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">{completedAppointments}</div>
          <p className="text-xs text-green-700">مواعيد مكتملة اليوم</p>
        </CardContent>
      </Card>

      <Card className="border-gray-200 bg-gray-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-900">إجمالي المرضى</CardTitle>
          <Users className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{totalPatients}</div>
          <p className="text-xs text-gray-700">المرضى المسجلين في النظام</p>
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-900">فواتير معلقة</CardTitle>
          <DollarSign className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-900">{pendingInvoices}</div>
          <p className="text-xs text-red-700">فواتير تحتاج دفع</p>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-yellow-900">في الانتظار</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-900">{waitingPatients}</div>
          <p className="text-xs text-yellow-700">مرضى في غرفة الانتظار</p>
        </CardContent>
      </Card>
    </div>
  )
}
