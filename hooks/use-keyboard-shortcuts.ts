/**
 * Keyboard Shortcuts Hook
 * دعم keyboard navigation مثل Healthie
 */

'use client'

import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  handler: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const matches =
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          (shortcut.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey) &&
          (shortcut.shiftKey ? event.shiftKey : !event.shiftKey) &&
          (shortcut.altKey ? event.altKey : !event.altKey) &&
          (shortcut.metaKey ? event.metaKey : !event.metaKey)

        if (matches) {
          event.preventDefault()
          shortcut.handler()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

// Keyboard shortcuts constants
export const KEYBOARD_SHORTCUTS = {
  // Navigation
  GO_HOME: { key: 'g', shiftKey: true, description: 'الذهاب للرئيسية' },
  GO_DASHBOARD: { key: 'd', altKey: true, description: 'الذهاب للـ Dashboard' },
  GO_RECEPTION: { key: 'r', altKey: true, description: 'الذهاب للاستقبال' },
  GO_DOCTOR: { key: 'p', altKey: true, description: 'الذهاب لغرفة الطبيب' },
  GO_SETTINGS: { key: 's', altKey: true, description: 'الذهاب للإعدادات' },

  // Actions
  NEW_APPOINTMENT: { key: 'n', ctrlKey: true, description: 'موعد جديد' },
  NEW_PATIENT: { key: 'p', ctrlKey: true, description: 'مريض جديد' },
  SEARCH: { key: '/', description: 'بحث' },
  SAVE: { key: 's', ctrlKey: true, description: 'حفظ' },
  CANCEL: { key: 'Escape', description: 'إلغاء/إغلاق' },
  SUBMIT: { key: 'Enter', description: 'إرسال' },

  // Navigation within pages
  NEXT_PATIENT: { key: 'ArrowRight', altKey: true, description: 'المريض التالي' },
  PREVIOUS_PATIENT: { key: 'ArrowLeft', altKey: true, description: 'المريض السابق' },
  FINISH_EXAM: { key: 'Enter', ctrlKey: true, description: 'إنهاء الفحص' },

  // Help
  SHOW_SHORTCUTS: { key: '?', description: 'عرض الاختصارات' },
}

export type KeyboardShortcutsType = typeof KEYBOARD_SHORTCUTS
