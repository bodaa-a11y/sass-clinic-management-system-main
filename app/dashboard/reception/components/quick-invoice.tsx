'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button-redesigned'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-redesigned'
import { Input } from '@/components/ui/input-redesigned'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { DollarSign, Plus, Check, X, Printer, Download } from 'lucide-react'
import { SlideIn } from '@/components/animations/feedback-animations'

interface QuickInvoiceProps {
  patientName: string
  patientId: string
  appointmentId: string
  onCreate: (data: any) => void
  onCancel: () => void
}

export function QuickInvoice({ patientName, patientId, appointmentId, onCreate, onCancel }: QuickInvoiceProps) {
  const [formData, setFormData] = useState({
    amount: '',
    items: [{ name: 'استشارة طبية', price: '' }],
    discount: '0',
    tax: '0',
    notes: ''
  })

  const calculateTotal = () => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
    const discount = parseFloat(formData.discount) || 0
    const tax = parseFloat(formData.tax) || 0
    return itemsTotal - discount + tax
  }

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', price: '' }]
    })
  }

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData({ ...formData, items: newItems })
  }

  const handleSubmit = () => {
    const total = calculateTotal()
    onCreate({
      patientId,
      patientName,
      appointmentId,
      items: formData.items,
      discount: formData.discount,
      tax: formData.tax,
      total: total.toString(),
      notes: formData.notes
    })
    toast.success('تم إنشاء الفاتورة بنجاح')
  }

  return (
    <SlideIn direction="up">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            إنشاء فاتورة سريعة
          </CardTitle>
          <p className="text-sm text-gray-500">للمريض: {patientName}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Items */}
          <div className="space-y-3">
            <Label>العناصر</Label>
            {formData.items.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="اسم الخدمة"
                  value={item.name}
                  onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="السعر"
                  value={item.price}
                  onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                  className="w-32"
                />
                {formData.items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="w-full"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة عنصر
            </Button>
          </div>

          {/* Discount & Tax */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount">الخصم</Label>
              <Input
                id="discount"
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="tax">الضريبة</Label>
              <Input
                id="tax"
                type="number"
                value={formData.tax}
                onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">ملاحظات</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="أي ملاحظات إضافية..."
            />
          </div>

          {/* Total */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">الإجمالي</span>
              <span className="text-2xl font-bold text-blue-600">
                {calculateTotal().toFixed(2)} ر.س
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              <X className="w-4 h-4 ml-2" />
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
            >
              <Check className="w-4 h-4 ml-2" />
              إنشاء الفاتورة
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" size="sm" className="flex-1">
              <Printer className="w-4 h-4 ml-2" />
              طباعة
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Download className="w-4 h-4 ml-2" />
              تحميل PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </SlideIn>
  )
}
