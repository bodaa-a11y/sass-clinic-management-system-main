/**
 * Mobile Card Component
* بطاقة محسّنة للموبايل مع touch feedback
*/

'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card-redesigned'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface MobileCardProps {
  children: ReactNode
  title?: string
  description?: string
  onClick?: () => void
  className?: string
  active?: boolean
}

export function MobileCard({
  children,
  title,
  description,
  onClick,
  className,
  active,
}: MobileCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
    >
      <Card
        onClick={onClick}
        className={cn(
          'cursor-pointer transition-all',
          active && 'border-medical-blue shadow-md',
          onClick && 'active:scale-98',
          className
        )}
      >
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle className="text-lg">{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  )
}

interface MobileSwipeCardProps {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
}

export function MobileSwipeCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
}: MobileSwipeCardProps) {
  return (
    <motion.div
      className={className}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(event, info) => {
        if (info.offset.x > 100 && onSwipeRight) {
          onSwipeRight()
        } else if (info.offset.x < -100 && onSwipeLeft) {
          onSwipeLeft()
        }
      }}
    >
      {children}
    </motion.div>
  )
}
