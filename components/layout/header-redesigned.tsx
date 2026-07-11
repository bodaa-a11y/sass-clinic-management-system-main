/**
 * Header Component - Redesigned
 * مستوحى من Oracle Health و Healthie
 * مع دعم accessibility و responsive design
 */

'use client'

import { Bell, Search, Settings, User } from 'lucide-react'
import { Button } from '@/components/ui/button-redesigned'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar-redesigned'
import { cn } from '@/lib/utils/cn'

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md transition-all duration-200',
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-medical-blue">
            <span className="text-lg font-bold text-white">م</span>
          </div>
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-slate-900">منصة إدارة العيادات</h1>
            <p className="text-xs text-slate-500">نظام شامل لإدارة المواعيد</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="بحث عن مريض، موعد، أو..."
              className="w-full h-10 pr-10 pl-4 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue focus:border-transparent transition-all"
              aria-label="بحث"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative" aria-label="الإشعارات">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-rose-error rounded-full" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="الإعدادات">
            <Settings className="h-5 w-5" />
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <Avatar className="h-9 w-9 cursor-pointer">
            <AvatarImage src="" alt="المستخدم" />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
