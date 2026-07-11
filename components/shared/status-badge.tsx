'use client'

import { Badge } from '@/components/ui/badge'
import { Check, Clock, X, AlertCircle, FileText, Calendar, DollarSign } from 'lucide-react'

interface StatusBadgeProps {
  status: string
  type?: 'appointment' | 'invoice' | 'payment' | 'default'
  showIcon?: boolean
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon?: React.ReactNode }> = {
  // Appointment statuses
  pending: { label: 'جديد', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" /> },
  confirmed: { label: 'مؤكد', color: 'bg-green-100 text-green-800', icon: <Check className="w-3 h-3" /> },
  'in-waiting-room': { label: 'في الانتظار', color: 'bg-orange-100 text-orange-800', icon: <Clock className="w-3 h-3" /> },
  'in-progress': { label: 'في الكشف', color: 'bg-purple-100 text-purple-800', icon: <Calendar className="w-3 h-3" /> },
  done: { label: 'منجز', color: 'bg-blue-100 text-blue-800', icon: <Check className="w-3 h-3" /> },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-800', icon: <X className="w-3 h-3" /> },
  'no-show': { label: 'عدم حضور', color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="w-3 h-3" /> },
  
  // Invoice statuses
  draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-800', icon: <FileText className="w-3 h-3" /> },
  sent: { label: 'مرسلة', color: 'bg-blue-100 text-blue-800', icon: <FileText className="w-3 h-3" /> },
  paid: { label: 'مدفوعة', color: 'bg-green-100 text-green-800', icon: <DollarSign className="w-3 h-3" /> },
  overdue: { label: 'متأخرة', color: 'bg-red-100 text-red-800', icon: <AlertCircle className="w-3 h-3" /> },
  // cancelled is shared with appointments
  
  // Payment statuses
  payment_pending: { label: 'معلق', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" /> },
  completed: { label: 'مكتمل', color: 'bg-green-100 text-green-800', icon: <Check className="w-3 h-3" /> },
  failed: { label: 'فشل', color: 'bg-red-100 text-red-800', icon: <X className="w-3 h-3" /> },
  
  // Default
  active: { label: 'نشط', color: 'bg-green-100 text-green-800', icon: <Check className="w-3 h-3" /> },
  inactive: { label: 'غير نشط', color: 'bg-gray-100 text-gray-800', icon: <X className="w-3 h-3" /> },
}

export function StatusBadge({ status, type = 'default', showIcon = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { 
    label: status, 
    color: 'bg-gray-100 text-gray-800',
    icon: null
  }

  return (
    <Badge className={config.color}>
      {showIcon && config.icon && (
        <span className="ml-1">{config.icon}</span>
      )}
      {config.label}
    </Badge>
  )
}
