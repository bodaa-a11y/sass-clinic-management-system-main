/**
 * Typography Component
 * مكونات الطباعة المحسّنة - خطوط ضخمة وواضحة لتمييز البيانات الهامة
 * مستوحى من Apple و Notion
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'

// Display Text - للعناوين الكبيرة جداً
interface DisplayTextProps extends React.HTMLAttributes<HTMLHeadingElement> {
  size?: 'small' | 'medium' | 'large' | 'xl'
  weight?: 'regular' | 'medium' | 'semibold' | 'bold'
}

export function DisplayText({
  className,
  size = 'large',
  weight = 'bold',
  ...props
}: DisplayTextProps) {
  const sizeClasses = {
    small: 'text-4xl',
    medium: 'text-5xl',
    large: 'text-6xl',
    xl: 'text-7xl',
  }

  const weightClasses = {
    regular: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }

  return (
    <h1
      className={cn(
        'tracking-tight text-slate-900',
        sizeClasses[size],
        weightClasses[weight],
        className
      )}
      {...props}
    />
  )
}

// Heading - للعناوين
interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6
  weight?: 'regular' | 'medium' | 'semibold' | 'bold'
}

export function Heading({
  className,
  level = 2,
  weight = 'semibold',
  ...props
}: HeadingProps) {
  const Tag = `h${level}` as const

  const sizeClasses = {
    1: 'text-3xl',
    2: 'text-2xl',
    3: 'text-xl',
    4: 'text-lg',
    5: 'text-base',
    6: 'text-sm',
  }

  const weightClasses = {
    regular: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }

  return (
    <Tag
      className={cn(
        'tracking-tight text-slate-900',
        sizeClasses[level],
        weightClasses[weight],
        className
      )}
      {...props}
    />
  )
}

// Body Text - للنصوص العادية
interface BodyTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: 'sm' | 'md' | 'lg'
  weight?: 'regular' | 'medium' | 'semibold'
  color?: 'default' | 'muted' | 'accent'
}

export function BodyText({
  className,
  size = 'md',
  weight = 'regular',
  color = 'default',
  ...props
}: BodyTextProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  const weightClasses = {
    regular: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
  }

  const colorClasses = {
    default: 'text-slate-900',
    muted: 'text-slate-600',
    accent: 'text-medical-blue',
  }

  return (
    <p
      className={cn(
        'leading-relaxed',
        sizeClasses[size],
        weightClasses[weight],
        colorClasses[color],
        className
      )}
      {...props}
    />
  )
}

// Caption - للنصوص الصغيرة
interface CaptionProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'xs' | 'sm'
  weight?: 'regular' | 'medium'
  color?: 'default' | 'muted' | 'accent'
}

export function Caption({
  className,
  size = 'sm',
  weight = 'regular',
  color = 'muted',
  ...props
}: CaptionProps) {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
  }

  const weightClasses = {
    regular: 'font-normal',
    medium: 'font-medium',
  }

  const colorClasses = {
    default: 'text-slate-900',
    muted: 'text-slate-500',
    accent: 'text-medical-blue',
  }

  return (
    <span
      className={cn(
        'leading-relaxed',
        sizeClasses[size],
        weightClasses[weight],
        colorClasses[color],
        className
      )}
      {...props}
    />
  )
}

// Medical Data Display - لعرض البيانات الطبية الهامة
interface MedicalDataProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string | number
  label: string
  variant?: 'default' | 'alert' | 'success' | 'warning' | 'info'
  size?: 'sm' | 'md' | 'lg'
}

export function MedicalData({
  value,
  label,
  variant = 'default',
  size = 'md',
  className,
  ...props
}: MedicalDataProps) {
  const variantClasses = {
    default: 'text-medical-blue',
    alert: 'text-rose-error',
    success: 'text-emerald-success',
    warning: 'text-amber-warning',
    info: 'text-teal-secondary',
  }

  const sizeClasses = {
    sm: { value: 'text-2xl', label: 'text-xs' },
    md: { value: 'text-3xl', label: 'text-sm' },
    lg: { value: 'text-4xl', label: 'text-base' },
  }

  return (
    <div className={cn('flex flex-col', className)} {...props}>
      <span className={cn('font-bold tracking-tight', variantClasses[variant], sizeClasses[size].value)}>
        {value}
      </span>
      <span className={cn('text-slate-600 mt-1', sizeClasses[size].label)}>
        {label}
      </span>
    </div>
  )
}
