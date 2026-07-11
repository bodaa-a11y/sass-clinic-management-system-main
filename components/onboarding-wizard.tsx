'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button-redesigned'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Progress } from '@/components/ui/progress-redesigned'
import { Check, ArrowRight, ArrowLeft, X, Sparkles } from 'lucide-react'
import { SlideIn } from '@/components/animations/feedback-animations'
import { HoverScale } from '@/components/animations/micro-interactions'

interface OnboardingStep {
  id: string
  title: string
  description: string
  content: React.ReactNode
}

interface OnboardingWizardProps {
  steps: OnboardingStep[]
  onComplete: () => void
  onSkip: () => void
}

export function OnboardingWizard({ steps, onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const handleNext = () => {
    setCompletedSteps(new Set([...completedSteps, currentStep]))
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    onSkip()
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <SlideIn direction="up">
        <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <CardTitle>مرحباً بك في النظام</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSkip}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>الخطوة {currentStep + 1} من {steps.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="min-h-[300px]">
              <h3 className="text-xl font-semibold mb-2">{steps[currentStep].title}</h3>
              <p className="text-gray-600 mb-6">{steps[currentStep].description}</p>
              {steps[currentStep].content}
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                السابق
              </Button>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleSkip}>
                  تخطي
                </Button>
                <HoverScale>
                  <Button onClick={handleNext}>
                    {currentStep === steps.length - 1 ? 'ابدأ' : 'التالي'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </HoverScale>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center gap-2 mt-4">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-blue-600'
                      : completedSteps.has(index)
                      ? 'bg-green-600'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </SlideIn>
    </div>
  )
}

// Pre-defined onboarding steps for new users
export const defaultOnboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'مرحباً بك في نظام إدارة العيادات',
    description: 'دعنا نأخذك في جولة سريعة لتعرف على الميزات الرئيسية',
    content: (
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">🎯 ما ستتعلمه:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• إدارة المواعيد والمرضى</li>
            <li>• إنشاء الفواتير والمدفوعات</li>
            <li>• إدارة الموظفين والصلاحيات</li>
            <li>• عرض التقارير والإحصائيات</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'dashboard',
    title: 'لوحة التحكم',
    description: 'نظرة عامة سريعة على جميع نشاطاتك',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-sm text-gray-600">مواعيد اليوم</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">8</div>
            <div className="text-sm text-gray-600">مكتملة</div>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Dashboard يعرض لك أهم الإحصائيات في لمحة بصرية
        </p>
      </div>
    )
  },
  {
    id: 'appointments',
    title: 'إدارة المواعيد',
    description: 'حجز وإدارة المواعيد بسهولة',
    content: (
      <div className="space-y-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">✨ الميزات:</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• حجز موعد جديد بضغطة زر</li>
            <li>• إرسال تذكيرات تلقائية</li>
            <li>• تتبع حالة المواعيد</li>
            <li>• إنشاء فاتورة سريعة من الموعد</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'patients',
    title: 'إدارة المرضى',
    description: 'سجلات طبية شاملة لكل مريض',
    content: (
      <div className="space-y-4">
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-semibold text-purple-900 mb-2">📋 المعلومات:</h4>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• المعلومات الشخصية والطبية</li>
            <li>• التاريخ الطبي الكامل</li>
            <li>• الوصفات والفحوصات</li>
            <li>• سجل المواعيد والفواتير</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'ready',
    title: 'أنت جاهز!',
    description: 'ابدأ باستخدام النظام الآن',
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg text-center">
          <Sparkles className="w-12 h-12 mx-auto text-blue-600 mb-3" />
          <h4 className="text-xl font-bold text-gray-900 mb-2">
            كل شيء جاهز! 🎉
          </h4>
          <p className="text-gray-600">
            يمكنك البدء بإضافة أول مريض أو حجز موعد جديد
          </p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm">
            عرض الدليل
          </Button>
          <Button size="sm">
            بدء الاستخدام
          </Button>
        </div>
      </div>
    )
  }
]
