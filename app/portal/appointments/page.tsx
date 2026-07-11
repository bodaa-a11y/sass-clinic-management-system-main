'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Plus, ArrowLeft, Loader2, User, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string | null;
  status: string;
  priority: string;
  notes: string | null;
  doctor: {
    name: string | null;
    specialtyId: string | null;
  };
  specialty: {
    name: string | null;
  };
  createdAt: string;
}

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/portal/appointments');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch appointments');
      }

      setAppointments(data.appointments || []);
    } catch (error) {
      console.error('Fetch appointments error:', error);
      toast.error('فشل في تحميل المواعيد');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'معلق', variant: 'secondary' },
      confirmed: { label: 'مؤكد', variant: 'default' },
      'in-waiting-room': { label: 'في غرفة الانتظار', variant: 'outline' },
      'in-progress': { label: 'جاري الفحص', variant: 'default' },
      done: { label: 'مكتمل', variant: 'default' },
      'no-show': { label: 'لم يحضر', variant: 'destructive' },
      cancelled: { label: 'ملغي', variant: 'destructive' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'emergency') {
      return <Badge variant="destructive" className="bg-red-500">طوارئ</Badge>;
    }
    if (priority === 'priority') {
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">أولوية</Badge>;
    }
    return <Badge variant="secondary">عادي</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'م' : 'ص';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const isUpcoming = (appointment: Appointment) => {
    const appointmentDate = new Date(appointment.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointmentDate >= today && appointment.status !== 'cancelled' && appointment.status !== 'done';
  };

  const upcomingAppointments = appointments.filter(isUpcoming);
  const pastAppointments = appointments.filter(a => !isUpcoming(a));

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/portal/dashboard"
              className="text-gray-600 hover:text-gray-900 mb-4 inline-flex items-center"
            >
              <ArrowLeft className="ml-2 h-4 w-4" />
              العودة إلى لوحة التحكم
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">المواعيد</h1>
            <p className="text-gray-600 mt-2">
              إدارة مواعيدك الطبية
            </p>
          </div>
          <Link href="/portal/appointments/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="ml-2 h-4 w-4" />
              حجز موعد جديد
            </Button>
          </Link>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Upcoming Appointments */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                المواعيد القادمة
              </h2>
              {upcomingAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">لا توجد مواعيد قادمة</p>
                    <Link href="/portal/appointments/new" className="mt-4 inline-block">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="ml-2 h-4 w-4" />
                        حجز موعد جديد
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(appointment.status)}
                              {getPriorityBadge(appointment.priority)}
                            </div>
                            <CardTitle className="text-xl">
                              {formatDate(appointment.appointmentDate)}
                            </CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>
                              {formatTime(appointment.startTime)}
                              {appointment.endTime && ` - ${formatTime(appointment.endTime)}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="h-4 w-4" />
                            <span>د. {appointment.doctor.name || 'غير محدد'}</span>
                            {appointment.specialty.name && (
                              <>
                                <span>•</span>
                                <span>{appointment.specialty.name}</span>
                              </>
                            )}
                          </div>
                          {appointment.notes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-600">{appointment.notes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Past Appointments */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-gray-600" />
                المواعيد السابقة
              </h2>
              {pastAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-gray-600">لا توجد مواعيد سابقة</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pastAppointments.map((appointment) => (
                    <Card key={appointment.id} className="opacity-75">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(appointment.status)}
                              {getPriorityBadge(appointment.priority)}
                            </div>
                            <CardTitle className="text-lg text-gray-700">
                              {formatDate(appointment.appointmentDate)}
                            </CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>
                              {formatTime(appointment.startTime)}
                              {appointment.endTime && ` - ${formatTime(appointment.endTime)}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="h-4 w-4" />
                            <span>د. {appointment.doctor.name || 'غير محدد'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
