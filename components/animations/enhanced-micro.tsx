/**
 * Enhanced Micro-interactions Component
 * تفاعلات دقيقة محسّنة - تغييرات طفيفة عند الضغط أو التفاعل
 * تستخدم CSS transforms فقط للأداء العالي
 */

'use client'

import { motion, useMotionValue, useTransform, MotionValue } from 'framer-motion'
import { ReactNode, useRef } from 'react'
import { cn } from '@/lib/utils/cn'

// Magnetic Button - زر مغناطيسي ينجذب للمؤشر
interface MagneticButtonProps {
  children: ReactNode
  strength?: number
  className?: string
  onClick?: () => void
}

export function MagneticButton({ children, strength = 20, className, onClick }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) / strength)
    y.set((e.clientY - centerY) / strength)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={className}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {children}
    </motion.div>
  )
}

// Press Feedback - تغذية راجعة عند الضغط
interface PressFeedbackProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function PressFeedback({ children, className, onClick }: PressFeedbackProps) {
  return (
    <motion.button
      onClick={onClick}
      className={className}
      whileTap={{ scale: 0.95, opacity: 0.8 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.1 }}
    >
      {children}
    </motion.button>
  )
}

// Ripple Effect - تأثير موجي عند النقر
interface RippleEffectProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function RippleEffect({ children, className, onClick }: RippleEffectProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn('relative overflow-hidden', className)}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
    >
      {children}
    </motion.button>
  )
}

// Subtle Hover - تأثير hover خفيف
interface SubtleHoverProps {
  children: ReactNode
  className?: string
  scale?: number
  brightness?: number
}

export function SubtleHover({ children, className, scale = 1.02, brightness = 1.05 }: SubtleHoverProps) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale, filter: `brightness(${brightness})` }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

// Focus Ring - حلقة تركيز عند التركيز
interface FocusRingProps {
  children: ReactNode
  className?: string
  color?: string
}

export function FocusRing({ children, className, color = '#0066CC' }: FocusRingProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        initial={{ scale: 0, opacity: 0 }}
        whileFocus={{ scale: 1.5, opacity: 0.3 }}
        style={{ backgroundColor: color }}
        transition={{ duration: 0.3 }}
      />
    </div>
  )
}

// Tilt Effect - تأثير إمالة 3D
interface TiltEffectProps {
  children: ReactNode
  className?: string
  maxRotate?: number
}

export function TiltEffect({ children, className, maxRotate = 5 }: TiltEffectProps) {
  const ref = useRef<HTMLDivElement>(null)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    rotateY.set(((e.clientX - centerX) / rect.width) * maxRotate)
    rotateX.set(-((e.clientY - centerY) / rect.height) * maxRotate)
  }

  const handleMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  )
}
