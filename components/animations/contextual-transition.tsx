/**
 * Contextual Transition Component
 * الانتقالات الذكية - توسع البطاقة لتملأ الشاشة
 * يستخدم FLIP technique للحركات السلسة
 */

'use client'

import { ReactNode, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface ContextualTransitionProps {
  children: ReactNode
  isExpanded: boolean
  onExpand?: () => void
  onCollapse?: () => void
  className?: string
  expandedContent?: ReactNode
}

export function ContextualTransition({
  children,
  isExpanded,
  onExpand,
  onCollapse,
  className,
  expandedContent,
}: ContextualTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <AnimatePresence mode="wait">
      {!isExpanded ? (
        <motion.div
          ref={containerRef}
          layout
          onClick={onExpand}
          className={cn('cursor-pointer', className)}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          {children}
        </motion.div>
      ) : (
        <motion.div
          ref={containerRef}
          layout
          onClick={onCollapse}
          className={cn('fixed inset-0 z-50 bg-white', className)}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          {expandedContent || children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Card Expansion Animation
interface CardExpansionProps {
  children: ReactNode
  isExpanded: boolean
  className?: string
}

export function CardExpansion({ children, isExpanded, className }: CardExpansionProps) {
  return (
    <motion.div
      layout
      className={cn('overflow-hidden', className)}
      initial={false}
      animate={{
        height: isExpanded ? 'auto' : '0',
        opacity: isExpanded ? 1 : 0,
      }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      {children}
    </motion.div>
  )
}

// Smooth Expand/Collapse
interface SmoothExpandProps {
  children: ReactNode
  isOpen: boolean
  className?: string
}

export function SmoothExpand({ children, isOpen, className }: SmoothExpandProps) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className={cn('overflow-hidden', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Shared Element Transition
interface SharedElementProps {
  children: ReactNode
  layoutId: string
  className?: string
}

export function SharedElement({ children, layoutId, className }: SharedElementProps) {
  return (
    <motion.div
      layoutId={layoutId}
      className={className}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}
