'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pill, User, Calendar, RefreshCw, ArrowLeft, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Prescription {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
  status: string;
  doctorId: string;
  medicalRecordId: string;
  doctor: {
    name: string | null;
  };
  isActive: boolean;
  createdAt: string;
}

export default function PrescriptionsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isRequesting, setIsRequesting] = useState<string | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch('/api/portal/prescriptions');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch prescriptions');
      }

      setPrescriptions(data.prescriptions || []);
    } catch (error) {
      console.error('Fetch prescriptions error:', error);
      toast.error('فشل في تحميل الوصفات الطبية');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestRefill = async (prescriptionId: string) => {
    setIsRequesting(prescriptionId);
    try {
      const response = await fetch('/api/portal/prescriptions/refill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prescriptionId,
          notes: 'طلب تجديد من بوابة المرضى',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit refill request');
      }

      toast.success('تم إرسال طلب التجديد بنجاح');
    } catch (error) {
      console.error('Refill request error:', error);
      toast.error(error instanceof Error ? error.message : 'فشل في إرسال طلب التجديد');
    } finally {
      setIsRequesting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'نشط', variant: 'default' },
      completed: { label: 'مكتمل', variant: 'secondary' },
      discontinued: { label: 'متوقف', variant: 'destructive' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/portal/dashboard"
              className="text-gray-600 hover:text-gray-900 mb-4 inline-flex items-center"
            >
              <ArrowLeft className="ml-2 h-4 w-4" />
              العودة إلى لوحة التحكم
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">الوصفات الطبية</h1>
            <p className="text-gray-600 mt-2">
              عرض وصفاتك الطبية وطلب تجديدها
            </p>
          </div>
        </div>

        {/* Prescriptions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : prescriptions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Pill className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                لا توجد وصفات طبية
              </h3>
              <p className="text-gray-600">
                ستظهر وصفاتك الطبية هنا بعد زياراتك
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <Card key={prescription.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(prescription.status)}
                        {prescription.isActive && (
                          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                            نشط
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Pill className="h-6 w-6 text-blue-600" />
                        {prescription.medicationName}
                      </CardTitle>
                    </div>
                    <div className="text-left space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(prescription.createdAt)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        د. {prescription.doctor.name || 'غير محدد'}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Dosage and Frequency */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-600 mb-1">الجرعة</p>
                      <p className="font-semibold text-blue-900">{prescription.dosage}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-600 mb-1">التكرار</p>
                      <p className="font-semibold text-blue-900">{prescription.frequency}</p>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">المدة</p>
                    <p className="font-semibold text-gray-900">{prescription.duration}</p>
                  </div>

                  {/* Instructions */}
                  {prescription.instructions && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">تعليمات الاستخدام</h4>
                      <p className="text-gray-600">{prescription.instructions}</p>
                    </div>
                  )}

                  {/* Request Refill Button */}
                  {prescription.isActive && prescription.status === 'active' && (
                    <Button
                      onClick={() => handleRequestRefill(prescription.id)}
                      disabled={isRequesting === prescription.id}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isRequesting === prescription.id ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="ml-2 h-4 w-4" />
                          طلب تجديد
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
