import Layout from '../components/Layout'
import { useNotifications } from '../hooks/useNotifications'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'

export default function Notifications() {
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
  } = useNotifications()

  const handleNotificationClick = (notification: any) => {
    if (notification.action_url) {
      if (!notification.read) {
        markAsRead(notification.id)
      }
      navigate(notification.action_url)
    }
  }

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

        {error ? (
          <div className="card text-center py-16 animate-scale-in">
            <p className="text-xl font-semibold text-red-600 mb-2">{error}</p>
            <button onClick={() => refetch()} className="btn btn-primary mt-4">
              Zkusit znovu
            </button>
          </div>
        ) : loading ? (
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
                onClick={() => handleNotificationClick(notification)}
                className={`card-hover animate-scale-in cursor-pointer transition-transform hover:scale-[1.02] ${!notification.read
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
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsRead(notification.id)
                      }}
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
