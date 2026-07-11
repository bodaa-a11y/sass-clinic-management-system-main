'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, UserPlus, Mail, Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function PatientRegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      toast.error('كلمات المرور غير متطابقة');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/portal/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(true);
      toast.success('تم إنشاء الحساب بنجاح');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ أثناء التسجيل';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4" dir="rtl">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              تم إنشاء الحساب بنجاح
            </CardTitle>
            <CardDescription className="text-gray-600">
              يمكنك الآن تسجيل الدخول باستخدام بريدك الإلكتروني وكلمة المرور
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/portal/login')}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
            >
              الانتقال إلى تسجيل الدخول
              <ArrowLeft className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-600 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">إنشاء حساب جديد</CardTitle>
          <CardDescription className="text-gray-600">
            سجل للوصول إلى سجلاتك الطبية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="patientId" className="text-right">
                معرف المريض
              </Label>
              <div className="relative">
                <UserPlus className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="patientId"
                  type="text"
                  placeholder="أدخل معرف المريض الخاص بك"
                  className="pr-10 text-right"
                  value={formData.patientId}
                  onChange={(e) =>
                    setFormData({ ...formData, patientId: e.target.value })
                  }
                  disabled={isLoading}
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                يمكنك الحصول على معرف المريض من العيادة
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-right">
                البريد الإلكتروني
              </Label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  className="pr-10 text-right"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-right">
                كلمة المرور
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pr-10 text-right"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  disabled={isLoading}
                  required
                  minLength={8}
                />
              </div>
              <p className="text-xs text-gray-500">
                يجب أن تكون كلمة المرور 8 أحرف على الأقل
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-right">
                تأكيد كلمة المرور
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pr-10 text-right"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  disabled={isLoading}
                  required
                  minLength={8}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري إنشاء الحساب...
                </>
              ) : (
                <>
                  إنشاء الحساب
                  <ArrowLeft className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-gray-600">
            لديك حساب بالفعل؟{' '}
            <Link
              href="/portal/login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              سجل الدخول
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
