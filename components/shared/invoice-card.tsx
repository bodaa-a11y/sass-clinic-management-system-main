'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, DollarSign, User, Calendar, CreditCard } from 'lucide-react'

interface InvoiceCardProps {
  invoice: {
    id: string
    invoiceNumber: string
    patientName: string
    totalAmount: string
    paidAmount: string
    balanceAmount: string
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
    issueDate: string
    dueDate?: string
    paymentMethod?: string
  }
  onClick?: () => void
  showActions?: boolean
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-800' },
  sent: { label: 'مرسلة', color: 'bg-blue-100 text-blue-800' },
  paid: { label: 'مدفوعة', color: 'bg-green-100 text-green-800' },
  overdue: { label: 'متأخرة', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'ملغية', color: 'bg-orange-100 text-orange-800' }
}

const PAYMENT_METHOD_CONFIG: Record<string, { label: string }> = {
  cash: { label: 'نقدي' },
  card: { label: 'بطاقة' },
  insurance: { label: 'تأمين' },
  bank_transfer: { label: 'تحويل بنكي' },
  online: { label: 'دفع إلكتروني' }
}

export function InvoiceCard({ invoice, onClick, showActions = true }: InvoiceCardProps) {
  const { label, color } = STATUS_CONFIG[invoice.status] || { label: invoice.status, color: 'bg-gray-100 text-gray-800' }
  const paymentMethodLabel = invoice.paymentMethod ? PAYMENT_METHOD_CONFIG[invoice.paymentMethod]?.label || invoice.paymentMethod : null

  return (
    <Card 
      className={`hover:shadow-md transition-shadow cursor-pointer ${onClick ? 'hover:border-blue-300' : ''}`}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{invoice.invoiceNumber}</h3>
                <Badge className={color}>{label}</Badge>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{invoice.patientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(invoice.issueDate).toLocaleDateString('ar-SA')}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>الإجمالي: {parseFloat(invoice.totalAmount).toFixed(2)} ر.س</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className={parseFloat(invoice.balanceAmount) > 0 ? 'text-red-600' : 'text-green-600'}>
                  المتبقي: {parseFloat(invoice.balanceAmount).toFixed(2)} ر.س
                </span>
              </div>
              {paymentMethodLabel && (
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span>{paymentMethodLabel}</span>
                </div>
              )}
            </div>
          </div>
          
          {showActions && (
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <FileText className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
