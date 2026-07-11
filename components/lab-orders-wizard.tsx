'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, FlaskConical, X } from 'lucide-react'

interface LabOrder {
  testName: string
  testType: string
  urgency: 'routine' | 'urgent' | 'stat'
  notes?: string
}

interface LabOrdersWizardProps {
  onAddOrders: (orders: LabOrder[]) => void
  onCancel: () => void
}

export function LabOrdersWizard({ onAddOrders, onCancel }: LabOrdersWizardProps) {
  const [orders, setOrders] = useState<LabOrder[]>([])
  const [currentOrder, setCurrentOrder] = useState<LabOrder>({
    testName: '',
    testType: 'blood',
    urgency: 'routine',
    notes: ''
  })

  const handleAddOrder = () => {
    if (!currentOrder.testName.trim()) return

    setOrders([...orders, { ...currentOrder }])
    setCurrentOrder({
      testName: '',
      testType: 'blood',
      urgency: 'routine',
      notes: ''
    })
  }

  const handleRemoveOrder = (index: number) => {
    setOrders(orders.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (orders.length === 0) return
    onAddOrders(orders)
  }

  const TEST_TYPES = [
    { value: 'blood', label: 'تحليل دم' },
    { value: 'urine', label: 'تحليل بول' },
    { value: 'xray', label: 'أشعة سينية' },
    { value: 'ct', label: 'CT Scan' },
    { value: 'mri', label: 'MRI' },
    { value: 'ultrasound', label: 'سونار' },
    { value: 'ecg', label: 'تخطيط قلب' },
    { value: 'other', label: 'أخرى' }
  ]

  const URGENCY_LEVELS = [
    { value: 'routine', label: 'روتيني', color: 'bg-blue-100 text-blue-800' },
    { value: 'urgent', label: 'عاجل', color: 'bg-orange-100 text-orange-800' },
    { value: 'stat', label: 'فوري', color: 'bg-red-100 text-red-800' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5" />
          طلب فحوصات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Order Form */}
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label htmlFor="testName">اسم الفحص *</Label>
            <Input
              id="testName"
              value={currentOrder.testName}
              onChange={(e) => setCurrentOrder({ ...currentOrder, testName: e.target.value })}
              placeholder="مثال: CBC، صورة صدر"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="testType">نوع الفحص</Label>
              <Select
                value={currentOrder.testType}
                onValueChange={(value) => setCurrentOrder({ ...currentOrder, testType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEST_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="urgency">الأولوية</Label>
              <Select
                value={currentOrder.urgency}
                onValueChange={(value) => setCurrentOrder({ ...currentOrder, urgency: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {URGENCY_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              value={currentOrder.notes}
              onChange={(e) => setCurrentOrder({ ...currentOrder, notes: e.target.value })}
              placeholder="تعليمات إضافية للفحص"
              rows={2}
            />
          </div>

          <Button
            type="button"
            onClick={handleAddOrder}
            disabled={!currentOrder.testName.trim()}
            className="w-full"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة الفحص
          </Button>
        </div>

        {/* Orders List */}
        {orders.length > 0 && (
          <div className="space-y-2">
            <Label>الفحوصات المطلوبة</Label>
            {orders.map((order, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{order.testName}</span>
                      <Badge className={URGENCY_LEVELS.find(l => l.value === order.urgency)?.color}>
                        {URGENCY_LEVELS.find(l => l.value === order.urgency)?.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {TEST_TYPES.find(t => t.value === order.testType)?.label}
                    </p>
                    {order.notes && (
                      <p className="text-sm text-gray-500">{order.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveOrder(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 ml-2" />
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={orders.length === 0}
          >
            <FlaskConical className="w-4 h-4 ml-2" />
            إرسال الطلبات
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
