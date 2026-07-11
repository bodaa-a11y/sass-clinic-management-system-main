'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Printer, DollarSign, Calendar, FileText, Building2, Phone, Mail } from 'lucide-react'

interface ReceiptData {
  clinicName: string
  clinicPhone?: string
  clinicAddress?: string
  invoiceNumber: string
  invoiceDate: string
  patientName: string
  items: {
    description: string
    quantity: number
    unitPrice: string
    totalPrice: string
  }[]
  subtotal: string
  taxAmount: string
  discountAmount: string
  totalAmount: string
  paidAmount?: string
  balanceAmount?: string
  paymentMethod?: string
}

interface ReceiptPrinterProps {
  data: ReceiptData
  onClose: () => void
}

export function ReceiptPrinter({ data, onClose }: ReceiptPrinterProps) {
  const receiptRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '', 'width=400,height=600')
      if (printWindow) {
        printWindow.document.write(`
          <html dir="rtl">
          <head>
            <title>إيصال #${data.invoiceNumber}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                margin: 0;
                font-size: 14px;
                line-height: 1.6;
              }
              .receipt {
                max-width: 300px;
                margin: 0 auto;
                border: 1px solid #ddd;
                padding: 20px;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 2px dashed #333;
                padding-bottom: 15px;
              }
              .clinic-name {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .invoice-number {
                font-size: 12px;
                color: #666;
              }
              .section {
                margin-bottom: 15px;
              }
              .section-title {
                font-weight: bold;
                margin-bottom: 8px;
                border-bottom: 1px dashed #ccc;
                padding-bottom: 5px;
              }
              .item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                font-size: 13px;
              }
              .total {
                display: flex;
                justify-content: space-between;
                font-weight: bold;
                margin-top: 10px;
                padding-top: 10px;
                border-top: 2px dashed #333;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                padding-top: 15px;
                border-top: 2px dashed #333;
                font-size: 11px;
                color: #666;
              }
              .amount {
                font-family: monospace;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <div class="clinic-name">${data.clinicName}</div>
                ${data.clinicPhone ? `<div class="invoice-number">${data.clinicPhone}</div>` : ''}
                ${data.clinicAddress ? `<div class="invoice-number">${data.clinicAddress}</div>` : ''}
                <div class="invoice-number">إيصال #${data.invoiceNumber}</div>
                <div class="invoice-number">${data.invoiceDate}</div>
              </div>

              <div class="section">
                <div class="section-title">المريض</div>
                <div>${data.patientName}</div>
              </div>

              <div class="section">
                <div class="section-title">التفاصيل</div>
                ${data.items.map(item => `
                  <div class="item">
                    <span>${item.description} × ${item.quantity}</span>
                    <span class="amount">${item.totalPrice} ر.س</span>
                  </div>
                `).join('')}
              </div>

              <div class="section">
                <div class="item">
                  <span>المجموع الفرعي</span>
                  <span class="amount">${data.subtotal} ر.س</span>
                </div>
                ${parseFloat(data.taxAmount) > 0 ? `
                  <div class="item">
                    <span>الضريبة</span>
                    <span class="amount">${data.taxAmount} ر.س</span>
                  </div>
                ` : ''}
                ${parseFloat(data.discountAmount) > 0 ? `
                  <div class="item">
                    <span>الخصم</span>
                    <span class="amount">-${data.discountAmount} ر.س</span>
                  </div>
                ` : ''}
                <div class="total">
                  <span>الإجمالي</span>
                  <span class="amount">${data.totalAmount} ر.س</span>
                </div>
              </div>

              ${data.paidAmount ? `
                <div class="section">
                  <div class="section-title">الدفع</div>
                  <div class="item">
                    <span>المدفوع</span>
                    <span class="amount">${data.paidAmount} ر.س</span>
                  </div>
                  ${data.balanceAmount ? `
                    <div class="item">
                      <span>المتبقي</span>
                      <span class="amount">${data.balanceAmount} ر.س</span>
                    </div>
                  ` : ''}
                  ${data.paymentMethod ? `
                    <div class="item">
                      <span>طريقة الدفع</span>
                      <span>${data.paymentMethod}</span>
                    </div>
                  ` : ''}
                </div>
              ` : ''}

              <div class="footer">
                <div>شكراً لزيارتكم</div>
                <div>لأي استفسار، يرجى الاتصال بنا</div>
              </div>
            </div>
          </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div ref={receiptRef} className="max-w-md mx-auto bg-white p-6 border-2 border-dashed border-gray-300">
        {/* Header */}
        <div className="text-center mb-6 pb-4 border-b-2 border-dashed">
          <h2 className="text-xl font-bold mb-2">{data.clinicName}</h2>
          {data.clinicPhone && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-1">
              <Phone className="w-4 h-4" />
              <span>{data.clinicPhone}</span>
            </div>
          )}
          {data.clinicAddress && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Building2 className="w-4 h-4" />
              <span>{data.clinicAddress}</span>
            </div>
          )}
          <div className="text-sm text-gray-500 mt-2">إيصال #{data.invoiceNumber}</div>
          <div className="text-sm text-gray-500">{data.invoiceDate}</div>
        </div>

        {/* Patient Info */}
        <div className="mb-4 pb-4 border-b">
          <div className="font-bold mb-2">المريض</div>
          <div className="text-gray-700">{data.patientName}</div>
        </div>

        {/* Items */}
        <div className="mb-4 pb-4 border-b">
          <div className="font-bold mb-3">التفاصيل</div>
          {data.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm mb-2">
              <span>{item.description} × {item.quantity}</span>
              <span className="font-mono">{item.totalPrice} ر.س</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>المجموع الفرعي</span>
            <span className="font-mono">{data.subtotal} ر.س</span>
          </div>
          {parseFloat(data.taxAmount) > 0 && (
            <div className="flex justify-between">
              <span>الضريبة</span>
              <span className="font-mono">{data.taxAmount} ر.س</span>
            </div>
          )}
          {parseFloat(data.discountAmount) > 0 && (
            <div className="flex justify-between text-red-600">
              <span>الخصم</span>
              <span className="font-mono">-{data.discountAmount} ر.س</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t-2 border-dashed">
            <span>الإجمالي</span>
            <span className="font-mono">{data.totalAmount} ر.س</span>
          </div>
        </div>

        {/* Payment Info */}
        {data.paidAmount && (
          <div className="mt-4 pt-4 border-t">
            <div className="font-bold mb-3">الدفع</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>المدفوع</span>
                <span className="font-mono">{data.paidAmount} ر.س</span>
              </div>
              {data.balanceAmount && (
                <div className="flex justify-between">
                  <span>المتبقي</span>
                  <span className="font-mono">{data.balanceAmount} ر.س</span>
                </div>
              )}
              {data.paymentMethod && (
                <div className="flex justify-between">
                  <span>طريقة الدفع</span>
                  <span>{data.paymentMethod}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t-2 border-dashed text-xs text-gray-500">
          <div className="font-bold mb-1">شكراً لزيارتكم</div>
          <div>لأي استفسار، يرجى الاتصال بنا</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-2">
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="w-4 h-4" />
          طباعة الإيصال
        </Button>
        <Button variant="outline" onClick={onClose}>
          إغلاق
        </Button>
      </div>
    </div>
  )
}
