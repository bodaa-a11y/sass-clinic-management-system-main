/**
 * Predictive Highlighting Component
 * تظليل البيانات التنبؤي - تظليل النتائج غير الطبيعية بألوان هادئة
 * يجذب انتباه الطبيب فوراً دون إزعاج
 */

'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp, Activity } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ReactNode } from 'react'

interface PredictiveHighlightProps {
  children: ReactNode
  variant?: 'warning' | 'alert' | 'info' | 'success'
  intensity?: 'low' | 'medium' | 'high'
  className?: string
  showIcon?: boolean
  message?: string
}

export function PredictiveHighlight({
  children,
  variant = 'warning',
  intensity = 'medium',
  className,
  showIcon = true,
  message,
}: PredictiveHighlightProps) {
  const variantConfig = {
    warning: {
      bgColor: 'bg-amber-warning/5',
      borderColor: 'border-amber-warning/20',
      textColor: 'text-amber-warning',
      icon: <AlertTriangle className="w-4 h-4" />,
      glowColor: 'rgba(245, 158, 11, 0.3)',
    },
    alert: {
      bgColor: 'bg-rose-error/5',
      borderColor: 'border-rose-error/20',
      textColor: 'text-rose-error',
      icon: <Activity className="w-4 h-4" />,
      glowColor: 'rgba(239, 68, 68, 0.3)',
    },
    info: {
      bgColor: 'bg-medical-blue/5',
      borderColor: 'border-medical-blue/20',
      textColor: 'text-medical-blue',
      icon: <TrendingUp className="w-4 h-4" />,
      glowColor: 'rgba(0, 102, 204, 0.3)',
    },
    success: {
      bgColor: 'bg-emerald-success/5',
      borderColor: 'border-emerald-success/20',
      textColor: 'text-emerald-success',
      icon: <Activity className="w-4 h-4" />,
      glowColor: 'rgba(16, 185, 129, 0.3)',
    },
  }

  const intensityConfig = {
    low: {
      borderWidth: '1px',
      glowIntensity: 0.3,
    },
    medium: {
      borderWidth: '2px',
      glowIntensity: 0.5,
    },
    high: {
      borderWidth: '3px',
      glowIntensity: 0.7,
    },
  }

  const config = variantConfig[variant]
  const intensitySettings = intensityConfig[intensity]

  return (
    <motion.div
      className={cn(
        'relative rounded-lg p-3 transition-all duration-300',
        config.bgColor,
        config.borderColor,
        className
      )}
      style={{
        borderWidth: intensitySettings.borderWidth,
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{
        scale: 1.02,
        boxShadow: `0 0 20px ${config.glowColor}`,
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          backgroundColor: config.glowColor,
          opacity: 0,
        }}
        animate={{
          opacity: [0, intensitySettings.glowIntensity * 0.3, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {showIcon && (
          <div className={cn('flex items-center gap-2 mb-1', config.textColor)}>
            {config.icon}
            {message && <span className="text-sm font-medium">{message}</span>}
          </div>
        )}
        {children}
      </div>
    </motion.div>
  )
}

// Anomaly Highlight - تظليل الشذوذ
interface AnomalyHighlightProps {
  value: string | number
  threshold?: number
  isAnomaly: boolean
  label: string
  className?: string
}

export function AnomalyHighlight({
  value,
  threshold,
  isAnomaly,
  label,
  className,
}: AnomalyHighlightProps) {
  if (!isAnomaly) {
    return (
      <div className={cn('p-3', className)}>
        <div className="text-slate-900 font-bold text-2xl">{value}</div>
        <div className="text-slate-600 text-sm mt-1">{label}</div>
      </div>
    )
  }

  return (
    <PredictiveHighlight variant="alert" intensity="high" className={className}>
      <div className="text-rose-error font-bold text-2xl">{value}</div>
      <div className="text-rose-error/80 text-sm mt-1">{label}</div>
      {threshold && (
        <div className="text-rose-error/60 text-xs mt-1">
          الحد الطبيعي: {threshold}
        </div>
      )}
    </PredictiveHighlight>
  )
}
