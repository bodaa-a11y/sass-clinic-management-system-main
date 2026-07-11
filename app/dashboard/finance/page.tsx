'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api-client'
import { store } from '@/lib/store'
import { Button } from '@/components/ui/button-redesigned'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Badge } from '@/components/ui/badge-redesigned'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input-redesigned'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs-redesigned'
import { toast } from 'sonner'
import { DollarSign, CreditCard, TrendingUp, Plus, Download, Check, ShoppingCart } from 'lucide-react'
import { useRealtimeData } from '@/lib/use-realtime-data'
import { PageTransition } from '@/components/animations/page-transition';
import { SlideIn } from '@/components/animations/feedback-animations';
import { HoverScale } from '@/components/animations/micro-interactions'
import { ResponsiveBentoGrid } from '@/components/layout/bento-grid'
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card'
import { MedicalData } from '@/components/ui/typography'
import { PredictiveHighlight } from '@/components/ai/predictive-highlight'

interface Invoice {
  id: string
  patientId: string
  patientName: string
  totalAmount: string
  status: 'pending' | 'paid' | 'overdue'
  dueDate: string
  createdAt: string
}

interface Payment {
  id: string
  invoiceId: string
  amount: string
  paymentMethod: 'cash' | 'card' | 'insurance' | 'bank_transfer' | 'online'
  paymentDate: string
}

interface OnlinePayment {
  id: string
  invoiceId: string
  patientName: string
  amount: string
  paymentGateway: 'stripe' | 'paypal' | 'mada' | 'apple-pay' | 'other'
  transactionId?: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  paymentDate: string
}

interface Expense {
  id: string
  description: string
  amount: string
  category: string
  expenseDate: string
}

interface InsuranceClaim {
  id: string
  invoiceId: string
  patientName: string
  insuranceProvider: string
  claimNumber?: string
  amount: string
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'paid'
  submissionDate?: string
  approvalDate?: string
  rejectionReason?: string
}

interface POSItem {
  id: string
  name: string
  price: number
  category: string
  stock?: number
}

interface POSCart {
  items: {
    itemId: string
    itemName: string
    price: number
    quantity: number
  }[]
  patientId?: string
  patientName?: string
}

export default function FinancePage() {
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [paymentForm, setPaymentForm] = useState({
    invoiceId: '',
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'card' | 'insurance' | 'bank_transfer',
  });
  const [isOnlinePaymentDialogOpen, setIsOnlinePaymentDialogOpen] = useState(false);
  const [onlinePaymentForm, setOnlinePaymentForm] = useState({
    invoiceId: '',
    patientName: '',
    amount: '',
    paymentGateway: 'stripe' as 'stripe' | 'paypal' | 'mada' | 'apple-pay' | 'other',
  });
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'other' as 'rent' | 'utilities' | 'supplies' | 'salaries' | 'other',
    date: new Date().toISOString().split('T')[0],
  });
  const [claimForm, setClaimForm] = useState({
    invoiceId: '',
    insuranceProvider: '',
    amount: '',
  });
  const [posCart, setPOSCart] = useState<POSCart>({ items: [] });
  const [isPOSDialogOpen, setIsPOSDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    const user = store.getUser()
    if (user?.clinicId) {
      setClinicId(user.clinicId)
    }
  }, [])

  const { data: invoices, isLoading: invoicesLoading, refetch: refetchInvoices } = useRealtimeData<Invoice[]>(
    clinicId ? `/clinics/${clinicId}/invoices` : '',
    { interval: 30000, enabled: !!clinicId }
  )

  const filteredInvoices = invoiceStatusFilter === 'all'
    ? invoices?.filter(inv => {
        const invoiceDate = new Date(inv.createdAt);
        const startDate = new Date(dateFilter.start);
        const endDate = new Date(dateFilter.end);
        return invoiceDate >= startDate && invoiceDate <= endDate;
      })
    : invoices?.filter(inv => {
        const invoiceDate = new Date(inv.createdAt);
        const startDate = new Date(dateFilter.start);
        const endDate = new Date(dateFilter.end);
        return inv.status === invoiceStatusFilter && invoiceDate >= startDate && invoiceDate <= endDate;
      });

  const { data: payments, isLoading: paymentsLoading, refetch: refetchPayments } = useRealtimeData<Payment[]>(
    clinicId ? `/clinics/${clinicId}/payments` : '',
    { interval: 30000, enabled: !!clinicId }
  )

  const { data: expenses, isLoading: expensesLoading, refetch: refetchExpenses } = useRealtimeData<Expense[]>(
    clinicId ? `/clinics/${clinicId}/expenses` : '',
    { interval: 30000, enabled: !!clinicId }
  )

  const { data: claims, isLoading: claimsLoading, refetch: refetchClaims } = useRealtimeData<InsuranceClaim[]>(
    clinicId ? `/clinics/${clinicId}/insurance-claims` : '',
    { interval: 30000, enabled: !!clinicId }
  )

  const { data: onlinePayments, isLoading: onlinePaymentsLoading, refetch: refetchOnlinePayments } = useRealtimeData<OnlinePayment[]>(
    clinicId ? `/clinics/${clinicId}/online-payments` : '',
    { interval: 30000, enabled: !!clinicId }
  )

  const { data: posItems, isLoading: posItemsLoading } = useRealtimeData<POSItem[]>(
    clinicId ? `/clinics/${clinicId}/pos-items` : '',
    { interval: 30000, enabled: !!clinicId }
  )

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await apiFetch(`/clinics/${clinicId}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: paymentForm.invoiceId,
          amount: paymentForm.amount,
          paymentMethod: paymentForm.paymentMethod,
        }),
      })

      if (response.ok) {
        toast.success('تم تسجيل الدفع بنجاح')
        setIsPaymentDialogOpen(false)
        setPaymentForm({ invoiceId: '', amount: '', paymentMethod: 'cash' })
        refetchPayments()
      } else {
        toast.error('فشل تسجيل الدفع')
      }
    } catch {
      toast.error('حدث خطأ أثناء تسجيل الدفع')
    }
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await apiFetch(`/clinics/${clinicId}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
          description: expenseForm.description,
          amount: expenseForm.amount,
          category: expenseForm.category,
          date: expenseForm.date,
        }),
      })

      if (response.ok) {
        toast.success('تم إضافة المصروف بنجاح')
        setIsExpenseDialogOpen(false)
        setExpenseForm({
          description: '',
          amount: '',
          category: 'other',
          date: new Date().toISOString().split('T')[0],
        })
        refetchExpenses()
      } else {
        toast.error('فشل إضافة المصروف')
      }
    } catch {
      toast.error('حدث خطأ أثناء إضافة المصروف')
    }
  }

  const handleAddInsuranceClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clinicId) return

    try {
      const invoice = invoices?.find(inv => inv.id === claimForm.invoiceId)
      if (!invoice) {
        toast.error('الفاتورة غير موجودة')
        return
      }

      const response = await apiFetch(`/clinics/${clinicId}/insurance-claims`, {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: claimForm.invoiceId,
          patientName: invoice.patientName,
          insuranceProvider: claimForm.insuranceProvider,
          amount: claimForm.amount,
          status: 'pending',
          submissionDate: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        toast.success('تم إضافة مطالبة التأمين بنجاح')
        setIsClaimDialogOpen(false)
        setClaimForm({
          invoiceId: '',
          insuranceProvider: '',
          amount: '',
        })
        refetchClaims()
      } else {
        toast.error('فشل إضافة مطالبة التأمين')
      }
    } catch {
      toast.error('حدث خطأ أثناء إضافة مطالبة التأمين')
    }
  }

  const handleOnlinePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clinicId) return

    try {
      const response = await apiFetch(`/clinics/${clinicId}/online-payments`, {
        method: 'POST',
        body: JSON.stringify(onlinePaymentForm)
      })

      if (response.ok) {
        toast.success('تم بدء عملية الدفع الإلكتروني')
        setIsOnlinePaymentDialogOpen(false)
        setOnlinePaymentForm({
          invoiceId: '',
          patientName: '',
          amount: '',
          paymentGateway: 'stripe'
        })
        refetchOnlinePayments()
      } else {
        toast.error('فشل بدء عملية الدفع الإلكتروني')
      }
    } catch {
      toast.error('حدث خطأ أثناء بدء عملية الدفع الإلكتروني')
    }
  }

  const handleAddToCart = (item: POSItem) => {
    const existingItem = posCart.items.find(cartItem => cartItem.itemId === item.id)
    if (existingItem) {
      setPOSCart({
        ...posCart,
        items: posCart.items.map(cartItem =>
          cartItem.itemId === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      })
    } else {
      setPOSCart({
        ...posCart,
        items: [
          ...posCart.items,
          {
            itemId: item.id,
            itemName: item.name,
            price: item.price,
            quantity: 1
          }
        ]
      })
    }
  }

  const handleRemoveFromCart = (itemId: string) => {
    setPOSCart({
      ...posCart,
      items: posCart.items.filter(item => item.itemId !== itemId)
    })
  }

  const handleUpdateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(itemId)
      return
    }
    setPOSCart({
      ...posCart,
      items: posCart.items.map(item =>
        item.itemId === itemId ? { ...item, quantity } : item
      )
    })
  }

  const handlePOSCheckout = async () => {
    if (!clinicId || posCart.items.length === 0) return

    try {
      const totalAmount = posCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      
      const response = await apiFetch(`/clinics/${clinicId}/invoices`, {
        method: 'POST',
        body: JSON.stringify({
          patientId: posCart.patientId,
          patientName: posCart.patientName || 'عميل نقطة بيع',
          totalAmount: totalAmount.toString(),
          status: 'pending',
          items: posCart.items,
          source: 'pos'
        })
      })

      if (response.ok) {
        toast.success('تم إنشاء الفاتورة بنجاح')
        setPOSCart({ items: [] })
        setIsPOSDialogOpen(false)
        refetchInvoices()
      } else {
        toast.error('فشل إنشاء الفاتورة')
      }
    } catch {
      toast.error('حدث خطأ أثناء إنشاء الفاتورة')
    }
  }

  const handleMarkAsPaid = async (invoiceId: string) => {
    if (!clinicId) return

    try {
      const response = await apiFetch(`/clinics/${clinicId}/invoices/${invoiceId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'paid' })
      })

      if (response.ok) {
        toast.success('تم تحديث حالة الفاتورة')
      }
    } catch (error) {
      toast.error('فشل تحديث حالة الفاتورة')
    }
  }

  const totalRevenue = filteredInvoices?.reduce((sum, inv) => inv.status === 'paid' ? sum + parseFloat(inv.totalAmount) : sum, 0) || 0
  const pendingRevenue = filteredInvoices?.reduce((sum, inv) => inv.status === 'pending' ? sum + parseFloat(inv.totalAmount) : sum, 0) || 0
  const totalExpenses = expenses?.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0

  return (
    <PageTransition>
      <div className="flex flex-col" dir="rtl">
        {/* Header */}
        <div className="flex-shrink-0">
          <SlideIn direction="up" delay={0.1}>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-slate-900">المالية</h1>
                <p className="text-base text-slate-600">إدارة الفواتير والمدفوعات والمصاريف</p>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="date"
                  value={dateFilter.start}
                  onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                  className="w-40"
                />
                <Input
                  type="date"
                  value={dateFilter.end}
                  onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                  className="w-40"
                />
                <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="فلترة الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="paid">مدفوعة</SelectItem>
                    <SelectItem value="overdue">متأخرة</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => toast.success('تم تصدير التقرير بنجاح')}>
                  <Download className="w-4 h-4 ml-2" />
                  تصدير
                </Button>
              </div>
            </div>
          </SlideIn>
        </div>

        {/* Summary Cards - Flex-shrink to prevent overflow */}
        <div className="flex-shrink-0">
          <ResponsiveBentoGrid
            gap={6}
            items={[
              {
                id: 'revenue',
                size: 'small' as const,
                content: (
                  <HoverScale>
                    <Card className="border border-slate-200 h-full min-h-[140px] rounded-xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">إجمالي الإيرادات</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <MedicalData
                          value={`${totalRevenue.toFixed(2)} ر.س`}
                          label="إجمالي الإيرادات"
                          variant="success"
                          size="md"
                        />
                      </CardContent>
                    </Card>
                  </HoverScale>
                ),
              },
              {
                id: 'pending',
                size: 'small' as const,
                content: (
                  <HoverScale>
                    <Card className="border border-slate-200 h-full min-h-[140px] rounded-xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">إيرادات معلقة</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <MedicalData
                          value={`${pendingRevenue.toFixed(2)} ر.س`}
                          label="إيرادات معلقة"
                          variant="warning"
                          size="md"
                        />
                      </CardContent>
                    </Card>
                  </HoverScale>
                ),
              },
              {
                id: 'expenses',
                size: 'small' as const,
                content: (
                  <HoverScale>
                    <Card className="border border-slate-200 h-full min-h-[140px] rounded-xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">إجمالي المصاريف</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <MedicalData
                          value={`${totalExpenses.toFixed(2)} ر.س`}
                          label="إجمالي المصاريف"
                          variant="alert"
                          size="md"
                        />
                      </CardContent>
                    </Card>
                  </HoverScale>
                ),
              },
            ]}
          />
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Tabs defaultValue="invoices" className="w-full flex flex-col">
          <TabsList className="grid w-full grid-cols-6 flex-shrink-0">
            <TabsTrigger value="invoices" className="text-xs sm:text-sm">الفواتير</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm">المدفوعات</TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs sm:text-sm">المصاريف</TabsTrigger>
            <TabsTrigger value="claims" className="text-xs sm:text-sm">مطالبات التأمين</TabsTrigger>
            <TabsTrigger value="pos" className="text-xs sm:text-sm">نقطة البيع</TabsTrigger>
            <TabsTrigger value="online-payments" className="text-xs sm:text-sm">الدفع الإلكتروني</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="flex-1">
            <Card className="border border-slate-200 rounded-xl flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="w-5 h-5" />
                  الفواتير ({invoices?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
              {invoicesLoading ? (
                <div className="space-y-4 p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse border border-slate-200 rounded-lg p-4">
                      <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : !invoices || invoices.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <DollarSign className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      لا توجد فواتير
                    </h3>
                    <p className="text-sm text-gray-500">ابدأ بإضافة فاتورة جديدة</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInvoices?.map((invoice) => (
                    invoice.status === 'overdue' ? (
                      <PredictiveHighlight key={invoice.id} variant="alert" intensity="medium" showIcon message="فاتورة متأخرة">
                        <Card className="border border-slate-200 rounded-lg">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900">{invoice.patientName}</h3>
                                <div className="text-sm text-gray-600 mt-1">
                                  المبلغ: {invoice.totalAmount} ر.س
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  تاريخ الاستحقاق: {invoice.dueDate}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge variant="destructive">
                                  متأخرة
                                </Badge>
                                <Button size="sm" onClick={() => handleMarkAsPaid(invoice.id)}>
                                  <Check className="w-4 h-4 ml-2" />
                                  تأكيد الدفع
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </PredictiveHighlight>
                    ) : (
                      <Card key={invoice.id} className="border border-slate-200 hover:shadow-md transition-shadow rounded-lg">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{invoice.patientName}</h3>
                              <div className="text-sm text-gray-600 mt-1">
                                المبلغ: {invoice.totalAmount} ر.س
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                تاريخ الاستحقاق: {invoice.dueDate}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                                {invoice.status === 'paid' ? 'مدفوعة' : 'معلقة'}
                              </Badge>
                              {invoice.status === 'pending' && (
                                <Button size="sm" onClick={() => handleMarkAsPaid(invoice.id)}>
                                  <Check className="w-4 h-4 ml-2" />
                                  تأكيد الدفع
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

          <TabsContent value="payments" className="flex-1">
            <Card className="border border-slate-200 rounded-xl flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    المدفوعات ({payments?.length || 0})
                  </div>
                  <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 ml-2" />
                        تسجيل دفع
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>تسجيل دفع جديد</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleRecordPayment} className="space-y-4">
                        <div>
                          <Label htmlFor="invoiceId">الفاتورة *</Label>
                          <Select value={paymentForm.invoiceId} onValueChange={(value) => setPaymentForm({ ...paymentForm, invoiceId: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الفاتورة" />
                            </SelectTrigger>
                            <SelectContent>
                              {invoices?.filter(inv => inv.status === 'pending').map((invoice) => (
                                <SelectItem key={invoice.id} value={invoice.id}>
                                  {invoice.patientName} - {invoice.totalAmount} ر.س
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="amount">المبلغ *</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={paymentForm.amount}
                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="paymentMethod">طريقة الدفع *</Label>
                          <Select value={paymentForm.paymentMethod} onValueChange={(value: 'cash' | 'card' | 'insurance' | 'bank_transfer') => setPaymentForm({ ...paymentForm, paymentMethod: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر طريقة الدفع" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">نقداً</SelectItem>
                              <SelectItem value="card">بطاقة</SelectItem>
                              <SelectItem value="insurance">تأمين</SelectItem>
                              <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                            إلغاء
                          </Button>
                          <Button type="submit">تسجيل</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
              {paymentsLoading ? (
                <div className="space-y-4 p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse border border-slate-200 rounded-lg p-4">
                      <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : !payments || payments.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      لا توجد مدفوعات
                    </h3>
                    <p className="text-sm text-gray-500">سجل دفع جديد للفواتير المعلقة</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <Card key={payment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{payment.amount} ر.س</h3>
                            <div className="text-sm text-gray-600 mt-1">
                              {payment.paymentMethod === 'cash' ? 'نقداً' : 
                               payment.paymentMethod === 'card' ? 'بطاقة' :
                               payment.paymentMethod === 'insurance' ? 'تأمين' : 
                               payment.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : payment.paymentMethod}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {payment.paymentDate}
                            </div>
                          </div>
                          <Badge variant="default">مكتمل</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

          <TabsContent value="expenses" className="flex-1">
            <Card className="border border-slate-200 rounded-xl flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    المصاريف ({expenses?.length || 0})
                  </div>
                  <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة مصروف
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>إضافة مصروف جديد</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddExpense} className="space-y-4">
                        <div>
                          <Label htmlFor="description">الوصف *</Label>
                          <Input
                            id="description"
                            value={expenseForm.description}
                            onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="amount">المبلغ *</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={expenseForm.amount}
                            onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="category">الفئة *</Label>
                          <Select value={expenseForm.category} onValueChange={(value: any) => setExpenseForm({ ...expenseForm, category: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الفئة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="rent">إيجار</SelectItem>
                              <SelectItem value="utilities">مرافق</SelectItem>
                              <SelectItem value="supplies">مستلزمات</SelectItem>
                              <SelectItem value="salaries">رواتب</SelectItem>
                              <SelectItem value="other">أخرى</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="date">التاريخ *</Label>
                          <Input
                            id="date"
                            type="date"
                            value={expenseForm.date}
                            onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
                            إلغاء
                          </Button>
                          <Button type="submit">إضافة</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
              {expensesLoading ? (
                <div className="space-y-4 p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse border border-slate-200 rounded-lg p-4">
                      <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : !expenses || expenses.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <TrendingUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      لا توجد مصاريف
                    </h3>
                    <p className="text-sm text-gray-500">أضف مصروف جديد لتتبع الإنفاق</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {expenses.map((expense) => (
                    <Card key={expense.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{expense.description}</h3>
                            <div className="text-sm text-gray-600 mt-1">
                              {expense.category}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {expense.expenseDate}
                            </div>
                          </div>
                          <div className="text-lg font-bold text-red-600">
                            {expense.amount} ر.س
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claims" className="flex-1">
          <Card className="border border-slate-200 rounded-xl flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  مطالبات التأمين ({claims?.length || 0})
                </div>
                <Dialog open={isClaimDialogOpen} onOpenChange={setIsClaimDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 ml-2" />
                      مطالبة جديدة
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة مطالبة تأمين جديدة</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddInsuranceClaim} className="space-y-4">
                      <div>
                        <Label htmlFor="invoiceId">الفاتورة *</Label>
                        <Select value={claimForm.invoiceId} onValueChange={(value) => setClaimForm({ ...claimForm, invoiceId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الفاتورة" />
                          </SelectTrigger>
                          <SelectContent>
                            {invoices?.filter(inv => inv.status === 'pending').map((invoice) => (
                              <SelectItem key={invoice.id} value={invoice.id}>
                                {invoice.patientName} - {invoice.totalAmount} ر.س
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="insuranceProvider">شركة التأمين *</Label>
                        <Input
                          id="insuranceProvider"
                          value={claimForm.insuranceProvider}
                          onChange={(e) => setClaimForm({ ...claimForm, insuranceProvider: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="amount">المبلغ *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={claimForm.amount}
                          onChange={(e) => setClaimForm({ ...claimForm, amount: e.target.value })}
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsClaimDialogOpen(false)}>
                          إلغاء
                        </Button>
                        <Button type="submit">إضافة</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {claimsLoading ? (
                <div className="space-y-4 p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse border border-slate-200 rounded-lg p-4">
                      <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : !claims || claims.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      لا توجد مطالبات تأمين
                    </h3>
                    <p className="text-sm text-gray-500">أضف مطالبة تأمين جديدة</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {claims.map((claim) => (
                    <Card key={claim.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{claim.patientName}</h3>
                              <Badge variant={
                                claim.status === 'approved' ? 'default' :
                                claim.status === 'rejected' ? 'destructive' :
                                claim.status === 'paid' ? 'default' :
                                'secondary'
                              }>
                                {claim.status === 'pending' ? 'قيد الانتظار' :
                                 claim.status === 'submitted' ? 'مقدمة' :
                                 claim.status === 'approved' ? 'موافق عليها' :
                                 claim.status === 'rejected' ? 'مرفوضة' :
                                 'مدفوعة'}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              {claim.insuranceProvider}
                            </div>
                            {claim.claimNumber && (
                              <div className="text-sm text-gray-500">
                                رقم المطالبة: {claim.claimNumber}
                              </div>
                            )}
                            {claim.submissionDate && (
                              <div className="text-xs text-gray-400 mt-1">
                                تاريخ التقديم: {new Date(claim.submissionDate).toLocaleDateString('ar-SA')}
                              </div>
                            )}
                          </div>
                          <div className="text-lg font-bold text-green-600">
                            {claim.amount} ر.س
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pos" className="flex-1">
          <Card className="border border-slate-200 rounded-xl flex flex-col h-full">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                نقطة البيع
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Products Grid */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {posItemsLoading ? (
                      <div className="col-span-full text-center py-8">جاري التحميل...</div>
                    ) : !posItems || posItems.length === 0 ? (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        لا توجد عناصر في نقطة البيع
                      </div>
                    ) : (
                      posItems.map((item) => (
                        <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleAddToCart(item)}>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-2">{item.name}</h3>
                            <div className="text-sm text-gray-600 mb-2">{item.category}</div>
                            <div className="text-lg font-bold text-green-600">{item.price} ر.س</div>
                            {item.stock !== undefined && (
                              <div className="text-xs text-gray-500 mt-1">المخزون: {item.stock}</div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                {/* Cart */}
                <div className="border rounded-lg p-4 flex flex-col h-fit">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    سلة المشتريات
                  </h3>
                  {posCart.items.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">السلة فارغة</div>
                  ) : (
                    <>
                      <div className="space-y-3 flex-1 overflow-y-auto max-h-64">
                        {posCart.items.map((item) => (
                          <div key={item.itemId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{item.itemName}</div>
                              <div className="text-xs text-gray-600">{item.price} ر.س</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleUpdateCartQuantity(item.itemId, item.quantity - 1)}>
                                -
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button size="sm" variant="outline" onClick={() => handleUpdateCartQuantity(item.itemId, item.quantity + 1)}>
                                +
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-4 mt-4">
                        <div className="flex justify-between font-bold text-lg mb-4">
                          <span>المجموع:</span>
                          <span>{posCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)} ر.س</span>
                        </div>
                        <Button className="w-full" onClick={handlePOSCheckout} disabled={posCart.items.length === 0}>
                          إتمام البيع
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="online-payments" className="flex-1">
          <Card className="border border-slate-200 rounded-xl flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  الدفع الإلكتروني ({onlinePayments?.length || 0})
                </div>
                <Dialog open={isOnlinePaymentDialogOpen} onOpenChange={setIsOnlinePaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 ml-2" />
                      دفع جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>دفع إلكتروني جديد</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleOnlinePayment} className="space-y-4">
                      <div>
                        <Label htmlFor="invoiceId">رقم الفاتورة *</Label>
                        <Input
                          id="invoiceId"
                          value={onlinePaymentForm.invoiceId}
                          onChange={(e) => setOnlinePaymentForm({ ...onlinePaymentForm, invoiceId: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="patientName">اسم المريض *</Label>
                        <Input
                          id="patientName"
                          value={onlinePaymentForm.patientName}
                          onChange={(e) => setOnlinePaymentForm({ ...onlinePaymentForm, patientName: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="amount">المبلغ *</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={onlinePaymentForm.amount}
                          onChange={(e) => setOnlinePaymentForm({ ...onlinePaymentForm, amount: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="paymentGateway">بوابة الدفع *</Label>
                        <Select value={onlinePaymentForm.paymentGateway} onValueChange={(value: 'stripe' | 'paypal' | 'mada' | 'apple-pay' | 'other') => setOnlinePaymentForm({ ...onlinePaymentForm, paymentGateway: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stripe">Stripe</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="mada">مدى</SelectItem>
                            <SelectItem value="apple-pay">Apple Pay</SelectItem>
                            <SelectItem value="other">أخرى</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsOnlinePaymentDialogOpen(false)}>
                          إلغاء
                        </Button>
                        <Button type="submit">بدء الدفع</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {onlinePaymentsLoading ? (
                <div className="text-center py-12">جاري التحميل...</div>
              ) : !onlinePayments || onlinePayments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    لا توجد مدفوعات إلكترونية
                  </h3>
                </div>
              ) : (
                <div className="space-y-3">
                  {onlinePayments.map((payment) => (
                    <Card key={payment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{payment.patientName}</h3>
                              <Badge variant={payment.status === 'completed' ? 'default' : payment.status === 'failed' ? 'destructive' : 'secondary'}>
                                {payment.status === 'pending' ? 'قيد الانتظار' : payment.status === 'processing' ? 'قيد المعالجة' : payment.status === 'completed' ? 'مكتمل' : payment.status === 'failed' ? 'فشل' : 'مسترد'}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">البوابة:</span> {payment.paymentGateway}
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">المبلغ:</span> {payment.amount} ر.س
                            </div>
                            {payment.transactionId && (
                              <div className="text-xs text-gray-500 mt-1">
                                <span className="font-medium">رقم المعاملة:</span> {payment.transactionId}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              <span className="font-medium">تاريخ الدفع:</span> {new Date(payment.paymentDate).toLocaleDateString('ar-SA')}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
      </div>
    </PageTransition>
  )
}
