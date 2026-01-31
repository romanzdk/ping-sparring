import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import { Training } from '../types'
import Layout from '../components/Layout'
import { Calendar, MapPin, Users, TrendingUp, Clock, Zap, Target } from 'lucide-react'
import { formatTrainingDateLabel, getTrainingDayShort } from '../utils/trainingDate'

export default function Dashboard() {
  const { user } = useAuth()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    upcoming: 0,
    total: 0,
  })

  useEffect(() => {
    if (!user) return

    if (user.role === 'player') {
      // Get recommended trainings
      api.get('/api/v1/matching/recommendations?limit=6')
        .then(res => {
          const recs = res.data.map((r: any) => r.training)
          setTrainings(recs)
          setStats({ upcoming: recs.length, total: recs.length })
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error loading recommendations:', err)
          setLoading(false)
        })
    } else if (user.role === 'club') {
      // Get my trainings for clubs (from /me/trainings endpoint)
      api.get('/api/v1/users/me/trainings')
        .then(res => {
          console.log('Club trainings response:', res.data)
          setTrainings(res.data || [])
          setStats({ upcoming: res.data?.length || 0, total: res.data?.length || 0 })
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error loading club trainings:', err)
          setLoading(false)
        })
    }
  }, [user])


  return (
    <Layout>
      <div className="space-y-8">
        <div className="animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
            <span className="text-gradient">Vítejte, {user?.role === 'club' ? (user?.club_name || user?.email?.split('@')[0]) : (user?.first_name || user?.email?.split('@')[0])}!</span>
            <span className="text-gray-700 ml-2" aria-hidden>👋</span>
          </h1>
          <p className="text-xl text-gray-600 font-semibold">
            {user?.role === 'player'
              ? <>Zde jsou vaše doporučené tréninky <span className="text-gray-500" aria-hidden>⭐</span></>
              : <>Spravujte své tréninky <span className="text-gray-500" aria-hidden>🎯</span></>}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
          <div className="card-hover group">
            <div className="flex items-center">
              <div className="p-4 bg-teal-600 rounded-2xl shadow-sm group-hover:bg-teal-700 transition-colors">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Nadcházející</p>
                <p className="text-3xl sm:text-4xl font-bold text-teal-600">{stats.upcoming}</p>
              </div>
            </div>
          </div>
          <div className="card-hover group">
            <div className="flex items-center">
              <div className="p-4 bg-emerald-600 rounded-2xl shadow-sm group-hover:bg-emerald-700 transition-colors">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Celkem</p>
                <p className="text-3xl sm:text-4xl font-bold text-emerald-600">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="card-hover group">
            <div className="flex items-center">
              <div className="p-4 bg-amber-500 rounded-2xl shadow-sm group-hover:bg-amber-600 transition-colors">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Hodnocení ELO</p>
                <p className="text-3xl sm:text-4xl font-bold text-amber-600">-</p>
              </div>
            </div>
          </div>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <span className="text-gray-600" aria-hidden>{user?.role === 'player' ? '⭐' : '🎯'}</span>
              <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                {user?.role === 'player' ? 'Doporučené tréninky' : 'Moje tréninky'}
              </span>
            </h2>
            {user?.role === 'player' ? (
              <Link to="/trainings" className="btn btn-secondary group">
                <span>Zobrazit všechny</span>
                <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>
              </Link>
            ) : (
              <div className="flex gap-2">
                <Link to="/my-trainings" className="btn btn-secondary group">
                  <span>Všechny moje tréninky</span>
                  <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>
                </Link>
                <Link to="/trainings/new" className="btn btn-primary group">
                  <Zap className="w-4 h-4 mr-2" />
                  <span>Nový trénink</span>
                </Link>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block">
                <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Načítání...</p>
            </div>
          ) : trainings.length === 0 ? (
            <div className="card text-center py-16">
              <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-xl font-semibold text-gray-600 mb-2">Žádné tréninky</p>
              <p className="text-gray-500">Zatím nejsou k dispozici žádné tréninky</p>
              {user?.role === 'club' && (
                <Link to="/trainings/new" className="btn btn-primary mt-6 inline-flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Vytvořit trénink
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainings.map((training, index) => (
                <Link
                  key={training.id}
                  to={`/trainings/${training.id}`}
                  className="card-hover group animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute top-4 right-4 w-14 h-14 bg-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm" title={formatTrainingDateLabel(training)}>
                    {getTrainingDayShort(training)}
                  </div>

                  <div className="flex items-center gap-2 mb-2 pr-16 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-teal-600 transition-colors">{training.title}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${(training.schedule_type ?? 'recurring') === 'one_time' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'}`}>
                      {(training.schedule_type ?? 'recurring') === 'one_time' ? 'Jednorázový' : 'Pravidelný'}
                    </span>
                  </div>
                  {training.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">{training.description}</p>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center text-sm font-semibold text-gray-700">
                      <div className="p-2 bg-teal-100 rounded-lg mr-3">
                        <Calendar className="w-4 h-4 text-teal-600" />
                      </div>
                      {formatTrainingDateLabel(training)}
                    </div>
                    <div className="flex items-center text-sm font-semibold text-gray-700">
                      <div className="p-2 bg-gray-100 rounded-lg mr-3">
                        <Clock className="w-4 h-4 text-gray-600" />
                      </div>
                      {training.start_time} - {training.end_time}
                    </div>
                    <div className="flex items-center text-sm font-semibold text-gray-700">
                      <div className="p-2 bg-gray-100 rounded-lg mr-3">
                        <MapPin className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="truncate">{training.location}</span>
                    </div>
                    <div className="flex items-center text-sm font-semibold text-gray-700">
                      <div className="p-2 bg-gray-100 rounded-lg mr-3">
                        <Target className="w-4 h-4 text-gray-600" />
                      </div>
                      ELO: {training.elo_min} - {training.elo_max}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <span className="badge badge-info flex items-center gap-1">
                        💺 Kapacita: {training.capacity}
                      </span>
                      <span className="text-teal-600 font-bold text-sm group-hover:translate-x-1 transition-transform flex items-center">
                        Detail
                        <span className="ml-1">→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
