/**
 * Glassmorphism Card Component
 * بطاقة زجاجية - خلفيات شبه شفافة مع blur خفيف
 * تعطي شعوراً بالعمق والاحترافية
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark' | 'accent'
  blur?: 'sm' | 'md' | 'lg' | 'xl'
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'light', blur = 'md', children, ...props }, ref) => {
    const variantClasses = {
      light: 'bg-white/80 backdrop-blur-md border-white/20',
      dark: 'bg-slate-900/80 backdrop-blur-md border-slate-700/50',
      accent: 'bg-medical-blue/10 backdrop-blur-md border-medical-blue/20',
    }

    const blurClasses = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
      xl: 'backdrop-blur-xl',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl shadow-lg transition-all duration-300',
          'hover:shadow-xl hover:scale-[1.01]',
          variantClasses[variant],
          blurClasses[blur],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GlassCard.displayName = 'GlassCard'

const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
GlassCardHeader.displayName = 'GlassCardHeader'

const GlassCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-xl font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
GlassCardTitle.displayName = 'GlassCardTitle'

const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-slate-600', className)}
    {...props}
  />
))
GlassCardDescription.displayName = 'GlassCardDescription'

const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
GlassCardContent.displayName = 'GlassCardContent'

const GlassCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
GlassCardFooter.displayName = 'GlassCardFooter'

export {
  GlassCard,
  GlassCardHeader,
  GlassCardFooter,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
}
