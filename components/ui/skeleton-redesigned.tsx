/**
 * Skeleton Component - Redesigned
 * مع دعم animations و accessibility
 */

import { cn } from '@/lib/utils/cn'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200', className)}
      {...props}
    />
  )
}

export { Skeleton }
