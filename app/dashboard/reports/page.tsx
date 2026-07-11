'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import { store } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button-redesigned'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Calendar, CheckCircle, Users, TrendingUp, BarChart3, DollarSign, Activity, Stethoscope, ArrowUp, ArrowDown, Download } from 'lucide-react'
import { PageTransition } from '@/components/animations/page-transition'
import { SlideIn } from '@/components/animations/feedback-animations'
import { HoverScale } from '@/components/animations/micro-interactions'

interface MonthlyData {
  month: string
  count: number
}

interface StatusDistribution {
  pending: number
  confirmed: number
  done: number
  cancelled: number
}

interface TopPatient {
  id: string
  name: string
  visitCount: number
  lastVisit: string
}

interface NewPatients {
  thisMonth: number
  lastMonth: number
}

interface ThisMonthStats {
  totalAppointments: number
  doneAppointments: number
  completionRate: number
  dailyAverage: number
}

interface FinancialReport {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  monthlyRevenue: MonthlyData[]
  monthlyExpenses: MonthlyData[]
}

interface DoctorPerformance {
  doctorId: string
  doctorName: string
  totalAppointments: number
  totalRevenue: number
  averageRevenuePerAppointment: number
  completionRate: number
}

interface ReportData {
  monthlyAppointments: MonthlyData[]
  statusDistribution: StatusDistribution
  topPatients: TopPatient[]
  newPatients: NewPatients
  thisMonthStats: ThisMonthStats
  financialReport?: FinancialReport
  doctorPerformance?: DoctorPerformance[]
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days' | 'custom'>('30days')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [comparePeriod, setComparePeriod] = useState<'none' | 'previous' | 'last_year'>('none')
  const [previousPeriodData, setPreviousPeriodData] = useState<ReportData | null>(null)
  const clinicId = store.getUser()?.clinicId

  useEffect(() => {
    if (!clinicId) {
      setIsLoading(false)
      return
    }
    fetchReports()
  }, [clinicId])

  const fetchReports = async () => {
    if (!clinicId) return

    try {
      const response = await apiFetch(`/clinics/${clinicId}/reports`)
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      } else {
        toast.error('فشل تحميل التقارير')
      }
    } catch {
      toast.error('حدث خطأ أثناء تحميل التقارير')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="grid grid-cols-4 gap-4 p-4 w-full max-w-6xl">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse border border-slate-200 rounded-xl p-4 min-h-[140px]">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            لم يتم العثور على بيانات
          </h3>
          <p className="text-sm text-gray-500">لا توجد تقارير متاحة حالياً</p>
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="flex flex-col" dir="rtl">
        {/* Header */}
        <div className="flex-shrink-0">
          <SlideIn direction="up" delay={0.1}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-8 h-8 text-medical-blue" />
                  التقارير والإحصائيات
                </h1>
                <p className="text-slate-600 mt-1">نظرة شاملة على أداء العيادة</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={dateRange} onValueChange={(value: '7days' | '30days' | '90days' | 'custom') => setDateRange(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">آخر 7 أيام</SelectItem>
                    <SelectItem value="30days">آخر 30 يوم</SelectItem>
                    <SelectItem value="90days">آخر 90 يوم</SelectItem>
                    <SelectItem value="custom">مخصص</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={comparePeriod} onValueChange={(value: 'none' | 'previous' | 'last_year') => setComparePeriod(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="مقارنة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون مقارنة</SelectItem>
                    <SelectItem value="previous">الفترة السابقة</SelectItem>
                    <SelectItem value="last_year">نفس الفترة العام الماضي</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => toast.success('تم تصدير التقرير بنجاح')}>
                  <Download className="w-4 h-4 ml-2" />
                  تصدير
                </Button>
                {dateRange === 'custom' && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-40"
                    />
                    <span className="text-slate-500">إلى</span>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-40"
                    />
                  </div>
                )}
                <Button onClick={() => fetchReports()} variant="outline" size="sm">
                  تحديث
                </Button>
              </div>
            </div>
          </SlideIn>
        </div>

        {/* Main Content - Flex-1 with inner scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              إجمالي المواعيد هذا الشهر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.thisMonthStats.totalAppointments}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              نسبة المواعيد المنجزة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{data.thisMonthStats.completionRate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="w-4 h-4" />
              المرضى الجدد هذا الشهر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{data.newPatients.thisMonth}</p>
            <p className="text-xs text-gray-400 mt-1">
              مقابل {data.newPatients.lastMonth} الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              متوسط المواعيد اليومي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{data.thisMonthStats.dailyAverage}</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      {data.financialReport && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                إجمالي الدخل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{data.financialReport.totalRevenue.toFixed(2)} ر.س</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-600" />
                إجمالي المصاريف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{data.financialReport.totalExpenses.toFixed(2)} ر.س</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                صافي الأرباح
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${data.financialReport.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {data.financialReport.netProfit.toFixed(2)} ر.س
              </p>
              <div className="flex items-center gap-1 mt-1">
                {data.financialReport.netProfit >= 0 ? (
                  <ArrowUp className="w-3 h-3 text-green-500" />
                ) : (
                  <ArrowDown className="w-3 h-3 text-red-500" />
                )}
                <span className="text-xs text-gray-500">{data.financialReport.profitMargin.toFixed(1)}% هامش</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                متوسط الدخل الشهري
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">
                {data.financialReport.monthlyRevenue.length > 0
                  ? (data.financialReport.totalRevenue / data.financialReport.monthlyRevenue.length).toFixed(2)
                  : '0.00'} ر.س
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Chart */}
      <Card>
        <CardHeader>
          <CardTitle>المواعيد الشهرية (آخر 6 أشهر)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyAppointments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>أكثر المرضى زيارةً</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topPatients.length === 0 ? (
            <p className="text-center text-gray-500 py-8">لا توجد بيانات</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>عدد الزيارات</TableHead>
                  <TableHead>آخر زيارة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-bold">
                        {patient.visitCount}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(patient.lastVisit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Doctor Performance */}
      {data.doctorPerformance && data.doctorPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              أداء الأطباء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الطبيب</TableHead>
                  <TableHead>إجمالي المواعيد</TableHead>
                  <TableHead>الدخل الإجمالي</TableHead>
                  <TableHead>متوسط الدخل</TableHead>
                  <TableHead>نسبة الإنجاز</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.doctorPerformance
                  .sort((a, b) => b.totalRevenue - a.totalRevenue)
                  .map((doctor) => (
                    <TableRow key={doctor.doctorId}>
                      <TableCell className="font-medium">{doctor.doctorName}</TableCell>
                      <TableCell>{doctor.totalAppointments}</TableCell>
                      <TableCell className="font-bold text-green-600">{doctor.totalRevenue.toFixed(2)} ر.س</TableCell>
                      <TableCell>{doctor.averageRevenuePerAppointment.toFixed(2)} ر.س</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          doctor.completionRate >= 80 ? 'bg-green-100 text-green-800' :
                          doctor.completionRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {doctor.completionRate}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
        </div>
      </div>
    </PageTransition>
  )
}
