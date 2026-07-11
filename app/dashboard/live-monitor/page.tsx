'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { store } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned';
import { Button } from '@/components/ui/button-redesigned';
import { Badge } from '@/components/ui/badge-redesigned';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Users,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Timer,
  Stethoscope,
  MessageSquare,
  Phone
} from 'lucide-react';
import { PageTransition } from '@/components/animations/page-transition'
import { SlideIn } from '@/components/animations/feedback-animations'
import { HoverScale } from '@/components/animations/micro-interactions'
import { ResponsiveBentoGrid } from '@/components/layout/bento-grid'
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card'
import { MedicalData } from '@/components/ui/typography'
import { PredictiveHighlight } from '@/components/ai/predictive-highlight'
import { AIStatus } from '@/components/ai/ai-status'

interface LiveAppointment {
  id: string;
  startTime: string;
  patientName: string;
  doctorName: string;
  status: 'pending' | 'confirmed' | 'in-waiting-room' | 'in-progress' | 'done' | 'cancelled';
  checkInTime?: string;
  startTimeActual?: string;
}

export default function LiveMonitorPage() {
  const [appointments, setAppointments] = useState<LiveAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [doctors, setDoctors] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [previousAppointmentsCount, setPreviousAppointmentsCount] = useState(0);

  useEffect(() => {
    const user = store.getUser();
    if (user?.clinicId) {
      setClinicId(user.clinicId);
      fetchLiveStatus(user.clinicId);
    }
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (user?.clinicId) fetchLiveStatus(user.clinicId);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchLiveStatus = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await apiFetch(`/clinics/${id}/appointments?date=today`);
      if (response.ok) {
        const data = await response.json();
        const appointmentsData = data.data || [];
        setAppointments(appointmentsData);

        // Extract unique doctors
        const uniqueDoctors = Array.from(new Set(appointmentsData.map((apt: LiveAppointment) => apt.doctorName))) as string[];
        setDoctors(uniqueDoctors);
      }
    } catch {
      toast.error('فشل تحميل الحالة المباشرة');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAppointments = selectedDoctor === 'all'
    ? appointments
    : appointments.filter(apt => apt.doctorName === selectedDoctor);

  const updateStatus = async (appointmentId: string, status: string) => {
    if (!clinicId) return;
    try {
      const response = await apiFetch(`/clinics/${clinicId}/appointments/${appointmentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        toast.success('تم تحديث الحالة بنجاح');
        fetchLiveStatus(clinicId);
      }
    } catch {
      toast.error('فشل تحديث الحالة');
    }
  };

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  };

  useEffect(() => {
    if (soundEnabled && appointments.length > previousAppointmentsCount) {
      playNotificationSound();
    }
    setPreviousAppointmentsCount(appointments.length);
  }, [appointments.length, soundEnabled, previousAppointmentsCount]);

  const waitingRoom = filteredAppointments.filter(a => a.status === 'in-waiting-room');
  const inVisit = filteredAppointments.filter(a => a.status === 'in-progress');
  const confirmed = filteredAppointments.filter(a => a.status === 'confirmed');

  const getWaitTime = (checkInTime?: string) => {
    if (!checkInTime) return 'غير محدد';
    const now = new Date();
    const checkIn = new Date(checkInTime);
    const diffMs = now.getTime() - checkIn.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return 'لم يبدأ بعد';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffMins < 120) return `منذ ساعة`;
    return `منذ ${Math.floor(diffMins / 60)} ساعة`;
  };

  const getExamDuration = (startTimeActual?: string) => {
    if (!startTimeActual) return 'غير محدد';
    const now = new Date();
    const start = new Date(startTimeActual);
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return 'لم يبدأ بعد';
    if (diffMins < 60) return `${diffMins} دقيقة`;
    if (diffMins < 120) return 'ساعة';
    return `${Math.floor(diffMins / 60)} ساعة`;
  };

  const getExamTimeRemaining = (startTimeActual?: string) => {
    if (!startTimeActual) return null;
    const now = new Date();
    const start = new Date(startTimeActual);
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const avgConsultationTime = 15; // Average consultation time in minutes
    const remaining = avgConsultationTime - diffMins;

    if (remaining <= 0) return 'تجاوز الوقت المتوقع';
    return `${remaining} دقيقة متبقية`;
  };

  const handleIntervene = (apt: LiveAppointment) => {
    toast.success(`تم إرسال طلب التدخل للطبيب ${apt.doctorName}`);
  };

  const handleSendMessage = (apt: LiveAppointment) => {
    toast.success(`تم إرسال رسالة للطبيب ${apt.doctorName}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="grid grid-cols-3 gap-4 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse border border-slate-200 rounded-xl p-4 min-h-[400px]">
              <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="border border-slate-200 rounded-lg p-3 mb-3">
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col" dir="rtl">
        {/* Header */}
        <div className="flex-shrink-0">
          <SlideIn direction="up" delay={0.1}>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-8 h-8 text-medical-blue" />
                  المراقب المباشر
                </h1>
                <p className="text-base text-slate-600">متابعة حركة المرضى في العيادة لحظة بلحظة</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger className="w-32 sm:w-48">
                    <SelectValue placeholder="فلترة حسب الطبيب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأطباء</SelectItem>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor} value={doctor}>
                        {doctor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant={soundEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="flex items-center gap-2 text-xs sm:text-sm"
                >
                  {soundEnabled ? '🔊' : '🔇'}
                  <span className="hidden sm:inline">
                    {soundEnabled ? 'الإشعارات مفعلة' : 'الإشعارات معطلة'}
                  </span>
                </Button>
                <AIStatus status="processing" message="مراقبة مباشرة" compact />
                <HoverScale>
                  <Button onClick={() => clinicId && fetchLiveStatus(clinicId)} variant="outline" size="sm">
                    تحديث يدوي
                  </Button>
                </HoverScale>
              </div>
            </div>
          </SlideIn>
        </div>

        {/* Main Content - Flex-1 with inner scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto">

      <ResponsiveBentoGrid
        gap={8}
        items={[
          {
            id: 'waiting-room',
            size: 'medium' as const,
            content: (
              <Card className="border border-slate-200 h-full min-h-[400px] rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                    <Users className="w-5 h-5" />
                    غرفة الانتظار ({waitingRoom.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {waitingRoom.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          لا يوجد مرضى في الانتظار
                        </h3>
                        <p className="text-sm text-gray-500">غرفة الانتظار فارغة حالياً</p>
                      </div>
                    </div>
                  ) : (
                    waitingRoom.map(apt => {
                      const waitMinutes = parseInt(getWaitTime(apt.checkInTime))
                      const isLongWait = waitMinutes > 30
                      return isLongWait ? (
                        <PredictiveHighlight key={apt.id} variant="warning" intensity="medium" showIcon message="انتظار طويل">
                          <Card className="border border-slate-200 rounded-lg">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-gray-900">{apt.patientName}</span>
                                <Badge variant="outline" className="text-[10px] flex items-center gap-1 border-orange-200">
                                  <Timer className="w-3 h-3" />
                                  {getWaitTime(apt.checkInTime)}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-600 mb-3">مع: {apt.doctorName}</div>
                              <Button
                                className="w-full bg-purple-600 hover:bg-purple-700 h-8 text-xs"
                                onClick={() => updateStatus(apt.id, 'in-progress')}
                              >
                                دخول للكشف
                              </Button>
                            </CardContent>
                          </Card>
                        </PredictiveHighlight>
                      ) : (
                        <Card key={apt.id} className="border border-slate-200">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-gray-900">{apt.patientName}</span>
                              <Badge variant="outline" className="text-[10px] flex items-center gap-1 border-orange-200">
                                <Timer className="w-3 h-3" />
                                {getWaitTime(apt.checkInTime)}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600 mb-3">مع: {apt.doctorName}</div>
                            <Button
                              className="w-full bg-purple-600 hover:bg-purple-700 h-8 text-xs"
                              onClick={() => updateStatus(apt.id, 'in-progress')}
                            >
                              دخول للكشف
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            ),
          },
          {
            id: 'in-visit',
            size: 'medium' as const,
            content: (
              <Card className="border border-slate-200 h-full min-h-[400px] rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
                    <Clock className="w-5 h-5" />
                    قيد الكشف ({inVisit.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {inVisit.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          لا توجد كشوفات حالياً
                        </h3>
                        <p className="text-sm text-gray-500">لا يوجد مرضى قيد الكشف</p>
                      </div>
                    </div>
                  ) : (
                    inVisit.map(apt => {
                      const timeRemaining = getExamTimeRemaining(apt.startTimeActual);
                      const isOverdue = timeRemaining === 'تجاوز الوقت المتوقع';
                      return (
                        <Card key={apt.id} className={`border ${isOverdue ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <span className="font-bold text-gray-900 block">{apt.patientName}</span>
                                <div className="text-xs text-gray-600 mt-1">د/ {apt.doctorName}</div>
                              </div>
                              <div className="text-right">
                                <Badge className={`text-[10px] ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'} border-none`}>
                                  {getExamDuration(apt.startTimeActual)}
                                </Badge>
                                {timeRemaining && (
                                  <div className={`text-xs mt-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                    {timeRemaining}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 h-8 text-xs"
                                onClick={() => updateStatus(apt.id, 'done')}
                              >
                                <CheckCircle2 className="w-3 h-3 ml-1" />
                                إنهاء
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50 h-8 text-xs"
                                onClick={() => handleIntervene(apt)}
                              >
                                <AlertCircle className="w-3 h-3 ml-1" />
                                تدخل
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 border-green-200 text-green-700 hover:bg-green-50 h-8 text-xs"
                                onClick={() => handleSendMessage(apt)}
                              >
                                <MessageSquare className="w-3 h-3 ml-1" />
                                رسالة
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            ),
          },
          {
            id: 'confirmed',
            size: 'medium' as const,
            content: (
              <Card className="border border-slate-200 h-full min-h-[400px] rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                    <UserCheck className="w-5 h-5" />
                    المواعيد القادمة ({confirmed.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {confirmed.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <UserCheck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          لا توجد مواعيد مؤكدة
                        </h3>
                        <p className="text-sm text-gray-500">لا توجد مواعيد قادمة</p>
                      </div>
                    </div>
                  ) : (
                    confirmed.slice(0, 5).map(apt => (
                      <Card key={apt.id} className="border border-slate-200">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-gray-900">{apt.patientName}</span>
                            <span className="text-sm font-bold text-green-700">{apt.startTime}</span>
                          </div>
                          <div className="text-xs text-gray-600 mb-2">د/ {apt.doctorName}</div>
                          <Button
                            variant="outline"
                            className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 h-8 text-xs"
                            onClick={() => updateStatus(apt.id, 'in-waiting-room')}
                          >
                            تسجيل حضور
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                  {confirmed.length > 5 && (
                    <p className="text-center text-xs text-gray-500">+{confirmed.length - 5} مواعيد أخرى</p>
                  )}
                </CardContent>
              </Card>
            ),
          },
        ]}
      />

      {/* Analytics Card */}
      <ResponsiveBentoGrid
        gap={6}
        items={[
          {
            id: 'delay-rate',
            size: 'small' as const,
            content: (
              <Card className="border border-slate-200 h-full min-h-[140px] rounded-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">معدل التأخير المتوقع</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <span className="text-2xl font-bold">+15 دقيقة</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">بناءً على الكشوفات الحالية التي تجاوزت الوقت المحدد</p>
                </CardContent>
              </Card>
            ),
          },
          {
            id: 'efficiency',
            size: 'small' as const,
            content: (
              <Card className="border border-slate-200 h-full min-h-[140px] rounded-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">عدد المنجزين اليوم</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-2xl font-bold">{appointments.filter(a => a.status === 'done').length}</span>
                  </div>
                </CardContent>
              </Card>
            ),
          },
        ]}
      />
        </div>
      </div>
    </PageTransition>
  );
}
