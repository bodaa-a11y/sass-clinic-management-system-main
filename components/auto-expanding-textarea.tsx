'use client'

import { useEffect, useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'

interface AutoExpandingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  minHeight?: string
  maxHeight?: string
}

export function AutoExpandingTextarea({
  value,
  onChange,
  minHeight = '120px',
  maxHeight = '400px',
  className = '',
  ...props
}: AutoExpandingTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = minHeight
      textarea.style.height = `${Math.min(textarea.scrollHeight, parseInt(maxHeight))}px`
    }
  }, [value, minHeight, maxHeight])

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      className={`resize-none overflow-hidden ${className}`}
      style={{ minHeight, maxHeight }}
      {...props}
    />
  )
}
