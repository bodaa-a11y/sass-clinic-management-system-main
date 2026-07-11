'use client'

import { Lock, Settings, Mail, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FACILITY_TYPE_DISPLAY_NAMES, MODULE_DISPLAY_NAMES } from '@/lib/modules-config'
import { useTenant } from '@/lib/tenant-context'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

interface UnauthorizedPageProps {
  moduleName?: string
}

export function UnauthorizedPage({ moduleName }: UnauthorizedPageProps) {
  const router = useRouter()
  const { facilityType, enabledModules } = useTenant()
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleGoToSettings = () => {
    router.push('/dashboard/settings')
  }

  const handleContactSuperAdmin = async () => {
    setIsSending(true)
    try {
      const response = await fetch('/api/contact-super-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: contactMessage.trim(),
          moduleName,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message || 'تم إرسال طلبك إلى Super Admin بنجاح')
        setShowContactForm(false)
        setContactMessage('')
      } else {
        const error = await response.json()
        toast.error(error.error || 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            هذه الصفحة غير متاحة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Explanation */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">لماذا هذه الصفحة غير متاحة؟</p>
                <p className="text-gray-700">
                  هذه الصفحة تتطلب موديول غير مفعّل حالياً في نوع العيادة الخاص بك.
                  لتغيير نوع العيادة، يجب التواصل مع Super Admin.
                </p>
              </div>
            </div>
          </div>

          {/* Current Configuration */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-blue-900 text-sm">إعدادات العيادة الحالية:</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">نوع العيادة:</span>
              <span className="text-sm font-bold text-blue-700">
                {FACILITY_TYPE_DISPLAY_NAMES[facilityType]}
              </span>
            </div>
            <div className="flex items-start justify-between">
              <span className="text-sm text-gray-700">الموديولات المفعلة:</span>
              <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                {enabledModules.length > 0 ? (
                  enabledModules.map((module) => (
                    <span
                      key={module}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                    >
                      {MODULE_DISPLAY_NAMES[module as keyof typeof MODULE_DISPLAY_NAMES] || module}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">لا توجد موديولات مفعلة</span>
                )}
              </div>
            </div>
          </div>

          {/* Required Module */}
          {moduleName && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">الموديول المطلوب:</span>
                <span className="text-sm font-bold text-red-700">
                  {MODULE_DISPLAY_NAMES[moduleName as keyof typeof MODULE_DISPLAY_NAMES] || moduleName}
                </span>
              </div>
            </div>
          )}

          {/* Contact Form */}
          {showContactForm ? (
            <div className="space-y-3 border-t pt-4">
              <label className="text-sm font-medium text-gray-700">
                رسالتك إلى Super Admin:
              </label>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="أشرح سبب رغبتك في تغيير نوع العيادة..."
                className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleContactSuperAdmin}
                  disabled={!contactMessage.trim() || isSending}
                  className="flex-1"
                >
                  <Mail className="w-4 h-4 ml-2" />
                  {isSending ? 'جاري الإرسال...' : 'إرسال الطلب'}
                </Button>
                <Button
                  onClick={() => setShowContactForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 border-t pt-4">
              <Button
                onClick={() => setShowContactForm(true)}
                className="w-full"
                variant="default"
              >
                <Mail className="w-4 h-4 ml-2" />
                تواصل مع Super Admin
              </Button>
              <Button
                onClick={handleGoToSettings}
                className="w-full"
                variant="outline"
              >
                <Settings className="w-4 h-4 ml-2" />
                عرض إعدادات العيادة
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
