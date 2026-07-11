'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button-redesigned'
import { store } from '@/lib/store'
import { Calendar, Building2, Activity, Users, FileText, Shield } from 'lucide-react'
import { PageTransition } from '@/components/animations/page-transition'
import { SlideIn } from '@/components/animations/feedback-animations'
import { HoverScale } from '@/components/animations/micro-interactions'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const user = store.getUser()
    if (user) {
      if (user.role === 'super_admin') {
        router.replace('/admin')
      } else {
        router.replace('/dashboard')
      }
    }
  }, [router])

  return (
    <PageTransition>
      <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">
          {/* Left Side - Hero */}
          <div className="space-y-6">
            <div className="w-24 h-24 bg-medical-blue rounded-2xl flex items-center justify-center shadow-lg mb-6">
              <Calendar className="w-12 h-12 text-white" />
            </div>

            <SlideIn direction="up" delay={0.2}>
              <h1 className="text-5xl font-bold text-slate-900 mb-4 leading-tight">
                منصة إدارة العيادات
              </h1>
            </SlideIn>

            <SlideIn direction="up" delay={0.3}>
              <p className="text-xl text-slate-600 mb-8">
                نظام شامل وإحترافي لإدارة المواعيد والمرضى والموظفين
              </p>
            </SlideIn>

            <SlideIn direction="up" delay={0.4}>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-success/20 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-emerald-success" />
                  </div>
                  <span className="text-sm text-slate-700">سريع وفعال</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-medical-blue/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-medical-blue" />
                  </div>
                  <span className="text-sm text-slate-700">آمن ومحمي</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-secondary/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-teal-secondary" />
                  </div>
                  <span className="text-sm text-slate-700">سهل الاستخدام</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-warning/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-amber-warning" />
                  </div>
                  <span className="text-sm text-slate-700">تقارير مفصلة</span>
                </div>
              </div>
            </SlideIn>

            <SlideIn direction="up" delay={0.5}>
              <div className="space-y-4">
                <HoverScale>
                  <Button
                    size="xl"
                    className="w-full h-14 text-lg gap-2 shadow-lg hover:shadow-xl transition-all"
                    onClick={() => router.push('/dashboard/login')}
                  >
                    <Building2 className="w-5 h-5" />
                    دخول العيادة
                  </Button>
                </HoverScale>

                <HoverScale>
                  <Button
                    size="xl"
                    variant="accent"
                    className="w-full h-14 text-lg gap-2 shadow-lg hover:shadow-xl transition-all"
                    onClick={() => router.push('/book')}
                  >
                    <Calendar className="w-5 h-5" />
                    تسجيل دخول كمريض
                  </Button>
                </HoverScale>
              </div>
            </SlideIn>
          </div>

          {/* Right Side - Illustration */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-medical-blue/20 to-teal-secondary/20 rounded-3xl blur-3xl" />
              <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-slate-200">
                <div className="space-y-4">
                  <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse" />
                  <div className="h-32 bg-gradient-to-br from-medical-blue/10 to-teal-secondary/10 rounded-xl" />
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-slate-50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                  <div className="h-4 bg-slate-100 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-sm text-slate-400">
            © 2024 منصة إدارة العيادات - جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </PageTransition>
  )
}
