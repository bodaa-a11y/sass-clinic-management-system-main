'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Calendar, Users, Stethoscope, Clock, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

interface DoctorDashboardProps {
  todayAppointments: number
  completedConsultations: number
  waitingPatients: number
  followUpNeeded: number
  avgConsultationTime: number
}

export function DoctorDashboard({
  todayAppointments,
  completedConsultations,
  waitingPatients,
  followUpNeeded,
  avgConsultationTime
}: DoctorDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
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
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedConsultations}</div>
          <p className="text-xs text-muted-foreground">استشارات مكتملة</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">في الانتظار</CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{waitingPatients}</div>
          <p className="text-xs text-muted-foreground">مرضى في غرفة الانتظار</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">تحتاج متابعة</CardTitle>
          <AlertCircle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{followUpNeeded}</div>
          <p className="text-xs text-muted-foreground">مرضى يحتاجون متابعة</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">متوسط الوقت</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgConsultationTime}</div>
          <p className="text-xs text-muted-foreground">دقيقة لكل استشارة</p>
        </CardContent>
      </Card>
    </div>
  )
}
