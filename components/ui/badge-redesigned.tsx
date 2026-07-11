/**
 * Badge Component - Redesigned
 * مستوحى من Oracle Health و Healthie
 * مع دعم semantic colors
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-medical-blue text-white hover:bg-primary-700',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
        destructive: 'bg-rose-error text-white hover:bg-rose-600',
        outline: 'border-2 border-slate-200 text-slate-900',
        success: 'bg-emerald-success text-white hover:bg-emerald-600',
        warning: 'bg-amber-warning text-white hover:bg-amber-600',
        info: 'bg-medical-blue/10 text-medical-blue hover:bg-medical-blue/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
