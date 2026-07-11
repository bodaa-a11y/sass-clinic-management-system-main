/**
 * Button Component - Redesigned
 * مستوحى من Oracle Health و Healthie
 * مع دعم micro-interactions و accessibility
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-medical-blue text-white hover:bg-primary-700 active:scale-95 shadow-sm',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:scale-95',
        destructive: 'bg-rose-error text-white hover:bg-rose-600 active:scale-95 shadow-sm',
        outline: 'border-2 border-slate-200 bg-transparent hover:bg-slate-50 active:scale-95',
        ghost: 'hover:bg-slate-100 hover:text-slate-900 active:scale-95',
        link: 'text-medical-blue underline-offset-4 hover:underline',
        accent: 'bg-teal-secondary text-white hover:bg-teal-600 active:scale-95 shadow-sm',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        xl: 'h-12 rounded-lg px-10 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
