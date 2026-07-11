'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Loader2, AlertCircle, Mail, Lock, Heart, Sun, Moon } from 'lucide-react';
import { PageTransition } from '@/components/animations/page-transition';
import { SlideIn } from '@/components/animations/feedback-animations';
import { toast } from 'sonner';

export default function PatientLoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/portal/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      toast.success('تم تسجيل الدخول بنجاح');
      router.push('/portal/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول';
      setError(message);
      toast.error(message);
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
            <h1 className="font-display font-extrabold text-3xl text-foreground mb-1">بوابة المرضى</h1>
            <p className="text-sm text-muted-foreground">
              سجل الدخول للوصول إلى ملفك وسجلاتك الطبية
            </p>
          </div>

          <SlideIn direction="up" delay={0.2}>
            {/* Card wrapper */}
            <div className="card-shifa-hover rounded-[2.2rem] p-8 shadow-shifa bg-card border border-border-shifa relative overflow-hidden">
              <div className="absolute inset-0 grid-bg-shifa opacity-20 pointer-events-none" />
              
              <div className="relative space-y-6">
                <div className="text-center border-b border-border-shifa pb-4">
                  <h2 className="font-display font-bold text-xl text-foreground">مرحباً بك في بوابة شفاء</h2>
                  <p className="text-xs text-muted-foreground mt-1">سجل الدخول للمتابعة إلى ملفك الطبي</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-rose-error/15 border border-rose-error/30 rounded-xl text-rose-error">
                      <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
                      <p className="text-xs font-bold">{error}</p>
                    </div>
                  )}

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-bold text-muted-foreground mr-1">البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                      <input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        className="field-shifa w-full pr-11 pl-4 py-3 rounded-xl text-sm"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <label htmlFor="password" className="text-xs font-bold text-muted-foreground">كلمة المرور</label>
                      <Link
                        href="/portal/forgot-password"
                        className="text-xs font-bold text-accent-shifa-deep hover:underline transition-colors"
                      >
                        نسيت كلمة المرور؟
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                      <input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="field-shifa w-full pr-11 pl-4 py-3 rounded-xl text-sm"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn-glow w-full py-3.5 rounded-xl text-base flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
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

          {/* Footer Navigation */}
          <div className="flex flex-col items-center gap-2 text-xs">
            <div className="text-muted-foreground">
              ليس لديك حساب؟{' '}
              <Link
                href="/portal/register"
                className="font-bold text-accent-shifa-deep hover:underline transition-colors"
              >
                سجل الآن
              </Link>
            </div>
            <Link
              href="/"
              className="font-bold text-accent-shifa-deep hover:underline transition-colors mt-2"
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
