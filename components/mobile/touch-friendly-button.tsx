/**
 * Touch-Friendly Button Component
 * زر محسّن للموبايل مع touch feedback
 * الحد الأدنى 44x44px لمعايير accessibility
 */

'use client'

import { Button } from '@/components/ui/button-redesigned'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface TouchFriendlyButtonProps {
  children: ReactNode
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link' | 'accent'
  className?: string
  disabled?: boolean
}

export function TouchFriendlyButton({
  children,
  onClick,
  size = 'md',
  variant = 'default',
  className,
  disabled,
}: TouchFriendlyButtonProps) {
  const sizeClasses = {
    sm: 'min-h-[44px] min-w-[44px] px-4',
    md: 'min-h-[48px] min-w-[48px] px-6',
    lg: 'min-h-[52px] min-w-[52px] px-8',
  }

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      transition={{ duration: 0.1 }}
    >
      <Button
        onClick={onClick}
        variant={variant}
        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
        className={`${sizeClasses[size]} ${className}`}
        disabled={disabled}
      >
        {children}
      </Button>
    </motion.div>
  )
}
