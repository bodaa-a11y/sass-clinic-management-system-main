'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react'

interface Invoice {
  id: string
  invoiceNumber: string
  totalAmount: string
  paidAmount: string
  balanceAmount: string
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled'
  dueDate: string
  createdAt: string
}

interface InvoicesTabProps {
  invoices: Invoice[]
}

export function InvoicesTab({ invoices }: InvoicesTabProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA')
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: any }> = {
      pending: { variant: 'secondary', label: 'معلّق', icon: Clock },
      partial: { variant: 'outline', label: 'مدفوع جزئياً', icon: DollarSign },
      paid: { variant: 'default', label: 'مدفوع', icon: CheckCircle },
      overdue: { variant: 'destructive', label: 'متأخر', icon: XCircle },
      cancelled: { variant: 'secondary', label: 'ملغى', icon: XCircle },
    }
    const config = variants[status] || { variant: 'secondary', label: status, icon: FileText }
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const sortedInvoices = [...invoices].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const totalBalance = invoices.reduce((sum, invoice) => {
    return sum + parseFloat(invoice.balanceAmount || '0')
  }, 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">الفواتير</h3>
        <Card className="px-4 py-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-gray-500">إجمالي المستحق:</span>
            <span className="font-bold text-lg">{totalBalance.toFixed(2)}</span>
          </div>
        </Card>
      </div>

      {sortedInvoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>لا توجد فواتير لهذا المريض</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedInvoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{invoice.invoiceNumber}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">إجمالي:</span>
                        <span className="font-medium mr-2">{invoice.totalAmount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">مدفوع:</span>
                        <span className="font-medium mr-2 text-green-600">{invoice.paidAmount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">متبقي:</span>
                        <span className={`font-medium mr-2 ${parseFloat(invoice.balanceAmount) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {invoice.balanceAmount}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>تاريخ الاستحقاق: {formatDate(invoice.dueDate)}</span>
                      <span>•</span>
                      <span>تاريخ الإنشاء: {formatDate(invoice.createdAt)}</span>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(invoice.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
