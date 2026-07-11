/**
 * AI Status Component
 * مؤشر حالة AI - Visual feedback for AI operations
 * Breathing/pulse effect
 */

'use client'

import { motion } from 'framer-motion'
import { Sparkles, Brain, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface AIStatusProps {
  status: 'idle' | 'listening' | 'processing' | 'speaking' | 'success' | 'error'
  message?: string
  className?: string
  compact?: boolean
}

export function AIStatus({ status, message, className, compact = false }: AIStatusProps) {
  const statusConfig = {
    idle: {
      icon: <Brain className="w-5 h-5" />,
      color: 'text-slate-400',
      bgColor: 'bg-slate-100',
      pulse: false,
    },
    listening: {
      icon: <Loader2 className="w-5 h-5 animate-spin" />,
      color: 'text-medical-blue',
      bgColor: 'bg-medical-blue/10',
      pulse: true,
    },
    processing: {
      icon: <Brain className="w-5 h-5 animate-pulse" />,
      color: 'text-teal-secondary',
      bgColor: 'bg-teal-secondary/10',
      pulse: true,
    },
    speaking: {
      icon: <Sparkles className="w-5 h-5" />,
      color: 'text-emerald-success',
      bgColor: 'bg-emerald-success/10',
      pulse: true,
    },
    success: {
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-emerald-success',
      bgColor: 'bg-emerald-success/10',
      pulse: false,
    },
    error: {
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'text-rose-error',
      bgColor: 'bg-rose-error/10',
      pulse: true,
    },
  }

  const config = statusConfig[status]

  if (compact) {
    return (
      <motion.div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full',
          config.bgColor,
          className
        )}
        animate={config.pulse ? {
          opacity: [1, 0.7, 1],
        } : {}}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <span className={cn(config.color)}>{config.icon}</span>
        {message && <span className="text-xs text-slate-600">{message}</span>}
      </motion.div>
    )
  }

  return (
    <motion.div
      className={cn(
        'flex items-center gap-3 p-4 rounded-xl',
        config.bgColor,
        className
      )}
      animate={config.pulse ? {
        opacity: [1, 0.8, 1],
        scale: [1, 1.02, 1],
      } : {}}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <div className={cn('p-2 rounded-full', config.bgColor)}>
        <span className={cn(config.color)}>{config.icon}</span>
      </div>
      <div className="flex-1">
        <p className={cn('font-medium', config.color)}>
          {status === 'idle' && 'AI جاهز'}
          {status === 'listening' && 'جاري الاستماع...'}
          {status === 'processing' && 'جاري المعالجة...'}
          {status === 'speaking' && 'جاري التحدث...'}
          {status === 'success' && 'تم بنجاح'}
          {status === 'error' && 'حدث خطأ'}
        </p>
        {message && <p className="text-sm text-slate-600 mt-1">{message}</p>}
      </div>

      {/* Breathing indicator */}
      {config.pulse && (
        <motion.div
          className="w-2 h-2 rounded-full bg-current"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ color: config.color.replace('text-', '') }}
        />
      )}
    </motion.div>
  )
}

// AI Progress Bar - شريط تقدم AI
interface AIProgressProps {
  progress: number
  status?: string
  className?: string
}

export function AIProgress({ progress, status, className }: AIProgressProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600">{status || 'جاري المعالجة...'}</span>
        <span className="text-slate-900 font-medium">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-medical-blue to-teal-secondary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  )
}
