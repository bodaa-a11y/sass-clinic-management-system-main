'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { store } from '@/lib/store';
import { can } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned';
import { Button } from '@/components/ui/button-redesigned';
import { Badge } from '@/components/ui/badge-redesigned';
import { Skeleton } from '@/components/ui/skeleton-redesigned';
import { toast } from 'sonner';
import { useTenant } from '@/lib/tenant-context';
import { PageTransition } from '@/components/animations/page-transition';
import { SlideIn } from '@/components/animations/feedback-animations';
import { HoverScale } from '@/components/animations/micro-interactions';
import { ResponsiveBentoGrid } from '@/components/layout/bento-grid';
import { Sparkline } from '@/components/charts/sparkline';
import { BookingChart } from '@/components/charts/booking-chart';
import { MedicalData } from '@/components/ui/typography';
import { PredictiveHighlight } from '@/components/ai/predictive-highlight';
import { AIBubble } from '@/components/ai/ai-bubble';
import {
  Calendar,
  Users,
  Clock,
  DollarSign,
  FileText,
  Pill,
  Plus,
  Check,
  X,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Stethoscope,
  UserCheck,
  Building2,
  Timer
} from 'lucide-react';
import Link from 'next/link';

interface TodayAppointment {
  id: string;
  startTime: string;
  patientName: string;
  doctorName: string;
  status: 'pending' | 'confirmed' | 'in-waiting-room' | 'in-progress' | 'done' | 'cancelled' | 'no-show';
  checkInTime?: string;
  startTimeActual?: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  roles?: string[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { facilityType, enabledModules } = useTenant();
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    totalStaff: 0,
    pendingInvoices: 0,
    attendanceRate: 0,
    completedAppointments: 0,
    todayRevenue: 0,
    todayExpenses: 0,
    netProfit: 0,
    remainingPatients: 0,
    availableDoctors: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // Mock historical data for sparklines
  const [sparklineData, setSparklineData] = useState({
    appointments: [12, 15, 18, 14, 20, 22, 25],
    patients: [150, 155, 160, 158, 162, 165, 170],
    staff: [8, 8, 9, 9, 10, 10, 11],
    attendance: [85, 88, 82, 90, 87, 89, 92],
  });
  
  // Mock booking chart data (last 7 days)
  const [bookingData, setBookingData] = useState([
    { date: 'السبت', appointments: 12 },
    { date: 'الأحد', appointments: 15 },
    { date: 'الاثنين', appointments: 18 },
    { date: 'الثلاثاء', appointments: 14 },
    { date: 'الأربعاء', appointments: 20 },
    { date: 'الخميس', appointments: 22 },
    { date: 'الجمعة', appointments: 25 },
  ]);

  useEffect(() => {
    const userData = store.getUser();
    setUserRole(userData?.role || null);
    setUser(userData);
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const user = store.getUser();
    if (!user?.clinicId) {
      setIsLoading(false);
      return;
    }
    const clinicId = user.clinicId;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch based on role permissions
      const requests: Promise<Response>[] = [
        apiFetch(`/clinics/${clinicId}/appointments?date=${today}`),
        apiFetch(`/clinics/${clinicId}/patients`),
      ];

      // Only fetch staff for users with staff-management permission
      if (can(user.permissions, 'staff-management', 'view')) {
        requests.push(apiFetch(`/clinics/${clinicId}/staff?role=doctor`));
      }

      // Only fetch invoices for users with invoices permission
      if (can(user.permissions, 'invoices', 'view')) {
        requests.push(apiFetch(`/clinics/${clinicId}/invoices`));
      }

      // Only fetch expenses for users with finance permission
      if (can(user.permissions, 'finance', 'view')) {
        requests.push(apiFetch(`/clinics/${clinicId}/expenses`));
      }

      const responses = await Promise.all(requests);
      const appointmentsData = await responses[0].json();
      const patientsData = await responses[1].json();

      const newStats = {
        todayAppointments: appointmentsData.count || 0,
        totalPatients: patientsData.count || 0,
        totalStaff: 0,
        pendingInvoices: 0,
        attendanceRate: 0,
        completedAppointments: 0,
        todayRevenue: 0,
        todayExpenses: 0,
        netProfit: 0,
        remainingPatients: 0,
        availableDoctors: 0,
      };

      // Parse staff data if available
      let responseIndex = 2;
      if (can(user.permissions, 'staff-management', 'view') && responses[responseIndex]) {
        const staffData = await responses[responseIndex].json();
        newStats.totalStaff = staffData.count || 0;
        // Assume all doctors are available (in a real app, you'd check their schedule)
        newStats.availableDoctors = staffData.count || 0;
        responseIndex++;
      }

      // Parse invoices data if available
      if (can(user.permissions, 'invoices', 'view') && responses[responseIndex]) {
        const invoicesData = await responses[responseIndex].json();
        newStats.pendingInvoices = (invoicesData.data || [])
          .filter((inv: any) => ['draft', 'sent', 'overdue'].includes(inv.status))
          .length;

        // Calculate today's revenue
        const today = new Date().toISOString().split('T')[0];
        newStats.todayRevenue = (invoicesData.data || [])
          .filter((inv: any) => inv.createdAt?.startsWith(today) && inv.status !== 'cancelled')
          .reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount || 0), 0);
        responseIndex++;
      }

      // Parse expenses data if available
      if (can(user.permissions, 'finance', 'view') && responses[responseIndex]) {
        const expensesData = await responses[responseIndex].json();
        const today = new Date().toISOString().split('T')[0];
        newStats.todayExpenses = (expensesData.data || [])
          .filter((exp: any) => exp.date?.startsWith(today))
          .reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || 0), 0);
        
        // Calculate net profit
        newStats.netProfit = newStats.todayRevenue - newStats.todayExpenses;
      }

      // Calculate attendance rate and completed appointments
      const appointments = appointmentsData.data || [];
      const completed = appointments.filter((apt: any) => apt.status === 'done').length;
      const cancelled = appointments.filter((apt: any) => apt.status === 'cancelled' || apt.status === 'no-show').length;
      const total = appointments.length;
      newStats.completedAppointments = completed;
      newStats.remainingPatients = total - completed;
      newStats.attendanceRate = total > 0 ? Math.round(((total - cancelled) / total) * 100) : 0;

      setStats(newStats);

      const todaysList = (appointmentsData.data || []).map((apt: any) => ({
        id: apt.id,
        startTime: apt.startTime,
        patientName: apt.patientName || apt.patientId,
        doctorName: apt.doctorName || apt.doctorId,
        status: apt.status,
      }));

      todaysList.sort((a: TodayAppointment, b: TodayAppointment) => a.startTime.localeCompare(b.startTime));
      setTodayAppointments(todaysList);
      
      // Fetch recent patients
      const patientsList = (patientsData.data || []).slice(0, 5).map((patient: any) => ({
        id: patient.id,
        name: patient.name || patient.patientName,
        dob: patient.dob || patient.dateOfBirth,
        gender: patient.gender,
        nationality: patient.nationality || 'سعودي',
        regDate: patient.createdAt || new Date().toISOString().split('T')[0],
      }));
      setRecentPatients(patientsList);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('فشل تحميل الإحصائيات. يرجى المحاولة مرة أخرى أو تحديث الصفحة.', {
        description: 'تأكد من اتصال الإنترنت وحاول مرة أخرى',
        action: {
          label: 'إعادة المحاولة',
          onClick: () => fetchStats(),
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; color: string }> = {
      pending: { label: 'جديد', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'مؤكد', color: 'bg-green-100 text-green-800' },
      'in-waiting-room': { label: 'في الانتظار', color: 'bg-orange-100 text-orange-800' },
      'in-progress': { label: 'في الكشف', color: 'bg-purple-100 text-purple-800' },
      done: { label: 'منجز', color: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-800' },
      'no-show': { label: 'عدم حضور', color: 'bg-gray-100 text-gray-800' }
    }
    const { label, color } = variants[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
    return <Badge className={color}>{label}</Badge>
  };

  const getWaitTime = (checkInTime?: string, startTimeActual?: string) => {
    if (!checkInTime && !startTimeActual) return null;
    
    const referenceTime = startTimeActual || checkInTime;
    if (!referenceTime) return null;
    
    const diff = Math.floor((new Date().getTime() - new Date(referenceTime).getTime()) / 60000);
    return `${diff} د`;
  };

  const getWaitTimeColor = (minutes: number) => {
    if (minutes < 15) return 'text-green-600';
    if (minutes < 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 17) return 'مساء الخير';
    return 'مساء الخير';
  };

  const quickActions: QuickAction[] = [
    {
      title: 'مريض جديد',
      description: 'تسجيل مريض جديد',
      icon: <Users className="w-5 h-5" />,
      href: '/dashboard/reception',
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-600',
      roles: ['clinic_admin', 'receptionist']
    },
    {
      title: 'حجز موعد',
      description: 'حجز موعد جديد',
      icon: <Calendar className="w-5 h-5" />,
      href: '/dashboard/reception',
      color: 'bg-green-50 hover:bg-green-100 text-green-600',
      roles: ['clinic_admin', 'receptionist']
    },
    {
      title: 'غرفة الطبيب',
      description: 'بدء فحص مريض',
      icon: <Stethoscope className="w-5 h-5" />,
      href: '/dashboard/doctor',
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-600',
      roles: ['doctor', 'clinic_admin', 'super_admin']
    },
    {
      title: 'إدارة الاستقبال',
      description: 'إضافة موظف استقبال (عيادة واحدة)',
      icon: <UserCheck className="w-5 h-5" />,
      href: '/dashboard/admin',
      color: 'bg-pink-50 hover:bg-pink-100 text-pink-600',
      roles: ['doctor']
    },
    {
      title: 'إدارة العيادة',
      description: 'إدارة الموظفين والإعدادات',
      icon: <Building2 className="w-5 h-5" />,
      href: '/dashboard/admin',
      color: 'bg-orange-50 hover:bg-orange-100 text-orange-600',
      roles: ['clinic_admin', 'super_admin']
    },
    {
      title: 'المالية',
      description: 'إدارة الفواتير والمدفوعات',
      icon: <DollarSign className="w-5 h-5" />,
      href: '/dashboard/finance',
      color: 'bg-teal-50 hover:bg-teal-100 text-teal-600',
      roles: ['clinic_admin', 'receptionist']
    },
    {
      title: 'سجل المرضى',
      description: 'عرض سجل المرضى',
      icon: <FileText className="w-5 h-5" />,
      href: '/dashboard/reception',
      color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600',
      roles: ['doctor']
    }
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen overflow-hidden" dir="rtl">
        {/* Header Skeleton */}
        <div className="flex-shrink-0 flex items-center justify-between py-4">
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>

        {/* Quick Stats Skeleton - Compact */}
        <div className="flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border border-slate-200 min-h-[100px] rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <Skeleton className="h-4 w-16 mb-1" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-lg" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom Row Skeleton */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
          {/* Booking Chart Skeleton */}
          <Card className="lg:col-span-2 border border-slate-200 rounded-xl h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>

          {/* Appointments Skeleton */}
          <Card className="lg:col-span-1 border border-slate-200 rounded-xl h-full flex flex-col">
            <CardHeader className="flex-shrink-0 flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Skeleton className="h-5 w-12" />
                      <div className="flex-1 min-w-0">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col h-screen overflow-hidden" dir="rtl">
        {/* Header */}
        <SlideIn direction="up" delay={0.1}>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-slate-900">
                {getGreeting()}، {user?.name || user?.email || ''}
              </h1>
              <p className="text-base text-slate-600">
                {userRole === 'doctor' && facilityType === 'single_clinic' && 'عيادة طبيب واحد'}
                {userRole === 'doctor' && facilityType === 'multi_clinic' && 'عيادة متعددة أطباء'}
                {userRole === 'doctor' && facilityType === 'medical_center' && 'مركز طبي'}
                {userRole === 'receptionist' && 'موظف الاستقبال'}
                {userRole === 'clinic_admin' && 'مدير العيادة'}
                {userRole === 'super_admin' && 'المدير العام'}
                {' • '}
                {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <AIBubble state="idle" size="md" />
              <HoverScale>
                <Button onClick={fetchStats} variant="outline" size="lg">
                  تحديث
                </Button>
              </HoverScale>
            </div>
          </div>
        </SlideIn>

        {/* Quick Stats with Sparklines - Compact */}
        <div className="flex-shrink-0">
          <ResponsiveBentoGrid
            gap={4}
            items={[
              {
                id: 'appointments',
                size: 'small' as const,
                content: (
                  <HoverScale>
                    <Card className="border border-slate-200 h-full min-h-[100px] rounded-xl">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-xs text-slate-600 mb-1">مواعيد اليوم</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.todayAppointments}</p>
                          </div>
                          <div className="w-10 h-10 bg-medical-blue/10 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-medical-blue" aria-hidden="true" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Sparkline data={sparklineData.appointments} color="#0066CC" width={60} height={25} showTrend />
                          <p className="text-[10px] text-slate-500">{stats.completedAppointments} مكتمل</p>
                        </div>
                      </CardContent>
                    </Card>
                  </HoverScale>
                ),
              },
              {
                id: 'patients',
                size: 'small' as const,
                content: (
                  <HoverScale>
                    <Card className="border border-slate-200 h-full min-h-[100px] rounded-xl">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-xs text-slate-600 mb-1">المرضى</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.totalPatients}</p>
                          </div>
                          <div className="w-10 h-10 bg-emerald-success/10 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-emerald-success" aria-hidden="true" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Sparkline data={sparklineData.patients} color="#10B981" width={60} height={25} showTrend />
                          <p className="text-[10px] text-slate-500">إجمالي</p>
                        </div>
                      </CardContent>
                    </Card>
                  </HoverScale>
                ),
              },
              {
                id: 'attendance',
                size: 'small' as const,
                content: (
                  <HoverScale>
                    <Card className="border border-slate-200 h-full min-h-[100px] rounded-xl">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-xs text-slate-600 mb-1">معدل الحضور</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.attendanceRate}%</p>
                          </div>
                          <div className="w-10 h-10 bg-teal-secondary/10 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 text-teal-secondary" aria-hidden="true" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Sparkline data={sparklineData.attendance} color="#14B8A6" width={60} height={25} showTrend />
                          <div className="flex items-center gap-1">
                            {stats.attendanceRate >= 80 ? (
                              <TrendingUp className="w-3 h-3 text-emerald-success" aria-hidden="true" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-red-500" aria-hidden="true" />
                            )}
                            <p className={`text-[10px] ${stats.attendanceRate >= 80 ? 'text-emerald-success' : 'text-red-500'}`}>
                              {stats.attendanceRate >= 80 ? 'ممتاز' : 'يحتاج تحسين'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </HoverScale>
                ),
              },
              ...(userRole === 'clinic_admin' || userRole === 'receptionist' ? [{
                id: 'revenue',
                size: 'small' as const,
                content: (
                  <HoverScale>
                    <Card className="border border-slate-200 h-full min-h-[100px] rounded-xl">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-xs text-slate-600 mb-1">إيرادات اليوم</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.todayRevenue.toFixed(0)}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-500">مصروف: {stats.todayExpenses.toFixed(0)}</span>
                              <span className={`text-[10px] ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                صافي: {stats.netProfit.toFixed(0)}
                              </span>
                            </div>
                          </div>
                          <div className="w-10 h-10 bg-amber-warning/10 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-amber-warning" aria-hidden="true" />
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2">{stats.pendingInvoices} فاتورة معلقة</p>
                      </CardContent>
                    </Card>
                  </HoverScale>
                ),
              }] : []),
            ]}
          />
        </div>

        {/* Bottom Row - Grid 2x1 with Contextual Relevance */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
          {/* Booking Chart - Left (Dynamic: 70% if appointments <= 5, 50% if > 10) */}
          <SlideIn direction="up" delay={0.2} className={`min-h-0 ${todayAppointments.length > 10 ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
            <Card className="border border-slate-200 rounded-xl h-full flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="w-4 h-4 text-medical-blue" />
                  حجم المواعيد - آخر 7 أيام
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                {bookingData.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        لا توجد بيانات حجز
                      </h3>
                      <p className="text-sm text-gray-500">لم يتم تسجيل أي مواعيد في الأيام السبعة الماضية</p>
                    </div>
                  </div>
                ) : (
                  <BookingChart data={bookingData} height={200} />
                )}
              </CardContent>
            </Card>
          </SlideIn>

          {/* Today's Appointments - Right (Dynamic: 30% if appointments <= 5, 50% if > 10) */}
          <SlideIn direction="up" delay={0.3} className={`min-h-0 ${todayAppointments.length > 10 ? 'lg:col-span-2' : 'lg:col-span-1'}`}>
            <Card className="border border-slate-200 rounded-xl h-full flex flex-col">
              <CardHeader className="flex-shrink-0 flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="w-4 h-4 text-medical-blue" />
                  مواعيد اليوم
                </CardTitle>
                <Link href="/dashboard/appointments">
                  <Button size="sm" variant="ghost">
                    عرض الكل
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4">
                {todayAppointments.length === 0 ? (
                  <div className="text-center py-4">
                    <Calendar className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">لا توجد مواعيد اليوم</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayAppointments.slice(0, 5).map((apt) => {
                      const waitTime = getWaitTime(apt.checkInTime, apt.startTimeActual);
                      const waitMinutes = waitTime ? parseInt(waitTime) : 0;
                      
                      return (
                        <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="text-sm font-semibold text-blue-600 min-w-[50px]">{apt.startTime}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900 truncate">{apt.patientName}</div>
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-gray-600 truncate">{apt.doctorName}</div>
                                {waitTime && (apt.status === 'in-waiting-room' || apt.status === 'in-progress') && (
                                  <Badge variant="outline" className={`text-[10px] flex items-center gap-1 border-orange-200 ${getWaitTimeColor(waitMinutes)}`}>
                                    <Timer className="w-3 h-3" />
                                    {waitTime}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {getStatusBadge(apt.status)}
                          </div>
                        </div>
                      );
                    })}
                    {todayAppointments.length > 5 && (
                      <div className="text-center pt-2">
                        <Link href="/dashboard/appointments">
                          <Button variant="ghost" size="sm" className="text-xs">
                            +{todayAppointments.length - 5} مواعيد أخرى
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </SlideIn>
        </div>

      {/* Today's Appointments - Removed (moved to bottom row) */}

      {/* Recent Patients Table - Removed */}
    </div>
    </PageTransition>
  );
}
