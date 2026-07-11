/**
 * Loading States Component
 * حالات التحميل المحسّنة مع animations
 */

'use client'

import { motion } from 'framer-motion'
import { Loader2, Circle } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: number
  className?: string
}

export function LoadingSpinner({ size = 24, className }: LoadingSpinnerProps) {
  return (
    <Loader2
      className={`animate-spin text-medical-blue ${className}`}
      size={size}
    />
  )
}

interface LoadingDotsProps {
  className?: string
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={`flex gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-medical-blue rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  )
}

interface LoadingBarProps {
  progress?: number
  className?: string
}

export function LoadingBar({ progress = 0, className }: LoadingBarProps) {
  return (
    <div className={`h-2 bg-slate-200 rounded-full overflow-hidden ${className}`}>
      <motion.div
        className="h-full bg-medical-blue rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  )
}

interface LoadingPulseProps {
  className?: string
}

export function LoadingPulse({ className }: LoadingPulseProps) {
  return (
    <motion.div
      className={`bg-slate-200 rounded-lg ${className}`}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

interface SkeletonCardProps {
  className?: string
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-4 ${className}`}>
      <div className="flex items-start gap-4">
        <LoadingPulse className="w-12 h-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <LoadingPulse className="h-4 w-3/4" />
          <LoadingPulse className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}

interface SkeletonListProps {
  count?: number
  className?: string
}

export function SkeletonList({ count = 5, className }: SkeletonListProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

interface LoadingOverlayProps {
  message?: string
  className?: string
}

export function LoadingOverlay({ message = 'جاري التحميل...', className }: LoadingOverlayProps) {
  return (
    <div className={`fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 ${className}`}>
      <LoadingSpinner size={48} />
      <motion.p
        className="mt-4 text-slate-600"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {message}
      </motion.p>
    </div>
  )
}

interface SuccessAnimationProps {
  onComplete?: () => void
  className?: string
}

export function SuccessAnimation({ onComplete, className }: SuccessAnimationProps) {
  return (
    <motion.div
      className={`flex items-center justify-center ${className}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
      onAnimationComplete={onComplete}
    >
      <motion.div
        className="w-16 h-16 bg-emerald-success rounded-full flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <motion.svg
          className="w-8 h-8 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.path d="M20 6L9 17l-5-5" />
        </motion.svg>
      </motion.div>
    </motion.div>
  )
}

interface ErrorAnimationProps {
  onComplete?: () => void
  className?: string
}

export function ErrorAnimation({ onComplete, className }: ErrorAnimationProps) {
  return (
    <motion.div
      className={`flex items-center justify-center ${className}`}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
      onAnimationComplete={onComplete}
    >
      <motion.div
        className="w-16 h-16 bg-rose-error rounded-full flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <motion.div
          className="w-8 h-1 bg-white rounded-full"
          initial={{ rotate: 45 }}
          animate={{ rotate: 45 }}
        />
        <motion.div
          className="w-8 h-1 bg-white rounded-full absolute"
          initial={{ rotate: -45 }}
          animate={{ rotate: -45 }}
        />
      </motion.div>
    </motion.div>
  )
}
