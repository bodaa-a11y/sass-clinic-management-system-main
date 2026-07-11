'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { FileText, Plus, ChevronDown, ChevronUp, Pill, User } from 'lucide-react'

interface MedicalRecord {
  id: string
  patientId: string
  doctorId: string
  chiefComplaint: string
  diagnosis: string
  symptoms?: string
  clinicalNotes?: string
  treatmentPlan?: string
  followUpDate?: string
  createdAt: string
  doctorName: string
  prescriptions: Prescription[]
}

interface Prescription {
  id: string
  medicalRecordId: string
  medicationName: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

interface Doctor {
  id: string
  name: string
  role: string
}

interface MedicalRecordsTabProps {
  medicalRecords: MedicalRecord[]
  patientId: string
  clinicId: string
  onRefresh: () => void
}

export function MedicalRecordsTab({ medicalRecords, patientId, clinicId, onRefresh }: MedicalRecordsTabProps) {
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false)
  const [formData, setFormData] = useState({
    doctorId: '',
    chiefComplaint: '',
    diagnosis: '',
    symptoms: '',
    clinicalNotes: '',
    treatmentPlan: '',
    followUpDate: ''
  })

  // Fetch doctors when dialog opens
  useEffect(() => {
    if (isAddDialogOpen && clinicId) {
      fetchDoctors()
    }
  }, [isAddDialogOpen, clinicId])

  const fetchDoctors = async () => {
    setIsLoadingDoctors(true)
    try {
      const response = await fetch(`/api/clinics/${clinicId}/staff?role=doctor`)
      if (response.ok) {
        const data = await response.json()
        setDoctors(data.data || [])
      }
    } catch {
      toast.error('فشل تحميل قائمة الأطباء')
    } finally {
      setIsLoadingDoctors(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA')
  }

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    if (!formData.doctorId) {
      toast.error('يجب اختيار الطبيب')
      setIsSubmitting(false)
      return
    }
    
    try {
      const response = await fetch(`/api/clinics/${clinicId}/medical-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          doctorId: formData.doctorId,
          chiefComplaint: formData.chiefComplaint,
          diagnosis: formData.diagnosis,
          symptoms: formData.symptoms,
          clinicalNotes: formData.clinicalNotes,
          treatmentPlan: formData.treatmentPlan,
          followUpDate: formData.followUpDate,
        }),
      })

      if (response.ok) {
        toast.success('تم إضافة السجل الطبي بنجاح')
        setIsAddDialogOpen(false)
        setFormData({
          doctorId: '',
          chiefComplaint: '',
          diagnosis: '',
          symptoms: '',
          clinicalNotes: '',
          treatmentPlan: '',
          followUpDate: ''
        })
        onRefresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'فشل إضافة السجل الطبي')
      }
    } catch {
      toast.error('حدث خطأ أثناء إضافة السجل الطبي')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleExpand = (recordId: string) => {
    setExpandedRecordId(expandedRecordId === recordId ? null : recordId)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">السجلات الطبية</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              إضافة سجل طبي جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة سجل طبي جديد</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل السجل الطبي للمريض
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddRecord} className="space-y-4">
              <div>
                <Label htmlFor="doctorId">الطبيب *</Label>
                <Select
                  value={formData.doctorId}
                  onValueChange={(value) => setFormData({ ...formData, doctorId: value })}
                  required
                  disabled={isLoadingDoctors}
                >
                  <SelectTrigger id="doctorId">
                    <SelectValue placeholder={isLoadingDoctors ? 'جاري التحميل...' : 'اختر الطبيب'} />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="chiefComplaint">الشكوى الرئيسية *</Label>
                <Textarea
                  id="chiefComplaint"
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                  required
                  placeholder="أدخل الشكوى الرئيسية للمريض"
                />
              </div>
              <div>
                <Label htmlFor="diagnosis">التشخيص *</Label>
                <Textarea
                  id="diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  required
                  placeholder="أدخل التشخيص"
                />
              </div>
              <div>
                <Label htmlFor="symptoms">الأعراض</Label>
                <Textarea
                  id="symptoms"
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  placeholder="أدخل الأعراض"
                />
              </div>
              <div>
                <Label htmlFor="clinicalNotes">الملاحظات السريرية</Label>
                <Textarea
                  id="clinicalNotes"
                  value={formData.clinicalNotes}
                  onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                  placeholder="أدخل الملاحظات السريرية"
                />
              </div>
              <div>
                <Label htmlFor="treatmentPlan">خطة العلاج</Label>
                <Textarea
                  id="treatmentPlan"
                  value={formData.treatmentPlan}
                  onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                  placeholder="أدخل خطة العلاج"
                />
              </div>
              <div>
                <Label htmlFor="followUpDate">تاريخ المتابعة</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {medicalRecords.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>لا توجد سجلات طبية لهذا المريض</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {medicalRecords.map((record) => (
            <Card key={record.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-base mb-2">{record.diagnosis}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{formatDate(record.createdAt)}</span>
                      <span>•</span>
                      <span>د. {record.doctorName}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(record.id)}
                  >
                    {expandedRecordId === record.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              {expandedRecordId === record.id && (
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-500">الشكوى الرئيسية</Label>
                    <p className="mt-1">{record.chiefComplaint}</p>
                  </div>
                  {record.symptoms && (
                    <div>
                      <Label className="text-sm text-gray-500">الأعراض</Label>
                      <p className="mt-1">{record.symptoms}</p>
                    </div>
                  )}
                  {record.clinicalNotes && (
                    <div>
                      <Label className="text-sm text-gray-500">الملاحظات السريرية</Label>
                      <p className="mt-1">{record.clinicalNotes}</p>
                    </div>
                  )}
                  {record.treatmentPlan && (
                    <div>
                      <Label className="text-sm text-gray-500">خطة العلاج</Label>
                      <p className="mt-1">{record.treatmentPlan}</p>
                    </div>
                  )}
                  {record.followUpDate && (
                    <div>
                      <Label className="text-sm text-gray-500">تاريخ المتابعة</Label>
                      <p className="mt-1">{formatDate(record.followUpDate)}</p>
                    </div>
                  )}
                  {record.prescriptions && record.prescriptions.length > 0 && (
                    <div>
                      <Label className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                        <Pill className="h-4 w-4" />
                        الوصفات الطبية
                      </Label>
                      <div className="space-y-2">
                        {record.prescriptions.map((prescription) => (
                          <div key={prescription.id} className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-medium">{prescription.medicationName}</p>
                            <p className="text-sm text-gray-600">
                              {prescription.dosage} - {prescription.frequency} - {prescription.duration}
                            </p>
                            {prescription.instructions && (
                              <p className="text-sm text-gray-500 mt-1">{prescription.instructions}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
