/**
 * Bento Grid Component
 * شبكات البينتو - تقسيم الشاشة إلى مربعات ومستطيلات ذات حواف مستديرة
 * مستوحى من تصميم Apple و Notion
 */

'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export interface BentoGridItem {
  id: string
  content: ReactNode
  size?: 'small' | 'medium' | 'large' | 'wide' | 'tall'
  colSpan?: number
  rowSpan?: number
  className?: string
}

interface BentoGridProps {
  items: BentoGridItem[]
  className?: string
  gap?: number
}

export function BentoGrid({ items, className, gap = 4 }: BentoGridProps) {
  return (
    <div className={cn('grid auto-rows-[180px]', className)} style={{ gap: `${gap * 0.25}rem` }}>
      {items.map((item) => (
        <BentoItem key={item.id} item={item} />
      ))}
    </div>
  )
}

function BentoItem({ item }: { item: BentoGridItem }) {
  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-2 row-span-1',
    large: 'col-span-2 row-span-2',
    wide: 'col-span-3 row-span-1',
    tall: 'col-span-1 row-span-2',
  }

  const colSpanClass = item.colSpan ? `col-span-${item.colSpan}` : ''
  const rowSpanClass = item.rowSpan ? `row-span-${item.rowSpan}` : ''
  const sizeClass = item.size ? sizeClasses[item.size] : 'col-span-1 row-span-1'

  return (
    <div
      className={cn(
        'rounded-2xl p-6 transition-all duration-300 hover:shadow-lg',
        sizeClass,
        colSpanClass,
        rowSpanClass,
        item.className
      )}
    >
      {item.content}
    </div>
  )
}

// Responsive Bento Grid for different screen sizes
export function ResponsiveBentoGrid({ items, className, gap = 4 }: BentoGridProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-[180px]', className)} style={{ gap: `${gap * 0.25}rem` }}>
      {items.map((item) => (
        <ResponsiveBentoItem key={item.id} item={item} />
      ))}
    </div>
  )
}

function ResponsiveBentoItem({ item }: { item: BentoGridItem }) {
  const sizeClasses = {
    small: 'md:col-span-1 md:row-span-1',
    medium: 'md:col-span-2 md:row-span-1',
    large: 'md:col-span-2 md:row-span-2 lg:col-span-2 lg:row-span-2',
    wide: 'md:col-span-2 md:row-span-1 lg:col-span-3 lg:row-span-1',
    tall: 'md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2',
  }

  const defaultClass = 'col-span-1 row-span-1'
  const sizeClass = item.size ? sizeClasses[item.size] : defaultClass

  return (
    <div
      className={cn(
        'rounded-2xl p-6 transition-all duration-300 hover:shadow-lg',
        defaultClass,
        sizeClass,
        item.className
      )}
    >
      {item.content}
    </div>
  )
}
