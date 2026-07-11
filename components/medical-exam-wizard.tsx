'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { AutoExpandingTextarea } from '@/components/auto-expanding-textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ArrowRight, ArrowLeft, Check, Stethoscope, FileText, User, Activity, DollarSign, FlaskConical, Calendar, X } from 'lucide-react'
import { LabOrdersWizard } from '@/components/lab-orders-wizard'
import { DiagnosisTemplates } from '@/components/diagnosis-templates'

interface Prescription {
  medicationName: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

interface MedicalExamWizardProps {
  patientName: string
  patientId: string
  clinicId?: string
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  onStepChange?: (step: number) => void
}

export function MedicalExamWizard({ patientName, patientId, clinicId, onSubmit, onCancel, isSubmitting = false, onStepChange }: MedicalExamWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  const [examForm, setExamForm] = useState({
    diagnosis: '',
    clinicalNotes: '',
    treatmentPlan: ''
  })

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [currentPrescription, setCurrentPrescription] = useState<Prescription>({
    medicationName: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  })
  const [createInvoice, setCreateInvoice] = useState(false)
  const [isLabOrdersOpen, setIsLabOrdersOpen] = useState(false)
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false)
  const [followUpDate, setFollowUpDate] = useState('')

  const validateStep = (step: number): boolean => {
    if (step === 1 && !examForm.diagnosis.trim()) {
      return false
    }
    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      const newStep = Math.min(currentStep + 1, totalSteps)
      setCurrentStep(newStep)
      onStepChange?.(newStep)
    }
  }

  const handlePrevious = () => {
    const newStep = Math.max(currentStep - 1, 1)
    setCurrentStep(newStep)
    onStepChange?.(newStep)
  }

  const handleSubmit = async () => {
    if (validateStep(currentStep)) {
      await onSubmit({
        ...examForm,
        patientId,
        prescriptions,
        createInvoice,
        scheduleFollowUp,
        followUpDate
      })
    }
  }

  const handleAddPrescription = () => {
    if (!currentPrescription.medicationName) {
      return
    }
    setPrescriptions([...prescriptions, currentPrescription])
    setCurrentPrescription({
      medicationName: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    })
  }

  const handleRemovePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index))
  }

  const handleApplyTemplate = (template: any) => {
    setExamForm({
      diagnosis: template.diagnosis,
      clinicalNotes: template.clinicalNotes || '',
      treatmentPlan: template.treatmentPlan
    })
    toast.success('تم تطبيق القالب بنجاح')
  }

  const steps = [
    {
      number: 1,
      title: 'التشخيص والملاحظات',
      icon: <Stethoscope className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">التشخيص والملاحظات</h3>
            <DiagnosisTemplates onApplyTemplate={handleApplyTemplate} />
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="diagnosis" className="text-base font-medium mb-2 block">التشخيص *</Label>
              <AutoExpandingTextarea
                id="diagnosis"
                value={examForm.diagnosis}
                onChange={(e) => setExamForm({ ...examForm, diagnosis: e.target.value })}
                placeholder="أدخل التشخيص"
                minHeight="120px"
                maxHeight="400px"
                className={`leading-relaxed text-base ${!examForm.diagnosis ? 'border-red-300' : ''}`}
              />
              {!examForm.diagnosis && <p className="text-sm text-red-500 mt-1">التشخيص مطلوب</p>}
            </div>

            <div>
              <Label htmlFor="clinicalNotes" className="text-base font-medium mb-2 block">الملاحظات السريرية</Label>
              <AutoExpandingTextarea
                id="clinicalNotes"
                value={examForm.clinicalNotes}
                onChange={(e) => setExamForm({ ...examForm, clinicalNotes: e.target.value })}
                placeholder="أدخل الملاحظات السريرية والأعراض"
                minHeight="120px"
                maxHeight="400px"
                className="leading-relaxed text-base"
              />
            </div>

            <div>
              <Label htmlFor="treatmentPlan" className="text-base font-medium mb-2 block">خطة العلاج</Label>
              <AutoExpandingTextarea
                id="treatmentPlan"
                value={examForm.treatmentPlan}
                onChange={(e) => setExamForm({ ...examForm, treatmentPlan: e.target.value })}
                placeholder="أدخل خطة العلاج المقترحة"
                minHeight="100px"
                maxHeight="300px"
                className="leading-relaxed text-base"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      number: 2,
      title: 'الوصفات الطبية',
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            {prescriptions.map((prescription, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <p><strong>الدواء:</strong> {prescription.medicationName}</p>
                      <p><strong>الجرعة:</strong> {prescription.dosage}</p>
                      <p><strong>التكرار:</strong> {prescription.frequency}</p>
                      <p><strong>المدة:</strong> {prescription.duration}</p>
                      {prescription.instructions && (
                        <p><strong>تعليمات:</strong> {prescription.instructions}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemovePrescription(index)}
                      className="text-red-600 hover:text-red-800 border-red-600"
                    >
                      حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="pt-4 space-y-4">
              <Input
                placeholder="اسم الدواء *"
                value={currentPrescription.medicationName}
                onChange={(e) => setCurrentPrescription({ ...currentPrescription, medicationName: e.target.value })}
              />
              <div className="grid grid-cols-3 gap-4">
                <Input
                  placeholder="الجرعة"
                  value={currentPrescription.dosage}
                  onChange={(e) => setCurrentPrescription({ ...currentPrescription, dosage: e.target.value })}
                />
                <Input
                  placeholder="التكرار"
                  value={currentPrescription.frequency}
                  onChange={(e) => setCurrentPrescription({ ...currentPrescription, frequency: e.target.value })}
                />
                <Input
                  placeholder="المدة"
                  value={currentPrescription.duration}
                  onChange={(e) => setCurrentPrescription({ ...currentPrescription, duration: e.target.value })}
                />
              </div>
              <Textarea
                placeholder="تعليمات إضافية"
                value={currentPrescription.instructions}
                onChange={(e) => setCurrentPrescription({ ...currentPrescription, instructions: e.target.value })}
                rows={2}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddPrescription}
                className="w-full"
                disabled={!currentPrescription.medicationName}
              >
                إضافة وصفة
              </Button>
            </CardContent>
          </Card>

          {prescriptions.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              لا توجد وصفات طبية مضافة (اختياري)
            </p>
          )}
        </div>
      )
    },
    {
      number: 3,
      title: 'مراجعة وإكمال',
      icon: <Check className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ملخص الفحص</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">المريض</p>
                <p className="font-medium">{patientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">التشخيص</p>
                <p className="font-medium">{examForm.diagnosis || 'غير محدد'}</p>
              </div>
              {examForm.clinicalNotes && (
                <div>
                  <p className="text-sm text-gray-500">الملاحظات السريرية</p>
                  <p className="font-medium">{examForm.clinicalNotes}</p>
                </div>
              )}
              {examForm.treatmentPlan && (
                <div>
                  <p className="text-sm text-gray-500">خطة العلاج</p>
                  <p className="font-medium">{examForm.treatmentPlan}</p>
                </div>
              )}
              {prescriptions.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500">الوصفات الطبية</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {prescriptions.map((prescription, index) => (
                      <li key={index} className="text-sm">
                        {prescription.medicationName} - {prescription.dosage}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Invoice Creation Option */}
              <div className="flex items-center space-x-2 space-x-reverse pt-4 border-t">
                <Checkbox
                  id="createInvoice"
                  checked={createInvoice}
                  onCheckedChange={(checked) => setCreateInvoice(checked as boolean)}
                />
                <Label
                  htmlFor="createInvoice"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span>إنشاء فاتورة للفحص</span>
                </Label>
              </div>

              {/* Lab Orders Button */}
              <div className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLabOrdersOpen(true)}
                  className="w-full"
                >
                  <FlaskConical className="w-4 h-4 ml-2" />
                  طلب فحوصات (اختياري)
                </Button>
              </div>

              {/* Follow-up Booking Option */}
              <div className="pt-4 border-t">
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <div className="flex items-center space-x-2 space-x-reverse mb-3">
                    <Checkbox
                      id="scheduleFollowUp"
                      checked={scheduleFollowUp}
                      onCheckedChange={(checked) => {
                        setScheduleFollowUp(checked as boolean)
                        if (checked) {
                          // Auto-calculate follow-up date (2 weeks from now)
                          const followUp = new Date()
                          followUp.setDate(followUp.getDate() + 14)
                          setFollowUpDate(followUp.toISOString().split('T')[0])
                        } else {
                          setFollowUpDate('')
                        }
                      }}
                    />
                    <Label
                      htmlFor="scheduleFollowUp"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>حجز موعد متابعة</span>
                    </Label>
                  </div>
                  {scheduleFollowUp && (
                    <div>
                      <Label htmlFor="followUpDate">تاريخ المتابعة</Label>
                      <Input
                        id="followUpDate"
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  ]

  return (
    <div className="h-full overflow-auto px-4">
      <div className="w-full">
        <div className="mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-blue-700" />
            مركز التحكم - الطبيب
          </h2>
          <p className="text-sm text-gray-600 mt-1">فحص المريض: {patientName}</p>
        </div>
        <div>
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        currentStep > step.number
                          ? 'border-blue-700 bg-blue-700 text-white shadow-lg'
                          : currentStep === step.number
                          ? 'border-blue-700 bg-blue-700 text-white shadow-xl ring-4 ring-blue-200'
                          : 'border-gray-300 text-gray-400'
                      }`}
                    >
                      {currentStep > step.number ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <div className="w-4 h-4 flex items-center justify-center">
                          {step.icon}
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium ${
                        currentStep > step.number
                          ? 'text-blue-700'
                          : currentStep === step.number
                          ? 'text-blue-700'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 transition-all ${
                        currentStep > step.number ? 'bg-blue-700' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="mb-6">
              {steps[currentStep - 1].content}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t gap-4">
              <Button
                variant="ghost"
                size="lg"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center gap-2 text-gray-700 hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
                السابق
              </Button>

              <div className="flex gap-3">
                {currentStep === totalSteps ? (
                  <Button
                    size="lg"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white"
                  >
                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ الفحص'}
                    <Check className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white"
                  >
                    التالي
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                )}
              </div>

              <Button
                variant="ghost"
                size="lg"
                onClick={onCancel}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
                إلغاء
              </Button>
            </div>
        </div>

      {/* Lab Orders Dialog */}
      <Dialog open={isLabOrdersOpen} onOpenChange={setIsLabOrdersOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>طلب فحوصات</DialogTitle>
          </DialogHeader>
          <LabOrdersWizard
            onAddOrders={(orders) => {
              // Here you would typically save the lab orders
              console.log('Lab orders:', orders)
              toast.success(`تم طلب ${orders.length} فحص`)
              setIsLabOrdersOpen(false)
            }}
            onCancel={() => setIsLabOrdersOpen(false)}
          />
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
