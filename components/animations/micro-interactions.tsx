/**
 * Micro-interactions Component
 * حركات تفاعلية دقيقة مثل Oracle Health و Healthie
 */

'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface HoverScaleProps {
  children: ReactNode
  scale?: number
  className?: string
}

export function HoverScale({ children, scale = 1.02, className }: HoverScaleProps) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface HoverLiftProps {
  children: ReactNode
  y?: number
  className?: string
}

export function HoverLift({ children, y = -4, className }: HoverLiftProps) {
  return (
    <motion.div
      whileHover={{ y }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface HoverBrightnessProps {
  children: ReactNode
  brightness?: number
  className?: string
}

export function HoverBrightness({ children, brightness = 1.05, className }: HoverBrightnessProps) {
  return (
    <motion.div
      whileHover={{ filter: `brightness(${brightness})` }}
      transition={{ duration: 0.15 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface RippleButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
}

export function RippleButton({ children, onClick, className }: RippleButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      className={className}
    >
      {children}
    </motion.button>
  )
}

interface ShimmerProps {
  children: ReactNode
  className?: string
}

export function Shimmer({ children, className }: ShimmerProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

interface PulseDotProps {
  className?: string
  color?: string
}

export function PulseDot({ className, color = '#EF4444' }: PulseDotProps) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color }}
        initial={{ scale: 1, opacity: 0.5 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </div>
  )
}

interface BounceProps {
  children: ReactNode
  className?: string
}

export function Bounce({ children, className }: BounceProps) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface ShakeProps {
  children: ReactNode
  trigger?: boolean
  className?: string
}

export function Shake({ children, trigger = false, className }: ShakeProps) {
  return (
    <motion.div
      animate={trigger ? {
        x: [0, -10, 10, -10, 10, 0],
      } : {}}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
