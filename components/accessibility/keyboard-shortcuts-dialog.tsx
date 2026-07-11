/**
 * Keyboard Shortcuts Dialog
 * يعرض جميع اختصارات لوحة المفاتيح المتاحة
 * مثل Healthie
 */

'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button-redesigned'
import { KEYBOARD_SHORTCUTS } from '@/hooks/use-keyboard-shortcuts'
import { X, Keyboard } from 'lucide-react'

interface ShortcutItem {
  key: string
  modifiers: string[]
  description: string
}

const shortcutGroups: { title: string; shortcuts: ShortcutItem[] }[] = [
  {
    title: 'التنقل',
    shortcuts: [
      { key: 'G', modifiers: ['Shift'], description: 'الذهاب للرئيسية' },
      { key: 'D', modifiers: ['Alt'], description: 'الذهاب للـ Dashboard' },
      { key: 'R', modifiers: ['Alt'], description: 'الذهاب للاستقبال' },
      { key: 'P', modifiers: ['Alt'], description: 'الذهاب لغرفة الطبيب' },
      { key: 'S', modifiers: ['Alt'], description: 'الذهاب للإعدادات' },
    ],
  },
  {
    title: 'الإجراءات',
    shortcuts: [
      { key: 'N', modifiers: ['Ctrl'], description: 'موعد جديد' },
      { key: 'P', modifiers: ['Ctrl'], description: 'مريض جديد' },
      { key: '/', modifiers: [], description: 'بحث' },
      { key: 'S', modifiers: ['Ctrl'], description: 'حفظ' },
      { key: 'Escape', modifiers: [], description: 'إلغاء/إغلاق' },
      { key: 'Enter', modifiers: [], description: 'إرسال' },
    ],
  },
  {
    title: 'التنقل داخل الصفحات',
    shortcuts: [
      { key: '→', modifiers: ['Alt'], description: 'المريض التالي' },
      { key: '←', modifiers: ['Alt'], description: 'المريض السابق' },
      { key: 'Enter', modifiers: ['Ctrl'], description: 'إنهاء الفحص' },
    ],
  },
]

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Keyboard className="w-5 h-5" />
            اختصارات لوحة المفاتيح
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {shortcutGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <h3 className="font-semibold text-slate-900 mb-3">{group.title}</h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, shortcutIndex) => (
                  <div
                    key={shortcutIndex}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-sm text-slate-700">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.modifiers.map((mod, modIndex) => (
                        <kbd
                          key={modIndex}
                          className="px-2 py-1 text-xs font-medium bg-white border border-slate-300 rounded shadow-sm"
                        >
                          {mod}
                        </kbd>
                      ))}
                      <kbd className="px-2 py-1 text-xs font-medium bg-white border border-slate-300 rounded shadow-sm">
                        {shortcut.key}
                      </kbd>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-slate-700">
            <strong>نصيحة:</strong> اضغط على <kbd className="px-1.5 py-0.5 text-xs bg-white border border-slate-300 rounded">?</kbd> في أي وقت لعرض هذه القائمة
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function KeyboardShortcutsButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="عرض اختصارات لوحة المفاتيح"
      >
        <Keyboard className="w-5 h-5" />
      </Button>
      <KeyboardShortcutsDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
