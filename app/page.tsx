'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { Button } from '@/components/ui/button-redesigned'
import { store } from '@/lib/store'
import { 
  Building2, 
  Activity, 
  Users, 
  FileText, 
  Shield,
  Calendar,
  Heart,
  Sun,
  Moon
} from 'lucide-react'
import { PageTransition } from '@/components/animations/page-transition'

export default function HomePage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    // Redirect if already logged in
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
      <div className="relative min-h-screen bg-background overflow-x-hidden flex items-center justify-center p-4 font-sans selection:bg-accent-shifa selection:text-[#001810]">
        {/* Ambient background blobs */}
        <div className="blob w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-accent-shifa top-[-100px] right-[-100px]" />
        <div className="blob w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] bg-accent-shifa-deep bottom-[-100px] left-[-100px]" />

        {/* Floating Theme Toggle in top corner */}
        {mounted && (
          <div className="absolute top-6 left-6 z-50">
            <div 
              className="toggle-track-shifa" 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              role="button" 
              aria-label="تبديل الوضع"
            >
              <div className="toggle-knob-shifa">
                {theme === 'dark' ? (
                  <Moon className="w-3.5 h-3.5" />
                ) : (
                  <Sun className="w-3.5 h-3.5" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Central Card */}
        <div className="relative z-10 w-full max-w-xl card-shifa-hover rounded-[2.5rem] p-8 sm:p-12 shadow-shifa bg-card border border-border-shifa overflow-hidden">
          <div className="absolute inset-0 grid-bg-shifa opacity-30 pointer-events-none" />
          
          <div className="relative flex flex-col items-center text-center space-y-8">
            {/* Logo */}
            <div className="relative w-16 h-16 rounded-3xl flex items-center justify-center bg-accent-shifa shadow-lg">
              <Heart className="w-9 h-9 text-[#001810]" />
              <span className="pulse-ring-shifa !inset-[-6px]" />
            </div>

            <div className="space-y-3">
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-foreground">
                منصة إدارة العيادات
              </h1>
              <p className="text-base text-muted-foreground max-w-sm">
                نظام شامل وإحترافي لإدارة المواعيد والسجلات الطبية وإدارة العيادات
              </p>
            </div>

            {/* ECG pulse monitor */}
            <div className="w-full rounded-2xl p-4 bg-bg-shifa-soft border border-border-shifa relative overflow-hidden">
              <svg viewBox="0 0 400 60" className="w-full h-12">
                <path 
                  className="ecg-path" 
                  d="M0 30 L80 30 L100 30 L110 10 L120 50 L130 18 L140 30 L220 30 L240 30 L250 8 L260 52 L270 12 L280 30 L400 30" 
                  stroke="var(--accent-shifa)" 
                  strokeWidth="2" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Selection Buttons */}
            <div className="w-full flex flex-col gap-4">
              <Link
                href="/dashboard/login"
                className="btn-glow w-full py-4 rounded-2xl text-lg flex items-center justify-center gap-3 transition-all cursor-pointer"
              >
                <Building2 className="w-6 h-6" />
                دخول العيادة (طبيب / موظف)
              </Link>
              
              <Link
                href="/portal/login"
                className="btn-outline-shifa w-full py-4 rounded-2xl text-lg flex items-center justify-center gap-3 font-semibold transition-all cursor-pointer"
              >
                <Users className="w-6 h-6" />
                تسجيل دخول كمريض (بوابة المريض)
              </Link>

              <Link
                href="/book/shifa-clinic"
                className="text-sm font-bold text-accent-shifa-deep hover:underline transition-all cursor-pointer pt-2 flex items-center justify-center gap-1"
              >
                <Calendar className="w-4 h-4" />
                أو حجز موعد سريع مباشرة
              </Link>
            </div>

            {/* Feature Icons Grid */}
            <div className="w-full pt-8 border-t border-border-shifa grid grid-cols-2 gap-4 text-right">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-success/15 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 text-emerald-success" />
                </div>
                <span className="text-xs font-bold text-foreground">سريع وفعال</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-medical-blue/15 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-medical-blue" />
                </div>
                <span className="text-xs font-bold text-foreground">آمن ومحمي</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-secondary/15 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-teal-secondary" />
                </div>
                <span className="text-xs font-bold text-foreground">سهل الاستخدام</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-warning/15 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-amber-warning" />
                </div>
                <span className="text-xs font-bold text-foreground">تقارير مفصلة</span>
              </div>
            </div>

            {/* Copyright */}
            <div className="text-xs text-muted-foreground pt-4">
              © 2026 منصة إدارة العيادات - جميع الحقوق محفوظة
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
