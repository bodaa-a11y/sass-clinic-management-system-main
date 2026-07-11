'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, ArrowLeft, Check, Activity, User, Heart, Thermometer } from 'lucide-react'

interface VitalSigns {
  bloodPressure: string
  heartRate: string
  temperature: string
  weight: string
  height: string
  notes?: string
}

interface PatientCheckInWizardProps {
  patientName: string
  patientId: string
  appointmentId: string
  onSubmit: (data: VitalSigns) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function PatientCheckInWizard({ patientName, patientId, appointmentId, onSubmit, onCancel, isSubmitting = false }: PatientCheckInWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 2

  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    weight: '',
    height: '',
    notes: ''
  })

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      return vitalSigns.bloodPressure.trim() !== '' ||
             vitalSigns.heartRate.trim() !== '' ||
             vitalSigns.temperature.trim() !== ''
    }
    return true
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
      await onSubmit(vitalSigns)
    }
  }

  const steps = [
    {
      number: 1,
      title: 'العلامات الحيوية',
      icon: <Activity className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bloodPressure">ضغط الدم</Label>
              <Input
                id="bloodPressure"
                value={vitalSigns.bloodPressure}
                onChange={(e) => setVitalSigns({ ...vitalSigns, bloodPressure: e.target.value })}
                placeholder="مثال: 120/80"
              />
            </div>
            <div>
              <Label htmlFor="heartRate">نبض القلب (bpm)</Label>
              <Input
                id="heartRate"
                value={vitalSigns.heartRate}
                onChange={(e) => setVitalSigns({ ...vitalSigns, heartRate: e.target.value })}
                placeholder="مثال: 72"
                type="number"
              />
            </div>
            <div>
              <Label htmlFor="temperature">درجة الحرارة (°C)</Label>
              <Input
                id="temperature"
                value={vitalSigns.temperature}
                onChange={(e) => setVitalSigns({ ...vitalSigns, temperature: e.target.value })}
                placeholder="مثال: 37.0"
                step="0.1"
                type="number"
              />
            </div>
            <div>
              <Label htmlFor="weight">الوزن (kg)</Label>
              <Input
                id="weight"
                value={vitalSigns.weight}
                onChange={(e) => setVitalSigns({ ...vitalSigns, weight: e.target.value })}
                placeholder="مثال: 70"
                type="number"
              />
            </div>
            <div>
              <Label htmlFor="height">الطول (cm)</Label>
              <Input
                id="height"
                value={vitalSigns.height}
                onChange={(e) => setVitalSigns({ ...vitalSigns, height: e.target.value })}
                placeholder="مثال: 175"
                type="number"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      number: 2,
      title: 'مراجعة وإكمال',
      icon: <Check className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ملخص تسجيل الوصول</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">المريض</p>
                <p className="font-medium">{patientName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                {vitalSigns.bloodPressure && (
                  <div>
                    <p className="text-sm text-gray-500">ضغط الدم</p>
                    <p className="font-medium">{vitalSigns.bloodPressure} mmHg</p>
                  </div>
                )}
                {vitalSigns.heartRate && (
                  <div>
                    <p className="text-sm text-gray-500">نبض القلب</p>
                    <p className="font-medium">{vitalSigns.heartRate} bpm</p>
                  </div>
                )}
                {vitalSigns.temperature && (
                  <div>
                    <p className="text-sm text-gray-500">درجة الحرارة</p>
                    <p className="font-medium">{vitalSigns.temperature} °C</p>
                  </div>
                )}
                {vitalSigns.weight && (
                  <div>
                    <p className="text-sm text-gray-500">الوزن</p>
                    <p className="font-medium">{vitalSigns.weight} kg</p>
                  </div>
                )}
                {vitalSigns.height && (
                  <div>
                    <p className="text-sm text-gray-500">الطول</p>
                    <p className="font-medium">{vitalSigns.height} cm</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  ]

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-6 h-6" />
          تسجيل وصول - {patientName}
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
                {isSubmitting ? 'جاري التسجيل...' : 'تأكيد الوصول'}
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
