'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
}

interface NotificationContextType {
  notifications: Notification[]
  enabled: boolean
  toggleNotifications: () => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [enabled, setEnabled] = useState(true)

  // Load enabled state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notifications-enabled')
    if (saved !== null) {
      setEnabled(saved === 'true')
    }
  }, [])

  // Save enabled state to localStorage
  const toggleNotifications = () => {
    const newState = !enabled
    setEnabled(newState)
    localStorage.setItem('notifications-enabled', String(newState))
  }

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    if (!enabled) return

    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    }

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)) // Keep last 50

    // Show toast notification
    switch (notification.type) {
      case 'success':
        toast.success(notification.title, { description: notification.message })
        break
      case 'error':
        toast.error(notification.title, { description: notification.message })
        break
      case 'warning':
        toast.warning(notification.title, { description: notification.message })
        break
      default:
        toast.info(notification.title, { description: notification.message })
    }
  }

  // Auto-remove old notifications (older than 1 hour)
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev =>
        prev.filter(n => Date.now() - n.timestamp.getTime() < 3600000)
      )
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        enabled,
        toggleNotifications,
        addNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
