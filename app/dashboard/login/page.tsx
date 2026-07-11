'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { store } from '@/lib/store';
import { getModulesForFacilityType } from '@/lib/modules-config';
import { PageTransition } from '@/components/animations/page-transition';
import { SlideIn } from '@/components/animations/feedback-animations';
import { LoadingSpinner } from '@/components/animations/loading-states';
import { Calendar, Lock, Mail, Heart, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'فشل تسجيل الدخول');
        return;
      }

      // Check if user has an allowed role for dashboard
      const allowedRoles = ['clinic_admin', 'doctor', 'receptionist'];
      if (!allowedRoles.includes(result.data.user.role)) {
        toast.error('غير مصرح: ليس لديك صلاحية الدخول');
        return;
      }

      store.login(result.data.token, result.data.user);

      // Save clinicConfig to localStorage if available
      if (result.data.user.clinicConfig) {
        store.setClinicConfig(result.data.user.clinicConfig);
        // Dispatch custom event to reload tenant context
        window.dispatchEvent(new Event('clinicConfigUpdated'));
      } else {
        // Fallback to facilityType-based modules
        const facilityType = result.data.user.clinicConfig?.facilityType || 'single_clinic';
        const defaultClinicConfig = {
          facilityType,
          edition: result.data.user.clinicConfig?.edition || 'basic',
          enabledModules: getModulesForFacilityType(facilityType),
          config: {}
        };
        store.setClinicConfig(defaultClinicConfig);
        window.dispatchEvent(new Event('clinicConfigUpdated'));
      }

      toast.success('تم تسجيل الدخول بنجاح');
      router.push('/dashboard');
    } catch {
      toast.error('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div dir="rtl" className="relative min-h-screen flex items-center justify-center p-4 font-sans bg-background overflow-hidden selection:bg-accent-shifa selection:text-[#001810]">
        {/* Ambient background blobs */}
        <div className="blob w-[250px] h-[250px] sm:w-[450px] sm:h-[450px] bg-accent-shifa top-[-100px] right-[-100px]" />
        <div className="blob w-[200px] h-[200px] sm:w-[350px] sm:h-[350px] bg-accent-shifa-deep bottom-[-100px] left-[-100px]" />

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

        <div className="w-full max-w-md relative z-10 space-y-6">
          {/* Header/Logo */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-3 group mb-4">
              <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center bg-accent-shifa shadow-lg">
                <Heart className="w-7 h-7 text-[#001810]" />
                <span className="pulse-ring-shifa !inset-[-5px]" />
              </div>
            </Link>
            <h1 className="font-display font-extrabold text-3xl text-foreground mb-1">تسجيل الدخول</h1>
            <p className="text-sm text-muted-foreground">
              أدخل بيانات الدخول للوصول إلى لوحة تحكم العيادة
            </p>
          </div>

          <SlideIn direction="up" delay={0.2}>
            {/* Card wrapper */}
            <div className="card-shifa-hover rounded-[2.2rem] p-8 shadow-shifa bg-card border border-border-shifa relative overflow-hidden">
              <div className="absolute inset-0 grid-bg-shifa opacity-20 pointer-events-none" />
              
              <div className="relative space-y-6">
                <div className="text-center border-b border-border-shifa pb-4">
                  <h2 className="font-display font-bold text-xl text-foreground">مرحباً بعودتك</h2>
                  <p className="text-xs text-muted-foreground mt-1">سجل الدخول للمتابعة كطبيب أو موظف</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-bold text-muted-foreground mr-1">البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                      <input
                        id="email"
                        type="email"
                        placeholder="admin@clinic.com"
                        className="field-shifa w-full pr-11 pl-4 py-3 rounded-xl text-sm"
                        {...register('email')}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs font-semibold text-rose-error mt-1 mr-1">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label htmlFor="password" className="text-xs font-bold text-muted-foreground mr-1">كلمة المرور</label>
                    <div className="relative">
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                      <input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="field-shifa w-full pr-11 pl-4 py-3 rounded-xl text-sm"
                        {...register('password')}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-xs font-semibold text-rose-error mt-1 mr-1">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn-glow w-full py-3.5 rounded-xl text-base flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <LoadingSpinner size={18} />
                        جاري تسجيل الدخول...
                      </span>
                    ) : (
                      'تسجيل الدخول'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </SlideIn>

          {/* Footer Back Link */}
          <div className="text-center">
            <Link
              href="/"
              className="text-xs font-bold text-accent-shifa-deep hover:underline transition-colors"
            >
              العودة للصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
