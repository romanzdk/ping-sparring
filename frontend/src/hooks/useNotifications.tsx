import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import api from '../services/api'
import { Notification } from '../types'
import { useAuth } from './useAuth'

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/v1/notifications/?limit=50')
      setNotifications(res.data ?? [])
    } catch (err) {
      setError('Nepodařilo se načíst oznámení.')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (id: number) => {
    try {
      await api.put(`/api/v1/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (err) {
      // ignore
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/api/v1/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      refetch()
    } else {
      setNotifications([])
      setError(null)
    }
  }, [isAuthenticated, refetch])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        refetch,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (ctx === undefined) {
    throw new Error('useNotifications must be used within NotificationsProvider')
  }
  return ctx
}
