'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, User, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Doctor {
  id: string;
  name: string | null;
  specialtyId: string | null;
  specialty?: {
    name: string | null;
  };
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailability();
    }
  }, [selectedDoctor, selectedDate]);

  const fetchDoctors = async () => {
    try {
      // TODO: Fetch doctors from API
      // For now, this is a placeholder
      setDoctors([]);
    } catch (error) {
      console.error('Fetch doctors error:', error);
      toast.error('فشل في تحميل الأطباء');
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await fetch(
        `/api/portal/appointments/availability?doctorId=${selectedDoctor}&date=${selectedDate}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch availability');
      }

      setAvailableSlots(data.availableSlots || []);
    } catch (error) {
      console.error('Fetch availability error:', error);
      toast.error('فشل في تحميل الأوقات المتاحة');
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsBooking(true);
    try {
      const slot = availableSlots.find(s => s.startTime === selectedSlot);
      if (!slot) {
        throw new Error('Invalid slot selected');
      }

      const response = await fetch('/api/portal/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId: selectedDoctor,
          appointmentDate: selectedDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to book appointment');
      }

      toast.success('تم حجز الموعد بنجاح');
      router.push('/portal/appointments');
    } catch (error) {
      console.error('Book appointment error:', error);
      toast.error(error instanceof Error ? error.message : 'فشل في حجز الموعد');
    } finally {
      setIsBooking(false);
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'م' : 'ص';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
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

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/portal/appointments"
            className="text-gray-600 hover:text-gray-900 mb-4 inline-flex items-center"
          >
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة إلى المواعيد
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">حجز موعد جديد</h1>
          <p className="text-gray-600 mt-2">
            اختر الطبيب والتاريخ والوقت المناسب لك
          </p>
        </div>

        {/* Booking Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">تفاصيل الموعد</CardTitle>
            <CardDescription>
              املأ المعلومات أدناه لحجز موعد جديد
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Doctor Selection */}
            <div className="space-y-2">
              <Label htmlFor="doctor" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                الطبيب
              </Label>
              <select
                id="doctor"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                value={selectedDoctor}
                onChange={(e) => {
                  setSelectedDoctor(e.target.value);
                  setSelectedSlot('');
                  setAvailableSlots([]);
                }}
                disabled={isLoading}
                required
              >
                <option value="">اختر الطبيب</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name || 'غير محدد'}{' '}
                    {doctor.specialty?.name && `- ${doctor.specialty.name}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                التاريخ
              </Label>
              <input
                id="date"
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot('');
                  setAvailableSlots([]);
                }}
                min={today}
                disabled={isLoading}
                required
              />
            </div>

            {/* Time Slots */}
            {availableSlots.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  الأوقات المتاحة
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.startTime}
                      type="button"
                      onClick={() => setSelectedSlot(slot.startTime)}
                      className={`p-3 border rounded-lg transition-colors ${
                        selectedSlot === slot.startTime
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-900 border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {formatTime(slot.startTime)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <textarea
                id="notes"
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right resize-none"
                placeholder="أضف أي ملاحظات للموعد..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Summary */}
            {selectedDoctor && selectedDate && selectedSlot && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-blue-900">ملخص الحجز</h3>
                <div className="text-sm text-blue-800">
                  <p><strong>التاريخ:</strong> {formatDate(selectedDate)}</p>
                  <p><strong>الوقت:</strong> {formatTime(selectedSlot)}</p>
                  <p><strong>الطبيب:</strong> {doctors.find(d => d.id === selectedDoctor)?.name || 'غير محدد'}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleBookAppointment}
              disabled={isBooking || !selectedDoctor || !selectedDate || !selectedSlot}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isBooking ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحجز...
                </>
              ) : (
                <>
                  <CheckCircle className="ml-2 h-4 w-4" />
                  تأكيد الحجز
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
