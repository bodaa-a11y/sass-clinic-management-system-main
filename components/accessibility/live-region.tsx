/**
 * Live Region Component
 * لإعلان التغييرات الديناميكية لقارئات الشاشة
 * WCAG 2.1 AA compliant
 */

'use client'

import { useEffect, useRef } from 'react'

interface LiveRegionProps {
  message: string
  politeness?: 'polite' | 'assertive'
  className?: string
}

export function LiveRegion({ message, politeness = 'polite', className }: LiveRegionProps) {
  const previousMessage = useRef('')

  useEffect(() => {
    if (message && message !== previousMessage.current) {
      previousMessage.current = message
    }
  }, [message])

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className={className}
      style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap' }}
    >
      {message}
    </div>
  )
}

export function useLiveAnnouncement() {
  const announce = (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    const element = document.createElement('div')
    element.setAttribute('role', 'status')
    element.setAttribute('aria-live', politeness)
    element.setAttribute('aria-atomic', 'true')
    element.className = 'sr-only'
    element.textContent = message

    document.body.appendChild(element)

    setTimeout(() => {
      document.body.removeChild(element)
    }, 1000)
  }

  return { announce }
}
