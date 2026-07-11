'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button-redesigned'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Badge } from '@/components/ui/badge-redesigned'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input-redesigned'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { DollarSign, Plus, Download, Search, Printer } from 'lucide-react'
import { SlideIn } from '@/components/animations/feedback-animations'
import { HoverScale } from '@/components/animations/micro-interactions'

interface Invoice {
  id: string
  patientId: string
  patientName: string
  totalAmount: string
  status: 'pending' | 'paid' | 'overdue'
  dueDate: string
}

interface InvoicesTabProps {
  invoices: Invoice[]
  onCreate: (data: any) => void
}

export function InvoicesTab({ invoices, onCreate }: InvoicesTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [invoiceForm, setInvoiceForm] = useState({
    patientId: '',
    patientName: '',
    amount: '',
    dueDate: ''
  })

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.patientName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      'pending': { label: 'معلقة', className: 'bg-yellow-100 text-yellow-700' },
      'paid': { label: 'مدفوعة', className: 'bg-green-100 text-green-700' },
      'overdue': { label: 'متأخرة', className: 'bg-red-100 text-red-700' }
    }
    const config = statusMap[status] || statusMap['pending']
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate(invoiceForm)
    setInvoiceForm({ patientId: '', patientName: '', amount: '', dueDate: '' })
    setIsDialogOpen(false)
    toast.success('تم إنشاء الفاتورة بنجاح')
  }

  return (
    <SlideIn direction="up" delay={0.3}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة الفواتير</h2>
            <p className="text-sm text-gray-500 mt-1">إنشاء وإدارة الفواتير</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <HoverScale>
                <Button>
                  <Plus className="w-4 h-4 ml-2" />
                  فاتورة جديدة
                </Button>
              </HoverScale>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إنشاء فاتورة جديدة</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="patientName">اسم المريض</Label>
                  <Input
                    id="patientName"
                    value={invoiceForm.patientName}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, patientName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">المبلغ</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">تاريخ الاستحقاق</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">إنشاء الفاتورة</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="بحث عن فاتورة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="pending">معلقة</SelectItem>
              <SelectItem value="paid">مدفوعة</SelectItem>
              <SelectItem value="overdue">متأخرة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoices List */}
        <div className="grid gap-4">
          {filteredInvoices.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">لا توجد فواتير</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredInvoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{invoice.patientName}</h3>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>{invoice.totalAmount}</span>
                        </div>
                        <div>تاريخ الاستحقاق: {invoice.dueDate}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Printer className="w-4 h-4 ml-1" />
                        طباعة
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 ml-1" />
                        تحميل
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </SlideIn>
  )
}
