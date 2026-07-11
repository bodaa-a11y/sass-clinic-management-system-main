/**
 * Bottom Navigation Component - Redesigned
 * للهاتف المحمول فقط
 * مستوحى من Healthie
 */

'use client'

import { Home, Calendar, FileText, User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface BottomNavItem {
  label: string
  icon: React.ReactNode
  href: string
  active?: boolean
}

interface BottomNavProps {
  items: BottomNavItem[]
  className?: string
}

export function BottomNav({ items, className }: BottomNavProps) {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 md:hidden',
        className
      )}
      role="navigation"
      aria-label="التنقل الرئيسي"
    >
      <div className="flex items-center justify-around h-16 px-4">
        {items.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 min-w-16 transition-colors',
              item.active
                ? 'text-medical-blue'
                : 'text-slate-400 hover:text-slate-600'
            )}
            aria-label={item.label}
            aria-current={item.active ? 'page' : undefined}
          >
            <div className="relative">
              {item.icon}
              {item.active && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-medical-blue rounded-full" />
              )}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  )
}

// Default navigation items
export const defaultBottomNavItems: BottomNavItem[] = [
  { label: 'الرئيسية', icon: <Home className="h-5 w-5" />, href: '/dashboard', active: true },
  { label: 'المواعيد', icon: <Calendar className="h-5 w-5" />, href: '/dashboard/reception' },
  { label: 'السجلات', icon: <FileText className="h-5 w-5" />, href: '/dashboard/doctor' },
  { label: 'حسابي', icon: <User className="h-5 w-5" />, href: '/dashboard/settings' },
]
