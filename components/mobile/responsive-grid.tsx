/**
 * Responsive Grid Component
* شبكة متجاوبة تتكيف مع جميع أحجام الشاشات
 */

'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface ResponsiveGridProps {
  children: ReactNode
  cols?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  gap?: number
  className?: string
}

export function ResponsiveGrid({
  children,
  cols = { xs: 1, sm: 2, md: 2, lg: 3, xl: 4, '2xl': 4 },
  gap = 4,
  className,
}: ResponsiveGridProps) {
  const gridCols = {
    xs: `grid-cols-${cols.xs || 1}`,
    sm: `sm:grid-cols-${cols.sm || 2}`,
    md: `md:grid-cols-${cols.md || 2}`,
    lg: `lg:grid-cols-${cols.lg || 3}`,
    xl: `xl:grid-cols-${cols.xl || 4}`,
    '2xl': `'2xl':grid-cols-${cols['2xl'] || 4}`,
  }

  return (
    <div
      className={cn(
        'grid',
        gridCols.xs,
        gridCols.sm,
        gridCols.md,
        gridCols.lg,
        gridCols.xl,
        `gap-${gap}`,
        className
      )}
    >
      {children}
    </div>
  )
}

interface ResponsiveCardProps {
  children: ReactNode
  className?: string
}

export function ResponsiveCard({ children, className }: ResponsiveCardProps) {
  return (
    <div
      className={cn(
        'w-full',
        'xs:w-full',
        'sm:w-[calc(50%-theme(spacing.2))]',
        'md:w-[calc(50%-theme(spacing.2))]',
        'lg:w-[calc(33.333%-theme(spacing.2))]',
        'xl:w-[calc(25%-theme(spacing.2))]',
        className
      )}
    >
      {children}
    </div>
  )
}
