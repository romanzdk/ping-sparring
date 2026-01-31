import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import Layout from '../components/Layout'
import { Calendar, MapPin, Target, ArrowLeft, CheckCircle, User, Mail, Zap, Phone } from 'lucide-react'

interface TrainingRequest {
  id: number
  player_id: number
  title: string
  description?: string
  preferred_days: number[]
  preferred_times?: any
  district_ids: number[]
  elo_min: number
  elo_max: number
  phone?: string | null
  status: string
  created_at: string
  updated_at: string
  player_email?: string | null
  player_name?: string | null
}

export default function TrainingRequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [request, setRequest] = useState<TrainingRequest | null>(null)
  const [districts, setDistricts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      Promise.all([
        api.get(`/api/v1/training-requests/${id}`),
        api.get('/api/v1/regions/districts')
      ])
        .then(([reqRes, distRes]) => {
          setRequest(reqRes.data)
          setDistricts(distRes.data)
          setLoading(false)
        })
        .catch(err => {
          console.error(err)
          setLoading(false)
        })
    }
  }, [id])

  const getDayName = (dayOfWeek: number) => {
    const days = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle']
    return days[dayOfWeek]
  }

  const getDistrictNames = () => {
    if (!request || districts.length === 0) return []
    return request.district_ids
      .map(districtId => districts.find(d => d.id === districtId)?.name)
      .filter(Boolean)
  }

  const defaultMailSubject = 'Reakce na vaši poptávku tréninku'

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-16">
          <div className="inline-block">
            <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Načítání poptávky...</p>
        </div>
      </Layout>
    )
  }

  if (!request) {
    return (
      <Layout>
        <div className="card text-center py-16 animate-scale-in">
          <p className="text-xl font-semibold text-gray-600">Poptávka nenalezena</p>
          <button onClick={() => navigate('/training-requests')} className="btn btn-primary mt-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět na poptávky
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <button
          onClick={() => navigate('/training-requests')}
          className="flex items-center text-gray-600 hover:text-teal-600 font-semibold transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Zpět na poptávky
        </button>

        <div className="card animate-slide-up">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-black text-gradient mb-2">{request.title}</h1>
              {request.status === 'open' && (
                <span className="badge badge-success inline-flex items-center mt-2">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Aktivní
                </span>
              )}
            </div>
          </div>

          {request.description && (
            <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border-2 border-gray-200">
              <p className="text-gray-700 leading-relaxed">{request.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start group">
                <div className="p-3 bg-teal-100 rounded-xl mr-4">
                  <Calendar className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Preferované dny</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {request.preferred_days.map(day => (
                      <span key={day} className="badge badge-info">{getDayName(day)}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-start group">
                <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">ELO rozsah</p>
                  <p className="text-gray-600 font-medium text-xl mt-1">{request.elo_min} - {request.elo_max}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start group">
                <div className="p-3 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Preferované lokality</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {getDistrictNames().map((name, idx) => (
                      <span key={idx} className="badge badge-info">{name}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-start group">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Vytvořeno</p>
                  <p className="text-gray-600 font-medium mt-1">
                    {new Date(request.created_at).toLocaleDateString('cs-CZ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              {isAuthenticated && (request.player_name != null || request.player_email != null || request.phone) && (
                <div className="p-4 bg-teal-50 rounded-xl border-2 border-teal-200">
                  <p className="font-bold text-gray-900 text-lg mb-2">Kontakt hráče</p>
                  {request.player_name && (
                    <p className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-sky-600 flex-shrink-0" />
                      <span className="text-gray-800 font-medium">{request.player_name}</span>
                    </p>
                  )}
                  {request.player_email && (
                    <p className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4 text-sky-600 flex-shrink-0" />
                      <a href={`mailto:${request.player_email}`} className="text-teal-600 font-semibold hover:underline break-all">
                        {request.player_email}
                      </a>
                    </p>
                  )}
                  {request.phone && (
                    <p className="flex items-center gap-2 mt-2">
                      <Phone className="w-4 h-4 text-sky-600 flex-shrink-0" />
                      <a href={`tel:${request.phone}`} className="text-teal-600 font-semibold hover:underline">
                        {request.phone}
                      </a>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex gap-4 flex-wrap">
              {user?.role === 'club' && request.status === 'open' && request.player_email && (
                <a
                  href={`mailto:${request.player_email}?subject=${encodeURIComponent(defaultMailSubject)}`}
                  className="btn btn-primary flex items-center"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Napsat hráči
                </a>
              )}
              {user?.role === 'club' && (
                <button
                  onClick={() => navigate('/trainings/new')}
                  className="btn btn-secondary flex items-center"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Vytvořit trénink pro tuto poptávku
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
