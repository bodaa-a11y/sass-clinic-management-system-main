'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button-redesigned';
import { Input } from '@/components/ui/input-redesigned';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card-redesigned';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';
import { store } from '@/lib/store';
import { getModulesForFacilityType } from '@/lib/modules-config';
import { PageTransition } from '@/components/animations/page-transition';
import { SlideIn } from '@/components/animations/feedback-animations';
import { HoverScale } from '@/components/animations/micro-interactions';
import { LoadingSpinner } from '@/components/animations/loading-states';
import { Calendar, Lock, Mail } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
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
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-medical-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">تسجيل الدخول</h1>
            <p className="text-slate-600">
              أدخل بيانات الدخول للوصول إلى داشبورد العيادة
            </p>
          </div>

          <SlideIn direction="up" delay={0.2}>
            <Card className="shadow-xl border-slate-200">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">مرحباً بعودتك</CardTitle>
                <CardDescription>
                  سجل الدخول للمتابعة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@clinic.com"
                        className="pr-10"
                        {...register('email')}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-rose-error">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pr-10"
                        {...register('password')}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-sm text-rose-error">{errors.password.message}</p>
                    )}
                  </div>

                  <HoverScale>
                    <Button
                      type="submit"
                      className="w-full h-12 text-lg shadow-lg hover:shadow-xl transition-all"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <LoadingSpinner size={20} />
                          جاري تسجيل الدخول...
                        </span>
                      ) : (
                        'تسجيل الدخول'
                      )}
                    </Button>
                  </HoverScale>
                </form>
              </CardContent>
            </Card>
          </SlideIn>

          <div className="text-center mt-6">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-slate-600 hover:text-medical-blue transition-colors"
            >
              العودة للصفحة الرئيسية
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
