'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, User, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input-redesigned';
import { Button } from '@/components/ui/button-redesigned';
import { cn } from '@/lib/utils';

interface ReceptionHeaderProps {
  className?: string;
}

export function ReceptionHeader({ className }: ReceptionHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <header className={cn('bg-white border-b border-gray-200 shadow-sm', className)}>
      <div className="h-16 flex items-center justify-between px-6">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="بحث عن مريض (الاسم، الهاتف، رقم الهوية)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 h-10 bg-gray-50 border-gray-300"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Date & Time */}
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
            <Clock className="w-4 h-4" />
            <div className="text-right">
              <div className="font-medium">{formatTime(currentTime)}</div>
              <div className="text-xs text-gray-500">{formatDate(currentTime)}</div>
            </div>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Button>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="font-medium text-sm">أحمد محمد</div>
              <div className="text-xs text-gray-500">موظف استقبال</div>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
              أ
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
