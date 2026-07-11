'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { store } from '@/lib/store'
import { Button } from '@/components/ui/button-redesigned'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Input } from '@/components/ui/input-redesigned'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Building2, Lock } from 'lucide-react'
import { PageTransition } from '@/components/animations/page-transition'
import { SlideIn } from '@/components/animations/feedback-animations'

export default function SuperAdminLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/super-admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()

        // Store user data in localStorage (token is in httpOnly cookie)
        localStorage.setItem('user', JSON.stringify(data.user))

        // Update store
        store.login(data.token, data.user)

        toast.success('تم تسجيل الدخول بنجاح')
        router.push('/admin/clinics')
      } else {
        const error = await response.json()
        toast.error(error.error || 'فشل تسجيل الدخول')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل الدخول')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-blue to-medical-dark p-4">
        <SlideIn direction="up" delay={0.1}>
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-medical-blue rounded-xl flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl">تسجيل دخول السوبر أدمن</CardTitle>
              <p className="text-sm text-gray-600">
                لوحة تحكم مالك السوفتوير التجاري
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      تسجيل الدخول
                    </>
                  )}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard/login')}
                  className="text-sm"
                >
                  العودة لتسجيل دخول العيادة
                </Button>
              </div>
            </CardContent>
          </Card>
        </SlideIn>
      </div>
    </PageTransition>
  )
}
