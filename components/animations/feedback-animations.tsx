/**
 * Feedback Animations Component
 * حركات التغذية الراجعة للنجاح والخطأ
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, AlertTriangle, Info } from 'lucide-react'
import { ReactNode } from 'react'

interface SuccessToastProps {
  message: string
  visible: boolean
  onClose?: () => void
  className?: string
}

export function SuccessToast({ message, visible, onClose, className }: SuccessToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`fixed bottom-4 right-4 bg-emerald-success text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50 ${className}`}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
          >
            <Check className="w-5 h-5" />
          </motion.div>
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface ErrorToastProps {
  message: string
  visible: boolean
  onClose?: () => void
  className?: string
}

export function ErrorToast({ message, visible, onClose, className }: ErrorToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`fixed bottom-4 right-4 bg-rose-error text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50 ${className}`}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: 'spring' }}
          >
            <X className="w-5 h-5" />
          </motion.div>
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface WarningToastProps {
  message: string
  visible: boolean
  onClose?: () => void
  className?: string
}

export function WarningToast({ message, visible, onClose, className }: WarningToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`fixed bottom-4 right-4 bg-amber-warning text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50 ${className}`}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
          >
            <AlertTriangle className="w-5 h-5" />
          </motion.div>
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface InfoToastProps {
  message: string
  visible: boolean
  onClose?: () => void
  className?: string
}

export function InfoToast({ message, visible, onClose, className }: InfoToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`fixed bottom-4 right-4 bg-medical-blue text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50 ${className}`}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
          >
            <Info className="w-5 h-5" />
          </motion.div>
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface ConfettiProps {
  trigger: boolean
  onComplete?: () => void
  className?: string
}

export function Confetti({ trigger, onComplete, className }: ConfettiProps) {
  if (!trigger) return null

  const colors = ['#0066CC', '#00A896', '#FF6B6B', '#10B981', '#F59E0B']

  return (
    <div className={`fixed inset-0 pointer-events-none z-50 ${className}`}>
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: '-10px',
          }}
          initial={{ y: -10, opacity: 1 }}
          animate={{
            y: window.innerHeight + 10,
            x: (Math.random() - 0.5) * 200,
            opacity: 0,
            rotate: Math.random() * 360,
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: Math.random() * 0.5,
            ease: 'easeOut',
          }}
          onAnimationComplete={onComplete}
        />
      ))}
    </div>
  )
}

interface ShakeAnimationProps {
  children: ReactNode
  trigger: boolean
  className?: string
}

export function ShakeAnimation({ children, trigger, className }: ShakeAnimationProps) {
  return (
    <motion.div
      animate={trigger ? {
        x: [0, -10, 10, -10, 10, -5, 5, 0],
      } : {}}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface PulseAnimationProps {
  children: ReactNode
  trigger?: boolean
  className?: string
}

export function PulseAnimation({ children, trigger = true, className }: PulseAnimationProps) {
  return (
    <motion.div
      animate={trigger ? {
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
      } : {}}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface BounceInProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function BounceIn({ children, delay = 0, className }: BounceInProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface SlideInProps {
  children: ReactNode
  direction?: 'left' | 'right' | 'up' | 'down'
  delay?: number
  className?: string
}

export function SlideIn({
  children,
  direction = 'right',
  delay = 0,
  className,
}: SlideInProps) {
  const initialOffset = {
    left: { x: -100 },
    right: { x: 100 },
    up: { y: 100 },
    down: { y: -100 },
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...initialOffset[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
