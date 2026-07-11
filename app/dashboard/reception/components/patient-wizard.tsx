'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button-redesigned'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Input } from '@/components/ui/input-redesigned'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Check, ArrowRight, ArrowLeft, User, Phone, Mail, Calendar, MapPin, Shield, FileText } from 'lucide-react'
import { SlideIn } from '@/components/animations/feedback-animations'

interface PatientWizardProps {
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function PatientWizard({ onSubmit, onCancel }: PatientWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    fullName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    // Step 2: Address & Contact
    address: '',
    city: '',
    emergencyContact: '',
    emergencyPhone: '',
    // Step 3: Insurance
    insuranceNumber: '',
    insuranceProvider: '',
    // Step 4: Medical History
    medicalHistory: '',
    currentMedications: '',
    allergies: ''
  })

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    onSubmit(formData)
  }

  const steps = [
    {
      title: 'المعلومات الأساسية',
      icon: User,
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="fullName">الاسم الكامل *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="أدخل الاسم الكامل"
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">رقم الهاتف *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="05xxxxxxxx"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="example@email.com"
            />
          </div>
          <div>
            <Label htmlFor="dateOfBirth">تاريخ الميلاد</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
          </div>
        </div>
      )
    },
    {
      title: 'العنوان واتصال الطوارئ',
      icon: MapPin,
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="address">العنوان</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="الشارع، المدينة"
            />
          </div>
          <div>
            <Label htmlFor="city">المدينة</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="المدينة"
            />
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-gray-700 mb-3">اتصال الطوارئ</p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="emergencyContact">اسم جهة الاتصال</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="اسم الشخص"
                />
              </div>
              <div>
                <Label htmlFor="emergencyPhone">رقم الهاتف</Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  placeholder="05xxxxxxxx"
                />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'معلومات التأمين',
      icon: Shield,
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="insuranceNumber">رقم التأمين</Label>
            <Input
              id="insuranceNumber"
              value={formData.insuranceNumber}
              onChange={(e) => setFormData({ ...formData, insuranceNumber: e.target.value })}
              placeholder="رقم بوليصة التأمين"
            />
          </div>
          <div>
            <Label htmlFor="insuranceProvider">شركة التأمين</Label>
            <Input
              id="insuranceProvider"
              value={formData.insuranceProvider}
              onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
              placeholder="اسم شركة التأمين"
            />
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>ملاحظة:</strong> معلومات التأمين اختيارية ولكن تساعد في تسريع عملية الدفع.
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'التاريخ الطبي',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="medicalHistory">التاريخ الطبي</Label>
            <Textarea
              id="medicalHistory"
              value={formData.medicalHistory}
              onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
              placeholder="أي حالات طبية سابقة، عمليات جراحية، إلخ..."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="currentMedications">الأدوية الحالية</Label>
            <Textarea
              id="currentMedications"
              value={formData.currentMedications}
              onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
              placeholder="الأدوية التي يتناولها المريض حالياً..."
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="allergies">الحساسية</Label>
            <Textarea
              id="allergies"
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              placeholder="أي حساسية معروفة (أدوية، أطعمة، إلخ)..."
              rows={2}
            />
          </div>
        </div>
      )
    }
  ]

  const currentStepData = steps[currentStep - 1]
  const Icon = currentStepData.icon

  return (
    <SlideIn direction="up">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Icon className="w-5 h-5" />
              {currentStepData.title}
            </CardTitle>
            <div className="text-sm text-gray-500">
              الخطوة {currentStep} من {totalSteps}
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="min-h-[300px]">
            {currentStepData.content}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              السابق
            </Button>

            {currentStep === totalSteps ? (
              <Button onClick={handleSubmit}>
                <Check className="w-4 h-4 ml-2" />
                إضافة المريض
              </Button>
            ) : (
              <Button onClick={handleNext}>
                التالي
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Cancel Button */}
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              إلغاء
            </Button>
          </div>
        </CardContent>
      </Card>
    </SlideIn>
  )
}
