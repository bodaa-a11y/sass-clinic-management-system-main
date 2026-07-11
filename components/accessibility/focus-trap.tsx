/**
 * Focus Trap Component
 * يحبس التركيز داخل modal/dialog للـ accessibility
 * WCAG 2.1 AA compliant
 */

'use client'

import { useEffect, useRef } from 'react'
import { trapFocus } from '@/lib/utils/accessibility'

interface FocusTrapProps {
  children: React.ReactNode
  enabled?: boolean
}

export function FocusTrap({ children, enabled = true }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const cleanup = trapFocus(containerRef.current)

    // Focus first focusable element
    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    if (firstElement) {
      setTimeout(() => firstElement.focus(), 0)
    }

    return cleanup
  }, [enabled])

  return <div ref={containerRef}>{children}</div>
}
