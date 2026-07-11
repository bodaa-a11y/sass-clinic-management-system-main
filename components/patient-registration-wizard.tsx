'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRight, ArrowLeft, Check, User, FileText, Phone } from 'lucide-react'

interface PatientRegistrationWizardProps {
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function PatientRegistrationWizard({ onSubmit, onCancel, isSubmitting = false }: PatientRegistrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    fullName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    // Step 2: Medical Info
    medicalHistory: '',
    allergies: '',
    bloodType: '',
    // Step 3: Additional Info
    address: '',
    emergencyContact: '',
    emergencyPhone: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'الاسم مطلوب'
      if (!formData.phone.trim()) newErrors.phone = 'رقم الهاتف مطلوب'
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'تاريخ الميلاد مطلوب'
      if (!formData.gender) newErrors.gender = 'الجنس مطلوب'
    }

    if (step === 2) {
      // Optional fields, no validation
    }

    if (step === 3) {
      // Optional fields, no validation
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (validateStep(currentStep)) {
      await onSubmit(formData)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const steps = [
    {
      number: 1,
      title: 'المعلومات الأساسية',
      icon: <User className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="fullName">الاسم الكامل *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => updateFormData('fullName', e.target.value)}
              placeholder="أدخل الاسم الكامل"
              className={errors.fullName ? 'border-red-500' : ''}
            />
            {errors.fullName && <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <Label htmlFor="phone">رقم الهاتف *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => updateFormData('phone', e.target.value)}
              placeholder="05xxxxxxxx"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              placeholder="example@email.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateOfBirth">تاريخ الميلاد *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                className={errors.dateOfBirth ? 'border-red-500' : ''}
              />
              {errors.dateOfBirth && <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth}</p>}
            </div>

            <div>
              <Label htmlFor="gender">الجنس *</Label>
              <Select value={formData.gender} onValueChange={(value) => updateFormData('gender', value)}>
                <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                  <SelectValue placeholder="اختر الجنس" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">ذكر</SelectItem>
                  <SelectItem value="female">أنثى</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-sm text-red-500 mt-1">{errors.gender}</p>}
            </div>
          </div>
        </div>
      )
    },
    {
      number: 2,
      title: 'المعلومات الطبية',
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="medicalHistory">التاريخ المرضي</Label>
            <Textarea
              id="medicalHistory"
              value={formData.medicalHistory}
              onChange={(e) => updateFormData('medicalHistory', e.target.value)}
              placeholder="أي أمراض مزمنة أو عمليات سابقة..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="allergies">الحساسية</Label>
            <Textarea
              id="allergies"
              value={formData.allergies}
              onChange={(e) => updateFormData('allergies', e.target.value)}
              placeholder="أي حساسية للأدوية أو الأطعمة..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="bloodType">فصيلة الدم</Label>
            <Select value={formData.bloodType} onValueChange={(value) => updateFormData('bloodType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر فصيلة الدم (اختياري)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A-">A-</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B-">B-</SelectItem>
                <SelectItem value="AB+">AB+</SelectItem>
                <SelectItem value="AB-">AB-</SelectItem>
                <SelectItem value="O+">O+</SelectItem>
                <SelectItem value="O-">O-</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    },
    {
      number: 3,
      title: 'معلومات إضافية',
      icon: <Phone className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="address">العنوان</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => updateFormData('address', e.target.value)}
              placeholder="المدينة، الحي، الشارع..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergencyContact">جهة الاتصال الطارئة</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => updateFormData('emergencyContact', e.target.value)}
                placeholder="اسم جهة الاتصال"
              />
            </div>

            <div>
              <Label htmlFor="emergencyPhone">رقم هاتف الطوارئ</Label>
              <Input
                id="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={(e) => updateFormData('emergencyPhone', e.target.value)}
                placeholder="05xxxxxxxx"
              />
            </div>
          </div>
        </div>
      )
    }
  ]

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-6 h-6" />
          تسجيل مريض جديد
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= step.number
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 text-gray-400'
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span
                  className={`text-xs mt-2 ${
                    currentStep >= step.number ? 'text-blue-600 font-medium' : 'text-gray-400'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
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
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            السابق
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              إلغاء
            </Button>

            {currentStep === totalSteps ? (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2">
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
                <Check className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleNext} className="flex items-center gap-2">
                التالي
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
