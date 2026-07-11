'use client'

import { Check, Clock, User, Activity, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PatientProgressStepperProps {
  status: 'pending' | 'confirmed' | 'in-waiting-room' | 'in-progress' | 'done' | 'cancelled' | 'no-show'
  size?: 'sm' | 'md' | 'lg'
}

const STEPS = [
  { key: 'pending', label: 'جديد', icon: Clock },
  { key: 'confirmed', label: 'مؤكد', icon: Check },
  { key: 'in-waiting-room', label: 'في الانتظار', icon: User },
  { key: 'in-progress', label: 'في الكشف', icon: Activity },
  { key: 'done', label: 'منجز', icon: FileText },
]

const STATUS_ORDER = ['pending', 'confirmed', 'in-waiting-room', 'in-progress', 'done']

export function PatientProgressStepper({ status, size = 'md' }: PatientProgressStepperProps) {
  const currentIndex = STATUS_ORDER.indexOf(status)

  const sizeClasses = {
    sm: {
      icon: 'w-4 h-4',
      text: 'text-xs',
      gap: 'gap-2',
      padding: 'p-2',
    },
    md: {
      icon: 'w-5 h-5',
      text: 'text-sm',
      gap: 'gap-3',
      padding: 'p-3',
    },
    lg: {
      icon: 'w-6 h-6',
      text: 'text-base',
      gap: 'gap-4',
      padding: 'p-4',
    },
  }

  const classes = sizeClasses[size]

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'active'
    return 'pending'
  }

  const getStepColor = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return 'bg-green-600 text-white border-green-600 shadow-lg'
      case 'active':
        return 'bg-blue-600 text-white border-blue-600 shadow-xl ring-4 ring-blue-200'
      default:
        return 'bg-gray-100 text-gray-400 border-gray-300'
    }
  }

  const isCancelledOrNoShow = status === 'cancelled' || status === 'no-show'

  return (
    <div className="flex items-center" dir="rtl">
      {isCancelledOrNoShow ? (
        <Badge variant="destructive" className={classes.text}>
          {status === 'cancelled' ? 'ملغي' : 'عدم حضور'}
        </Badge>
      ) : (
        <div className={`flex items-center ${classes.gap}`}>
          {STEPS.map((step, index) => {
            const stepStatus = getStepStatus(index)
            const Icon = step.icon
            const colorClass = getStepColor(stepStatus)

            return (
              <div key={step.key} className="flex items-center">
                <div
                  className={`flex items-center ${classes.padding} rounded-full border-2 ${colorClass} ${classes.gap}`}
                >
                  <Icon className={classes.icon} />
                  <span className={classes.text}>{step.label}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-1 ${
                      stepStatus === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
