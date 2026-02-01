import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import Layout from '../components/Layout'
import { Calendar, Target, Plus, Users, Sparkles, CheckCircle, Edit2, Trash2, Filter, Search, LogIn, UserPlus, Mail, Phone } from 'lucide-react'
import { SPORTS } from '../types'

interface TrainingRequest {
  id: number
  player_id: number
  sport?: string
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

export default function TrainingRequests() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState<TrainingRequest[]>([])
  const [allRequests, setAllRequests] = useState<TrainingRequest[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSport, setSelectedSport] = useState<string>('')
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null)
  const [eloMin, setEloMin] = useState<number | null>(null)
  const [eloMax, setEloMax] = useState<number | null>(null)

  useEffect(() => {
    loadRequests()
    api.get('/api/v1/regions/districts')
      .then(res => setDistricts(res.data))
      .catch(() => { })
  }, [])

  useEffect(() => {
    if (user?.role === 'club' || !user) {
      filterRequests()
    }
  }, [searchTerm, selectedSport, selectedDistrict, eloMin, eloMax, allRequests, user])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/v1/training-requests/')
      setAllRequests(res.data)
      setRequests(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filterRequests = () => {
    let filtered = [...allRequests]

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (selectedSport) {
      filtered = filtered.filter(r => r.sport === selectedSport)
    }

    if (selectedDistrict) {
      filtered = filtered.filter(r =>
        r.district_ids.includes(selectedDistrict)
      )
    }

    if (eloMin !== null) {
      filtered = filtered.filter(r => r.elo_max >= eloMin)
    }

    if (eloMax !== null) {
      filtered = filtered.filter(r => r.elo_min <= eloMax)
    }

    setRequests(filtered)
  }

  const handleDelete = async (requestId: number) => {
    if (!confirm('Opravdu chcete smazat tuto poptávku?')) {
      return
    }

    setDeleting(requestId)
    try {
      await api.delete(`/api/v1/training-requests/${requestId}`)
      await loadRequests()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Chyba při mazání poptávky')
    } finally {
      setDeleting(null)
    }
  }

  const getDayName = (dayOfWeek: number) => {
    const days = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']
    return days[dayOfWeek]
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {!isAuthenticated && (
          <div className="card bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                Pro zobrazení detailů poptávky a reakci se musíte <strong>přihlásit</strong> nebo <strong>registrovat</strong>.
              </p>
              <div className="flex gap-3 flex-shrink-0">
                <Link to="/login" className="btn btn-primary flex items-center">
                  <LogIn className="w-4 h-4 mr-2" />
                  Přihlásit se
                </Link>
                <Link to="/register" className="btn btn-secondary flex items-center">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Registrovat
                </Link>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black mb-2">
              <span className="text-gradient">
                {!user ? 'Poptávky hráčů' : user.role === 'player' ? 'Moje poptávky' : 'Poptávky hráčů'}
              </span>
              <span className="text-gray-700 ml-2" aria-hidden>🎯</span>
            </h1>
            <p className="text-gray-600 font-medium">
              {!user
                ? 'Otevřené poptávky – pro detail a reakci se přihlaste'
                : user.role === 'player'
                  ? 'Vytvořte poptávku a kluby vás najdou'
                  : 'Reagujte na poptávky a nabídněte tréninky'}
            </p>
          </div>
          {user?.role === 'player' && (
            <Link to="/training-requests/new" className="btn btn-primary flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Nová poptávka
            </Link>
          )}
        </div>

        {(user?.role === 'club' || !user) && (
          <div className="card p-6 space-y-4">
            <div className="flex items-center mb-4">
              <Filter className="w-5 h-5 mr-2 text-teal-600" />
              <h2 className="text-xl font-bold text-gray-900">Filtry</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">Všechna pole filtrů jsou <span className="font-medium">nepovinná</span>.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Sport <span className="text-gray-500 font-normal">(nepovinné)</span></label>
                <select
                  value={selectedSport}
                  onChange={e => setSelectedSport(e.target.value)}
                  className="input"
                >
                  <option value="">Všechny sporty</option>
                  {SPORTS.map(s => (
                    <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Vyhledávání <span className="text-gray-500 font-normal">(nepovinné)</span></label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="input pl-10"
                    placeholder="Název, popis..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Okres <span className="text-gray-500 font-normal">(nepovinné)</span></label>
                <select
                  value={selectedDistrict || ''}
                  onChange={e => setSelectedDistrict(e.target.value ? parseInt(e.target.value) : null)}
                  className="input"
                >
                  <option value="">Všechny okresy</option>
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ELO min <span className="text-gray-500 font-normal">(nepovinné)</span></label>
                <input
                  type="number"
                  value={eloMin || ''}
                  onChange={e => setEloMin(e.target.value ? parseInt(e.target.value) : null)}
                  className="input"
                  placeholder="Min ELO"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ELO max <span className="text-gray-500 font-normal">(nepovinné)</span></label>
                <input
                  type="number"
                  value={eloMax || ''}
                  onChange={e => setEloMax(e.target.value ? parseInt(e.target.value) : null)}
                  className="input"
                  placeholder="Max ELO"
                />
              </div>
            </div>

            {(searchTerm || selectedDistrict || eloMin !== null || eloMax !== null) && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedDistrict(null)
                  setEloMin(null)
                  setEloMax(null)
                }}
                className="btn btn-secondary text-sm"
              >
                Vymazat filtry
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block">
              <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Načítání poptávek...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="card text-center py-16 animate-scale-in">
            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-600">Žádné poptávky</p>
            <p className="text-gray-500 mt-2">
              {!user
                ? 'Zatím žádné otevřené poptávky'
                : user.role === 'player'
                  ? 'Vytvořte první poptávku a kluby vás najdou'
                  : 'Zatím žádný hráč nevytvořil poptávku'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request, index) => {
              const detailUrl = `/training-requests/${request.id}`
              const handleCardClick = () => {
                if (!isAuthenticated) {
                  navigate(`/login?next=${encodeURIComponent(detailUrl)}`)
                  return
                }
                if (user?.role === 'club') navigate(detailUrl)
              }
              return (
                <div
                  key={request.id}
                  onClick={handleCardClick}
                  className={`card-hover animate-scale-in cursor-pointer`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex-1">{request.title}</h3>
                    {request.status === 'open' && (
                      <span className="badge badge-success">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Aktivní
                      </span>
                    )}
                  </div>
                  {request.player_name && (
                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-500" />
                      {request.player_name}
                    </p>
                  )}
                  {request.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{request.description}</p>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center text-sm font-semibold text-gray-700">
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mr-3">
                        <Calendar className="w-4 h-4 text-teal-600" />
                      </div>
                      <div className="flex gap-1">
                        {request.preferred_days.map(day => (
                          <span key={day} className="badge badge-info">{getDayName(day)}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center text-sm font-semibold text-gray-700">
                      <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-lg mr-3">
                        <Target className="w-4 h-4 text-green-600" />
                      </div>
                      ELO: {request.elo_min} - {request.elo_max}
                    </div>
                    {isAuthenticated && (request.player_email != null || request.phone) && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        {request.player_email && (
                          <a
                            href={`mailto:${request.player_email}`}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-teal-600 font-semibold hover:underline truncate"
                          >
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{request.player_email}</span>
                          </a>
                        )}
                        {request.phone && (
                          <a
                            href={`tel:${request.phone}`}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-teal-600 font-semibold hover:underline"
                          >
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            {request.phone}
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(request.created_at).toLocaleDateString('cs-CZ')}
                      </span>
                      {!isAuthenticated ? (
                        <span className="text-teal-600 font-bold text-sm">Přihlásit se pro detail →</span>
                      ) : user?.role === 'player' && request.status === 'open' ? (
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/training-requests/${request.id}/edit`)}
                            className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Upravit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(request.id)}
                            disabled={deleting === request.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Smazat"
                          >
                            {deleting === request.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ) : user?.role === 'club' ? (
                        <span className="text-teal-600 font-bold text-sm">Detail →</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}

