/**
 * Mobile Drawer Component
* دراج جانبي للموبايل مثل Healthie
 */

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button-redesigned'
import { cn } from '@/lib/utils/cn'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  position?: 'left' | 'right'
  className?: string
}

export function MobileDrawer({
  isOpen,
  onClose,
  children,
  position = 'right',
  className,
}: MobileDrawerProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isClient) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{
              x: position === 'right' ? '100%' : '-100%',
            }}
            animate={{ x: 0 }}
            exit={{
              x: position === 'right' ? '100%' : '-100%',
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              'fixed top-0 bottom-0 z-50 w-[80%] max-w-sm bg-white shadow-2xl md:hidden',
              position === 'right' ? 'right-0' : 'left-0',
              className
            )}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold">القائمة</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

interface DrawerItemProps {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  active?: boolean
  className?: string
}

export function DrawerItem({ icon, label, onClick, active, className }: DrawerItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full p-4 text-right transition-colors',
        active
          ? 'bg-medical-blue/10 text-medical-blue'
          : 'text-slate-700 hover:bg-slate-100',
        className
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  )
}
