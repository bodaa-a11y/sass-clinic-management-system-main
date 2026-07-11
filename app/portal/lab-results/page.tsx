'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Calendar, Download, ArrowLeft, Loader2, FileText, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface LabResult {
  id: string;
  testName: string;
  testType: string;
  result: string;
  normalRange: string | null;
  status: string;
  testDate: string;
  verifiedAt: string | null;
  notes: string | null;
  cloudinaryUrl: string | null;
  fileName: string | null;
  createdAt: string;
}

export default function LabResultsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<LabResult[]>([]);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await fetch('/api/portal/lab-results');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch lab results');
      }

      setResults(data.results || []);
    } catch (error) {
      console.error('Fetch lab results error:', error);
      toast.error('فشل في تحميل نتائج المختبرات');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'قيد الانتظار', variant: 'secondary' },
      completed: { label: 'مكتمل', variant: 'default' },
      cancelled: { label: 'ملغي', variant: 'destructive' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isNormal = (result: string, normalRange: string | null) => {
    // Simple check - in production, this would be more sophisticated
    if (!normalRange) return true;
    // This is a placeholder - actual normal range checking would depend on the test type
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/portal/dashboard"
            className="text-gray-600 hover:text-gray-900 mb-4 inline-flex items-center"
          >
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة إلى لوحة التحكم
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">نتائج المختبرات</h1>
          <p className="text-gray-600 mt-2">
            عرض نتائج الفحوصات المخبرية
          </p>
        </div>

        {/* Results List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : results.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FlaskConical className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                لا توجد نتائج مخبرية
              </h3>
              <p className="text-gray-600">
                ستظهر نتائجك المخبرية هنا بعد إجرائها
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <Card key={result.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(result.status)}
                        {result.status === 'completed' && (
                          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                            <CheckCircle className="h-3 w-3 ml-1" />
                            تم التحقق
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl">
                        {result.testName}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {result.testType}
                      </CardDescription>
                    </div>
                    <div className="text-left space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(result.testDate)}
                      </div>
                      {result.verifiedAt && (
                        <div className="flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          {formatDate(result.verifiedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Result */}
                  <div className={`p-4 rounded-lg ${
                    isNormal(result.result, result.normalRange)
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">النتيجة</h4>
                      {result.normalRange && (
                        <Badge variant="outline" className="bg-white">
                          المدى الطبيعي: {result.normalRange}
                        </Badge>
                      )}
                    </div>
                    <p className={`text-lg font-semibold ${
                      isNormal(result.result, result.normalRange)
                        ? 'text-green-800'
                        : 'text-red-800'
                    }`}>
                      {result.result}
                    </p>
                  </div>

                  {/* Notes */}
                  {result.notes && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">ملاحظات</h4>
                      <p className="text-gray-600">{result.notes}</p>
                    </div>
                  )}

                  {/* Download Button */}
                  {result.cloudinaryUrl && (
                    <Button variant="outline" className="w-full">
                      <Download className="ml-2 h-4 w-4" />
                      تحميل النتيجة
                      {result.fileName && ` (${result.fileName})`}
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
