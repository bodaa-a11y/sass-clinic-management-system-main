'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, CreditCard, ArrowLeft, Loader2, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  appointmentId: string | null;
  subtotal: string;
  taxAmount: string | null;
  discountAmount: string | null;
  totalAmount: string;
  balanceAmount: string;
  status: string;
  paymentMethod: string | null;
  issueDate: string;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
}

export default function BillingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/portal/billing');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invoices');
      }

      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Fetch invoices error:', error);
      toast.error('فشل في تحميل الفواتير');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      draft: { label: 'مسودة', variant: 'secondary' },
      sent: { label: 'مرسلة', variant: 'outline' },
      paid: { label: 'مدفوعة', variant: 'default' },
      overdue: { label: 'متأخرة', variant: 'destructive' },
      cancelled: { label: 'ملغاة', variant: 'destructive' },
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

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return num.toLocaleString('ar-SA', {
      style: 'currency',
      currency: 'SAR',
    });
  };

  const isOverdue = (invoice: Invoice) => {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
    if (!invoice.dueDate) return false;
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    return dueDate < today;
  };

  const handlePayNow = (invoiceId: string) => {
    // TODO: Implement payment integration (Stripe, etc.)
    toast.info('سيتم تفعيل الدفع أونلاين قريباً');
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
          <h1 className="text-3xl font-bold text-gray-900">الفواتير والدفع</h1>
          <p className="text-gray-600 mt-2">
            عرض فواتيرك ودفعها أونلاين
          </p>
        </div>

        {/* Invoices List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : invoices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                لا توجد فواتير
              </h3>
              <p className="text-gray-600">
                ستظهر فواتيرك هنا بعد زياراتك
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(invoice.status)}
                        {isOverdue(invoice) && (
                          <Badge variant="destructive" className="bg-red-500">
                            <AlertCircle className="h-3 w-3 ml-1" />
                            متأخرة
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <FileText className="h-6 w-6 text-blue-600" />
                        فاتورة #{invoice.invoiceNumber}
                      </CardTitle>
                    </div>
                    <div className="text-left space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(invoice.issueDate)}
                      </div>
                      {invoice.dueDate && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <span>تاريخ الاستحقاق:</span>
                          <span className={isOverdue(invoice) ? 'text-red-600 font-semibold' : ''}>
                            {formatDate(invoice.dueDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Amount Breakdown */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">المجموع الفرعي</span>
                      <span className="font-semibold">{formatAmount(invoice.subtotal)}</span>
                    </div>
                    {invoice.taxAmount && parseFloat(invoice.taxAmount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">الضريبة</span>
                        <span className="font-semibold">{formatAmount(invoice.taxAmount)}</span>
                    </div>
                    )}
                    {invoice.discountAmount && parseFloat(invoice.discountAmount) > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>الخصم</span>
                        <span className="font-semibold">-{formatAmount(invoice.discountAmount)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-semibold text-gray-900">المجموع الكلي</span>
                      <span className="font-bold text-lg text-blue-600">{formatAmount(invoice.totalAmount)}</span>
                    </div>
                    {parseFloat(invoice.balanceAmount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">الرصيد المتبقي</span>
                        <span className="font-semibold text-red-600">{formatAmount(invoice.balanceAmount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Payment Method */}
                  {invoice.paymentMethod && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CreditCard className="h-4 w-4" />
                      <span>طريقة الدفع: {invoice.paymentMethod}</span>
                    </div>
                  )}

                  {/* Notes */}
                  {invoice.notes && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">ملاحظات</h4>
                      <p className="text-gray-600 text-sm">{invoice.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {invoice.status !== 'paid' && invoice.status !== 'cancelled' && parseFloat(invoice.balanceAmount) > 0 && (
                      <Button
                        onClick={() => handlePayNow(invoice.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <CreditCard className="ml-2 h-4 w-4" />
                        دفع أونلاين
                      </Button>
                    )}
                    <Button variant="outline" className="flex-1">
                      <Download className="ml-2 h-4 w-4" />
                      تحميل الفاتورة
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
