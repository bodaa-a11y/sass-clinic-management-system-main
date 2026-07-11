'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, User, Calendar, Stethoscope, ArrowLeft, Loader2, Activity, Download } from 'lucide-react';
import { toast } from 'sonner';

interface MedicalRecord {
  id: string;
  appointmentId: string | null;
  chiefComplaint: string;
  diagnosis: string;
  symptoms: string | null;
  clinicalNotes: string | null;
  vitalSigns: string | null;
  treatmentPlan: string | null;
  followUpDate: string | null;
  doctorId: string;
  doctor: {
    name: string | null;
  };
  createdAt: string;
}

export default function MedicalRecordsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<MedicalRecord[]>([]);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/portal/medical-records');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch medical records');
      }

      setRecords(data.records || []);
    } catch (error) {
      console.error('Fetch medical records error:', error);
      toast.error('فشل في تحميل السجلات الطبية');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const parseVitalSigns = (vitalSigns: string | null) => {
    if (!vitalSigns) return null;
    try {
      return JSON.parse(vitalSigns);
    } catch {
      return null;
    }
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
            <h1 className="text-3xl font-bold text-gray-900">السجلات الطبية</h1>
            <p className="text-gray-600 mt-2">
              عرض سجلاتك الطبية والتشخيصات
            </p>
          </div>
          <Button variant="outline">
            <Download className="ml-2 h-4 w-4" />
            تصدير السجلات
          </Button>
        </div>

        {/* Records List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : records.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                لا توجد سجلات طبية
              </h3>
              <p className="text-gray-600">
                ستظهر سجلاتك الطبية هنا بعد زياراتك
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {records.map((record) => {
              const vitalSigns = parseVitalSigns(record.vitalSigns);
              
              return (
                <Card key={record.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">زيارة طبية</Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            {formatDate(record.createdAt)}
                          </div>
                        </div>
                        <CardTitle className="text-xl">
                          {record.chiefComplaint}
                        </CardTitle>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          د. {record.doctor.name || 'غير محدد'}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Diagnosis */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Stethoscope className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900">التشخيص</h4>
                      </div>
                      <p className="text-blue-800">{record.diagnosis}</p>
                    </div>

                    {/* Symptoms */}
                    {record.symptoms && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">الأعراض</h4>
                        <p className="text-gray-600">{record.symptoms}</p>
                      </div>
                    )}

                    {/* Vital Signs */}
                    {vitalSigns && Object.keys(vitalSigns).length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Activity className="h-5 w-5 text-red-600" />
                          <h4 className="font-semibold text-gray-900">العلامات الحيوية</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {vitalSigns.bloodPressure && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500">ضغط الدم</p>
                              <p className="font-semibold text-gray-900">{vitalSigns.bloodPressure}</p>
                            </div>
                          )}
                          {vitalSigns.heartRate && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500">نبض القلب</p>
                              <p className="font-semibold text-gray-900">{vitalSigns.heartRate} bpm</p>
                            </div>
                          )}
                          {vitalSigns.temperature && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500">درجة الحرارة</p>
                              <p className="font-semibold text-gray-900">{vitalSigns.temperature}°C</p>
                            </div>
                          )}
                          {vitalSigns.weight && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500">الوزن</p>
                              <p className="font-semibold text-gray-900">{vitalSigns.weight} kg</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Treatment Plan */}
                    {record.treatmentPlan && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">خطة العلاج</h4>
                        <p className="text-gray-600">{record.treatmentPlan}</p>
                      </div>
                    )}

                    {/* Clinical Notes */}
                    {record.clinicalNotes && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">ملاحظات طبية</h4>
                        <p className="text-gray-600">{record.clinicalNotes}</p>
                      </div>
                    )}

                    {/* Follow-up Date */}
                    {record.followUpDate && (
                      <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-lg p-3">
                        <Calendar className="h-4 w-4" />
                        <span>موعد المتابعة: {formatDate(record.followUpDate)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
