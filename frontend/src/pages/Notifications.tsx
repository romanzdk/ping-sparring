import { useEffect, useState } from 'react'
import api from '../services/api'
import { Notification } from '../types'
import Layout from '../components/Layout'
import { Bell, Check, Clock, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const res = await api.get('/api/v1/notifications/?limit=50')
      setNotifications(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/api/v1/notifications/${id}/read`)
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (err) {
      console.error(err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.put('/api/v1/notifications/read-all')
      setNotifications(notifications.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error(err)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              <span className="text-teal-600">Oznámení</span>
              <span className="text-gray-700 ml-2" aria-hidden>🔔</span>
            </h1>
            <p className="text-gray-600 font-medium">
              {unreadCount > 0 ? `Máte ${unreadCount} nepřečtených oznámení` : 'Vše je přečteno'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn btn-primary flex items-center"
            >
              <Check className="w-4 h-4 mr-2" />
              Označit vše jako přečtené
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Načítání notifikací...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="card text-center py-16 animate-scale-in">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-600">Žádné notifikace</p>
            <p className="text-gray-500 mt-2">Budeme vás informovat o důležitých událostech</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`card-hover animate-scale-in ${!notification.read
                  ? 'bg-teal-50 border-l-4 border-teal-500'
                  : ''
                  }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <h3 className="text-xl font-bold text-gray-900">{notification.title}</h3>
                      {!notification.read && (
                        <span className="ml-3 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-teal-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3 leading-relaxed font-medium">{notification.message}</p>
                    <p className="text-sm text-gray-500 font-medium flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {format(new Date(notification.created_at), 'd. MMMM yyyy, HH:mm', { locale: cs })}
                    </p>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="btn btn-secondary ml-4 flex items-center"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Přečteno
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
