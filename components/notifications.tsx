'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Bell, User, Calendar, AlertCircle, Check, X } from 'lucide-react'

interface Notification {
  id: string
  type: 'patient_arrival' | 'invoice_overdue' | 'upcoming_appointment'
  title: string
  message: string
  time: string
  read: boolean
  actionUrl?: string
}

export function Notifications() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Simulate fetching notifications
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'patient_arrival',
        title: 'وصول مريض جديد',
        message: 'المريض أحمد محمد وصل إلى الاستقبال',
        time: 'منذ 5 دقائق',
        read: false,
        actionUrl: '/dashboard/reception'
      },
      {
        id: '2',
        type: 'invoice_overdue',
        title: 'فاتورة متأخرة',
        message: 'فاتورة #INV-001 متأخرة الدفع',
        time: 'منذ ساعة',
        read: false,
        actionUrl: '/dashboard/billing'
      },
      {
        id: '3',
        type: 'upcoming_appointment',
        title: 'موعد قادم',
        message: 'موعد مع الدكتور علي خلال 15 دقيقة',
        time: 'منذ 2 ساعة',
        read: true,
        actionUrl: '/dashboard/appointments'
      }
    ]

    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter(n => !n.read).length)
  }, [])

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
    setUnreadCount(0)
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    if (notification.actionUrl) {
      setOpen(false)
      // In a real app, you would use router.push here
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'patient_arrival':
        return <User className="w-4 h-4 text-blue-600" />
      case 'invoice_overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'upcoming_appointment':
        return <Calendar className="w-4 h-4 text-green-600" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getBgColor = (type: string) => {
    switch (type) {
      case 'patient_arrival':
        return 'bg-blue-50'
      case 'invoice_overdue':
        return 'bg-red-50'
      case 'upcoming_appointment':
        return 'bg-green-50'
      default:
        return 'bg-gray-50'
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-md" dir="rtl">
          <div className="flex flex-col h-[500px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-semibold">الإشعارات</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  تحديد الكل كمقروء
                </Button>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Bell className="w-12 h-12 mb-2 opacity-50" />
                  <p>لا توجد إشعارات</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-full ${getBgColor(notification.type)}`}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {notification.time}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setOpen(false)
                  // Navigate to notifications page
                }}
              >
                عرض جميع الإشعارات
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
