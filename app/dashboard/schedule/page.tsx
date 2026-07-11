'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import { store } from '@/lib/store'
import { Button } from '@/components/ui/button-redesigned'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Input } from '@/components/ui/input-redesigned'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Clock, Calendar, Palmtree } from 'lucide-react'
import { useTenant } from '@/lib/tenant-context'
import { PageTransition } from '@/components/animations/page-transition';
import { SlideIn } from '@/components/animations/feedback-animations';
import { HoverScale } from '@/components/animations/micro-interactions'

interface Doctor {
  id: string
  name: string
  email: string
}

interface DaySchedule {
  day: string
  enabled: boolean
  startTime: string
  endTime: string
  slotDuration: number
}

const DAYS = [
  { value: 'monday', label: 'الإثنين' },
  { value: 'tuesday', label: 'الثلاثاء' },
  { value: 'wednesday', label: 'الأربعاء' },
  { value: 'thursday', label: 'الخميس' },
  { value: 'friday', label: 'الجمعة' },
  { value: 'saturday', label: 'السبت' },
  { value: 'sunday', label: 'الأحد' },
]

const SCHEDULE_TEMPLATES = [
  { 
    value: 'standard', 
    label: 'جدول قياسي (9-5)',
    schedule: DAYS.map(day => ({
      day: day.value,
      enabled: true,
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 30
    }))
  },
  { 
    value: 'extended', 
    label: 'جدول ممتد (8-6)',
    schedule: DAYS.map(day => ({
      day: day.value,
      enabled: true,
      startTime: '08:00',
      endTime: '18:00',
      slotDuration: 30
    }))
  },
  { 
    value: 'weekend', 
    label: 'أيام العمل فقط',
    schedule: DAYS.map(day => ({
      day: day.value,
      enabled: ['saturday', 'sunday'].includes(day.value) ? false : true,
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 30
    }))
  },
]

export default function SchedulePage() {
  const { facilityType } = useTenant()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<string>('')
  const [schedules, setSchedules] = useState<DaySchedule[]>(
    DAYS.map(day => ({
      day: day.value,
      enabled: false,
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 30
    }))
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  const clinicId = store.getUser()?.clinicId || 'f41b28a0-a872-4fa8-885e-9ac8f82ebf3a'

  useEffect(() => {
    fetchDoctors()
  }, [facilityType])

  useEffect(() => {
    // For single_clinic, auto-select the first doctor after doctors are loaded
    if (facilityType === 'single_clinic' && doctors.length > 0 && !selectedDoctor) {
      setSelectedDoctor(doctors[0].id)
      handleDoctorSelect(doctors[0].id)
    }
  }, [doctors, facilityType, selectedDoctor])

  const fetchDoctors = async () => {
    try {
      const response = await apiFetch(`/clinics/${clinicId}/staff`)
      const data = await response.json()
      setDoctors(data.data || [])
    } catch {
      toast.error('فشل تحميل الأطباء')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDoctorSelect = async (doctorId: string) => {
    setSelectedDoctor(doctorId)
    
    if (!doctorId) return
    
    // Fetch current schedule for this doctor
    try {
      const response = await apiFetch(`/clinics/${clinicId}/availability?doctor_id=${doctorId}`)
      if (response.ok) {
        const data = await response.json()
        const existingSlots = data.data || []
        
        // Reset schedules to default
        const newSchedules = DAYS.map(day => ({
          day: day.value,
          enabled: false,
          startTime: '09:00',
          endTime: '17:00',
          slotDuration: 30
        }))
        
        // Map existing slots to schedules
        const numberToDay: Record<number, string> = {
          0: 'sunday',
          1: 'monday',
          2: 'tuesday',
          3: 'wednesday',
          4: 'thursday',
          5: 'friday',
          6: 'saturday'
        }
        
        existingSlots.forEach((slot: { dayOfWeek: number; startTime: string; endTime: string; slotDurationMinutes: number }) => {
          const dayName = numberToDay[slot.dayOfWeek]
          const dayIndex = DAYS.findIndex(d => d.value === dayName)
          if (dayIndex !== -1) {
            newSchedules[dayIndex] = {
              day: dayName,
              enabled: true,
              startTime: slot.startTime,
              endTime: slot.endTime,
              slotDuration: slot.slotDurationMinutes
            }
          }
        })
        
        setSchedules(newSchedules)
      }
    } catch {
      toast.error('فشل تحميل الجدول')
    }
  }

  const handleApplyTemplate = (templateValue: string) => {
    const template = SCHEDULE_TEMPLATES.find(t => t.value === templateValue)
    if (template) {
      setSchedules(template.schedule)
      setSelectedTemplate(templateValue)
      toast.success('تم تطبيق القالب بنجاح')
    }
  }

  const updateSchedule = (dayIndex: number, updates: Partial<DaySchedule>) => {
    setSchedules(prev => prev.map((schedule, index) => 
      index === dayIndex ? { ...schedule, ...updates } : schedule
    ))
  }

  const handleSave = async () => {
    if (!selectedDoctor) {
      toast.error('اختر طبيباً أولاً')
      return
    }

    const enabledSchedules = schedules.filter(s => s.enabled)
    
    if (enabledSchedules.length === 0) {
      toast.error('اختر يوم عمل واحد على الأقل')
      return
    }

    // Convert day names to day numbers (0=Sunday, 1=Monday, etc.)
    const dayToNumber: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    }

    // Create individual slots for each day
    const slots = enabledSchedules.map(schedule => ({
      doctorId: selectedDoctor,
      dayOfWeek: dayToNumber[schedule.day],
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      slotDurationMinutes: schedule.slotDuration
    }))

    setIsSaving(true)
    try {
      // Step 1: Delete all old slots for this doctor
      await apiFetch(`/clinics/${clinicId}/availability?doctor_id=${selectedDoctor}`, {
        method: 'DELETE'
      })

      // Step 2: Add new slots
      await Promise.all(
        slots.map(slot => 
          apiFetch(`/clinics/${clinicId}/availability`, {
            method: 'POST',
            body: JSON.stringify(slot)
          })
        )
      )

      toast.success('تم حفظ الجدول بنجاح')
    } catch {
      toast.error('حدث خطأ أثناء حفظ الجدول')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="space-y-4 w-full max-w-2xl p-4">
          <div className="animate-pulse border border-slate-200 rounded-xl p-6">
            <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="h-10 bg-slate-200 rounded"></div>
              <div className="h-10 bg-slate-200 rounded"></div>
              <div className="h-10 bg-slate-200 rounded"></div>
            </div>
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-4 bg-slate-200 rounded w-8"></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="h-10 bg-slate-200 rounded"></div>
                <div className="h-10 bg-slate-200 rounded"></div>
                <div className="h-10 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
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
                  <Calendar className="w-8 h-8 text-medical-blue" />
                  {facilityType === 'single_clinic' ? 'جدول العمل' : 'الجداول والأوقات'}
                </h1>
                <p className="text-slate-600 mt-1">
                  {facilityType === 'single_clinic' && 'إعداد أوقات عمل العيادة والمواعيد المتاحة'}
                  {facilityType !== 'single_clinic' && 'إعداد أوقات عمل الأطباء والمواعيد المتاحة'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedTemplate} onValueChange={handleApplyTemplate}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="اختر قالب" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_TEMPLATES.map((template) => (
                      <SelectItem key={template.value} value={template.value}>
                        {template.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <HoverScale>
                  <Button variant="outline" onClick={() => window.location.href = '/dashboard/schedule/leaves'}>
                    <Palmtree className="w-4 h-4 ml-2" />
                    الإجازات
                  </Button>
                </HoverScale>
              </div>
            </div>
          </SlideIn>
        </div>

        {/* Main Content - Flex-1 with inner scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto">

      {facilityType !== 'single_clinic' && (
        <Card>
          <CardHeader>
            <CardTitle>اختر الطبيب</CardTitle>
          </CardHeader>
        <CardContent>
          <Select value={selectedDoctor} onValueChange={handleDoctorSelect}>
            <SelectTrigger>
              <SelectValue placeholder="اختر طبيباً لإعداد جدوله" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      )}

      {selectedDoctor && (
        <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              معاينة الجدول
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 text-center text-sm">
              {DAYS.map((day) => (
                <div key={day.value} className="space-y-1">
                  <div className="font-medium text-slate-700 text-xs">{day.label}</div>
                  {schedules.find(s => s.day === day.value)?.enabled ? (
                    <div className="bg-green-100 text-green-700 rounded p-1 text-xs">
                      {schedules.find(s => s.day === day.value)?.startTime}-
                      {schedules.find(s => s.day === day.value)?.endTime}
                    </div>
                  ) : (
                    <div className="bg-gray-100 text-gray-500 rounded p-1 text-xs">مغلق</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {facilityType === 'single_clinic' ? 'جدول عمل العيادة' : 'أوقات العمل'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {DAYS.map((day, index) => (
              <div key={day.value} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={schedules[index].enabled}
                      onChange={(e) =>
                        updateSchedule(index, { enabled: e.target.checked })
                      }
                    />
                    {day.label}
                  </Label>
                </div>

                {schedules[index].enabled && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor={`start-${day.value}`}>وقت البدء</Label>
                      <Input
                        id={`start-${day.value}`}
                        type="time"
                        value={schedules[index].startTime}
                        onChange={(e) =>
                          updateSchedule(index, { startTime: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`end-${day.value}`}>وقت الانتهاء</Label>
                      <Input
                        id={`end-${day.value}`}
                        type="time"
                        value={schedules[index].endTime}
                        onChange={(e) =>
                          updateSchedule(index, { endTime: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`duration-${day.value}`}>مدة الموعد (دقيقة)</Label>
                      <Input
                        id={`duration-${day.value}`}
                        type="number"
                        min="15"
                        max="120"
                        step="15"
                        value={schedules[index].slotDuration}
                        onChange={(e) =>
                          updateSchedule(index, { slotDuration: parseInt(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            <Button
              onClick={handleSave}
              className="w-full mt-6"
              disabled={isSaving}
            >
              {isSaving ? 'جاري الحفظ...' : 'حفظ الجدول'}
            </Button>
          </CardContent>
        </Card>
        </>
      )}
        </div>
      </div>
    </PageTransition>
  )
}
