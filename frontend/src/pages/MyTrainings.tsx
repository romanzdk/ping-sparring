import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import { Training } from '../types'
import Layout from '../components/Layout'
import { Calendar, MapPin, Clock, Zap, Target, Plus, ArrowLeft } from 'lucide-react'
import { formatTrainingDateLabel, formatTimeNoSeconds, getTrainingDayShort } from '../utils/trainingDate'

export default function MyTrainings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'club') {
      api.get('/api/v1/users/me/trainings')
        .then(res => {
          setTrainings(res.data || [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user])

  if (user?.role !== 'club') {
    navigate('/dashboard')
    return null
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 hover:text-teal-600 font-semibold transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Zpět na dashboard
        </button>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black text-gradient mb-2">Moje nabízené tréninky</h1>
            <p className="text-gray-600 font-medium">
              Přehled všech tréninků, které váš klub nabízí
            </p>
          </div>
          <Link to="/trainings/new" className="btn btn-primary flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Nový trénink
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block">
              <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Načítání tréninků...</p>
          </div>
        ) : trainings.length === 0 ? (
          <div className="card text-center py-16 animate-scale-in">
            <div className="inline-block p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
              <Calendar className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-xl font-semibold text-gray-600 mb-2">Žádné tréninky</p>
            <p className="text-gray-500 mb-6">Zatím jste nevytvořili žádný trénink</p>
            <Link to="/trainings/new" className="btn btn-primary inline-flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Vytvořit první trénink
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainings.map((training, index) => (
              <Link
                key={training.id}
                to={`/trainings/${training.id}`}
                className="card-hover group animate-scale-in relative"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="absolute top-4 right-4 w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all" title={formatTrainingDateLabel(training)}>
                  {getTrainingDayShort(training)}
                </div>

                <div className="flex items-center gap-2 mb-2 pr-16 flex-wrap">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                    {training.title}
                  </h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${(training.schedule_type ?? 'recurring') === 'one_time' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'}`}>
                    {(training.schedule_type ?? 'recurring') === 'one_time' ? 'Jednorázový' : 'Pravidelný'}
                  </span>
                </div>
                {training.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {training.description}
                  </p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center text-sm font-semibold text-gray-700">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mr-3">
                      <Calendar className="w-4 h-4 text-teal-600" />
                    </div>
                    {formatTrainingDateLabel(training)}
                  </div>
                  <div className="flex items-center text-sm font-semibold text-gray-700">
                    <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg mr-3">
                      <Clock className="w-4 h-4 text-purple-600" />
                    </div>
                    {formatTimeNoSeconds(training.start_time)} - {formatTimeNoSeconds(training.end_time)}
                  </div>
                  <div className="flex items-center text-sm font-semibold text-gray-700">
                    <div className="p-2 bg-gradient-to-br from-pink-100 to-pink-200 rounded-lg mr-3">
                      <MapPin className="w-4 h-4 text-pink-600" />
                    </div>
                    <span className="truncate">{training.location}</span>
                  </div>
                  <div className="flex items-center text-sm font-semibold text-gray-700">
                    <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-lg mr-3">
                      <Target className="w-4 h-4 text-green-600" />
                    </div>
                    ELO: {training.elo_min} - {training.elo_max}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <span className="badge badge-info flex items-center gap-1">
                      Kapacita: {training.capacity}
                    </span>
                    <span className="text-teal-600 font-bold text-sm group-hover:translate-x-2 transition-transform flex items-center">
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
    </Layout>
  )
}
