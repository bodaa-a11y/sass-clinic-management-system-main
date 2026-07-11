/**
 * Lazy Loader Component
* تحميل مكونات بشكل lazy لتحسين الأداء
*/

'use client'

import { Suspense, lazy } from 'react'
import { LoadingSpinner } from '@/components/animations/loading-states'

export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy(importFn)
}

interface LazyComponentProps {
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function LazyWrapper({ fallback, children }: LazyComponentProps) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      {children}
    </Suspense>
  )
}

// Example usage:
// const LazyComponent = createLazyComponent(() => import('./MyComponent'))
// <LazyWrapper fallback={<LoadingSpinner />}>
//   <LazyComponent />
// </LazyWrapper>
