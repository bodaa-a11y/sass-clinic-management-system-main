/**
 * Mobile Input Component
* حقل إدخال محسّن للموبايل مع touch feedback
*/

'use client'

import { Input } from '@/components/ui/input-redesigned'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export function MobileInput({
  label,
  error,
  helperText,
  className,
  ...props
}: MobileInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <motion.div
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.1 }}
      >
        <Input
          className={cn(
            'h-12 text-base', // Larger touch target
            error && 'border-rose-error focus:ring-rose-error',
            className
          )}
          {...props}
        />
      </motion.div>
      {error && (
        <p className="text-sm text-rose-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-slate-500">{helperText}</p>
      )}
    </div>
  )
}
