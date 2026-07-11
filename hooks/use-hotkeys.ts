import { useEffect } from 'react'

interface HotkeyConfig {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  handler: () => void
  description: string
}

export function useHotkeys(hotkeys: HotkeyConfig[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const hotkey of hotkeys) {
        const keyMatch = e.key.toLowerCase() === hotkey.key.toLowerCase()
        const ctrlMatch = hotkey.ctrlKey ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey
        const altMatch = hotkey.altKey ? e.altKey : !e.altKey
        const shiftMatch = hotkey.shiftKey ? e.shiftKey : !e.shiftKey

        if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
          e.preventDefault()
          hotkey.handler()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hotkeys])

  return hotkeys
}

export const HOTKEYS = {
  FINISH_EXAM: { key: 'Enter', ctrlKey: true, description: 'إنهاء الفحص' },
  NEXT_PATIENT: { key: 'n', altKey: true, description: 'المريض التالي' },
  ESCAPE: { key: 'Escape', description: 'إلغاء/إغلاق' }
} as const
