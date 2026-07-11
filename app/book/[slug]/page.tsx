'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Button } from '@/components/ui/button-redesigned'
import { Input } from '@/components/ui/input-redesigned'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge-redesigned'
import { Calendar, Clock, User, Phone, Mail, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface Doctor {
  id: string
  name: string
  specialtyId?: string
  specialtyName?: string
}

interface Clinic {
  id: string
  name: string
  phone: string
  slug: string
}

interface SlotInfo {
  time: string
  isAvailable: boolean
  reason?: 'booked' | 'buffer' | 'outside_hours'
}

export default function BookingPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const doctorIdParam = searchParams.get('doctor_id')

  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<string>(doctorIdParam || '')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState<SlotInfo[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    patient_name: '',
    patient_phone: '',
    patient_email: '',
    notes: '',
  })

  useEffect(() => {
    fetchClinicData()
  }, [slug])

  useEffect(() => {
    if (doctorIdParam) {
      setSelectedDoctor(doctorIdParam)
    }
  }, [doctorIdParam])

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchSlots()
    }
  }, [selectedDoctor, selectedDate])

  const fetchClinicData = async () => {
    try {
      const response = await fetch(`/api/public/${slug}`)
      if (response.ok) {
        const data = await response.json()
        setClinic(data.data.clinic)
        setDoctors(data.data.doctors)
      }
    } catch (error) {
      console.error('Failed to fetch clinic data:', error)
    }
  }

  const fetchSlots = async () => {
    if (!selectedDoctor || !selectedDate) return

    setSlotsLoading(true)
    try {
      const response = await fetch(
        `/api/public/${slug}/slots?doctor_id=${selectedDoctor}&date=${selectedDate}`
      )
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.data.slots || [])
      }
    } catch (error) {
      console.error('Failed to fetch slots:', error)
    } finally {
      setSlotsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/public/${slug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: selectedDoctor,
          patient_name: formData.patient_name,
          patient_phone: formData.patient_phone,
          patient_email: formData.patient_email,
          date: selectedDate,
          start_time: selectedTime,
          notes: formData.notes,
        }),
      })

      if (response.ok) {
        toast.success('تم حجز الموعد بنجاح!')
        // Reset form
        setFormData({
          patient_name: '',
          patient_phone: '',
          patient_email: '',
          notes: '',
        })
        setSelectedDate('')
        setSelectedTime('')
        setAvailableSlots([])
      } else {
        const error = await response.json()
        console.error('Booking error:', error)
        if (error.suggested_slots && error.suggested_slots.length > 0) {
          toast.error(`${error.error} - الأوقات المتاحة: ${error.suggested_slots.join(', ')}`)
        } else if (error.details) {
          toast.error(`${error.error}: ${error.details}`)
        } else {
          toast.error(error.error || 'فشل حجز الموعد')
        }
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء حجز الموعد')
    } finally {
      setIsSubmitting(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  if (!clinic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              حجز موعد - {clinic.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Doctor Selection */}
              <div>
                <Label htmlFor="doctor" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  اختر الطبيب *
                </Label>
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الطبيب" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name} {doctor.specialtyName && `(${doctor.specialtyName})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div>
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  اختر التاريخ *
                </Label>
                <Input
                  id="date"
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="mt-2"
                  required
                />
              </div>

              {/* Time Selection */}
              <div>
                <Label htmlFor="time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  اختر الوقت *
                </Label>
                {slotsLoading ? (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4 animate-spin" />
                    جاري تحميل المواعيد...
                  </div>
                ) : availableSlots.length > 0 ? (
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الوقت المتاح" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlots.map((slot) => (
                        <SelectItem
                          key={slot.time}
                          value={slot.time}
                          disabled={!slot.isAvailable}
                        >
                          <div className="flex items-center gap-2">
                            <span>{slot.time}</span>
                            {!slot.isAvailable && (
                              <Badge variant="secondary" className="text-xs">
                                {slot.reason === 'booked' ? 'محجوز' : slot.reason === 'buffer' ? 'فترة انتظار' : 'غير متاح'}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : selectedDoctor && selectedDate ? (
                  <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    لا توجد مواعيد متاحة لهذا اليوم
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-gray-400">
                    اختر الطبيب والتاريخ أولاً
                  </div>
                )}
              </div>

              {/* Patient Information */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-lg">معلومات المريض</h3>

                <div>
                  <Label htmlFor="patient_name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    الاسم الكامل *
                  </Label>
                  <Input
                    id="patient_name"
                    value={formData.patient_name}
                    onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="patient_phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    رقم الهاتف *
                  </Label>
                  <Input
                    id="patient_phone"
                    type="tel"
                    value={formData.patient_phone}
                    onChange={(e) => setFormData({ ...formData, patient_phone: e.target.value })}
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="patient_email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="patient_email"
                    type="email"
                    value={formData.patient_email}
                    onChange={(e) => setFormData({ ...formData, patient_email: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="mt-2"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    جاري الحجز...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    تأكيد الحجز
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>للمساعدة، اتصل بـ: {clinic.phone}</p>
        </div>
      </div>
    </div>
  )
}
