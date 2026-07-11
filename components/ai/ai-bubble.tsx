/**
 * Ambient AI Bubble Component
 * المساعد العائم - أيقونة صغيرة تتفاعل بصرياً عند الاستماع للمريض
 * تعطي إشارة بأن التدوين التلقائي يعمل بنجاح
 */

'use client'

import { motion } from 'framer-motion'
import { Mic, MicOff, Brain, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface AIBubbleProps {
  state: 'idle' | 'listening' | 'processing' | 'speaking'
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function AIBubble({ state, className, size = 'md' }: AIBubbleProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  }

  const iconSize = {
    sm: 16,
    md: 24,
    lg: 28,
  }

  const stateColors = {
    idle: 'bg-slate-100 text-slate-600',
    listening: 'bg-medical-blue text-white',
    processing: 'bg-teal-secondary text-white',
    speaking: 'bg-emerald-success text-white',
  }

  const pulseAnimation = state === 'listening' || state === 'speaking'

  return (
    <motion.div
      className={cn(
        'rounded-full flex items-center justify-center relative',
        sizeClasses[size],
        stateColors[state],
        className
      )}
      animate={pulseAnimation ? {
        scale: [1, 1.1, 1],
        boxShadow: state === 'listening'
          ? ['0 0 0 0 rgba(0, 102, 204, 0.4)', '0 0 0 20px rgba(0, 102, 204, 0)']
          : ['0 0 0 0 rgba(16, 185, 129, 0.4)', '0 0 0 20px rgba(16, 185, 129, 0)'],
      } : {}}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {state === 'idle' && <Mic size={iconSize[size]} />}
      {state === 'listening' && <Mic size={iconSize[size]} />}
      {state === 'processing' && <Brain size={iconSize[size]} className="animate-pulse" />}
      {state === 'speaking' && <Sparkles size={iconSize[size]} />}

      {/* Pulse rings for listening state */}
      {state === 'listening' && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full bg-medical-blue opacity-30"
            animate={{
              scale: [1, 1.5, 2],
              opacity: [0.3, 0.1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-medical-blue opacity-20"
            animate={{
              scale: [1, 1.3, 1.6],
              opacity: [0.2, 0.1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.5,
            }}
          />
        </>
      )}

      {/* Processing animation */}
      {state === 'processing' && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-teal-secondary border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </motion.div>
  )
}

// AI Status Indicator - مؤشر حالة AI
interface AIStatusProps {
  status: 'active' | 'inactive' | 'error'
  message?: string
  className?: string
}

export function AIStatus({ status, message, className }: AIStatusProps) {
  const statusConfig = {
    active: {
      color: 'bg-emerald-success',
      icon: <Sparkles className="w-3 h-3" />,
      text: 'AI نشط',
    },
    inactive: {
      color: 'bg-slate-400',
      icon: null,
      text: 'AI غير نشط',
    },
    error: {
      color: 'bg-rose-error',
      icon: null,
      text: 'خطأ في AI',
    },
  }

  const config = statusConfig[status]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('w-2 h-2 rounded-full', config.color)} />
      <span className="text-xs text-slate-600">{config.text}</span>
      {message && <span className="text-xs text-slate-500">- {message}</span>}
    </div>
  )
}
