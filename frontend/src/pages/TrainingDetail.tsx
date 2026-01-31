import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import { Training, TrainingSession, Registration, RegistrationWithPlayer } from '../types'
import Layout from '../components/Layout'
import { Calendar, MapPin, Users, Clock, ArrowLeft, CheckCircle, XCircle, Target, Zap, DollarSign, Edit2, Trash2, List, Mail, Phone } from 'lucide-react'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'
import { formatTrainingDateLabel, getTrainingDayShort } from '../utils/trainingDate'

export default function TrainingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [training, setTraining] = useState<Training | null>(null)
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [registrations, setRegistrations] = useState<Map<number, Registration>>(new Map())
  const [sessionRegistrations, setSessionRegistrations] = useState<Map<number, RegistrationWithPlayer[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (id && !authLoading) {
      loadData()
    }
  }, [id, user, authLoading])

  const loadData = async () => {
    try {
      const [trainingRes, sessionsRes] = await Promise.all([
        api.get(`/api/v1/trainings/${id}`),
        api.get(`/api/v1/trainings/${id}/sessions`)
      ])
      setTraining(trainingRes.data)
      setSessions(sessionsRes.data)

      // Load registrations for each session (only for players)
      if (user?.role === 'player' && sessionsRes.data.length > 0) {
        try {
          const regRes = await api.get(`/api/v1/registrations/me`)
          const sessionIds = sessionsRes.data.map((s: TrainingSession) => s.id)
          const regMap = new Map<number, Registration>()
          regRes.data.forEach((r: Registration) => {
            if (sessionIds.includes(r.training_session_id)) {
              regMap.set(r.training_session_id, r)
            }
          })
          setRegistrations(regMap)
        } catch (err) {
          console.error('Error loading registrations:', err)
        }
      }
      // Load registrations per session for club (who signed up)
      if (user?.role === 'club' && sessionsRes.data.length > 0) {
        const regMap = new Map<number, RegistrationWithPlayer[]>()
        await Promise.all(
          sessionsRes.data.map(async (s: TrainingSession) => {
            try {
              const res = await api.get(`/api/v1/registrations/trainings/${s.id}/registrations`)
              regMap.set(s.id, res.data || [])
            } catch {
              regMap.set(s.id, [])
            }
          })
        )
        setSessionRegistrations(regMap)
      }
    } catch (err) {
      console.error('Error loading training data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (sessionId: number) => {
    setRegistering(true)
    try {
      await api.post('/api/v1/registrations/', {
        training_session_id: sessionId
      })
      await loadData()
      // Success notification
      const notif = document.createElement('div')
      notif.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl animate-scale-in z-50'
      notif.innerHTML = '✓ Přihláška byla úspěšně odeslána!'
      document.body.appendChild(notif)
      setTimeout(() => notif.remove(), 3000)
    } catch (err: any) {
      const notif = document.createElement('div')
      notif.className = 'fixed top-4 right-4 bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-4 rounded-xl shadow-2xl animate-scale-in z-50'
      notif.innerHTML = '✗ ' + (err.response?.data?.detail || 'Chyba při přihlášení')
      document.body.appendChild(notif)
      setTimeout(() => notif.remove(), 3000)
    } finally {
      setRegistering(false)
    }
  }


  const handleDelete = async () => {
    if (!id) return
    if (!window.confirm('Opravdu chcete smazat tento trénink? Tato akce je nevratná.')) {
      return
    }
    setDeleting(true)
    try {
      await api.delete(`/api/v1/trainings/${id}`)
      navigate('/my-trainings', { replace: true })
    } catch (err: any) {
      const detail = err.response?.data?.detail
      const message = typeof detail === 'string' ? detail : 'Trénink se nepodařilo smazat.'
      alert(message)
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-success flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Schváleno</span>
      case 'pending':
        return <span className="badge badge-warning flex items-center gap-1"><Clock className="w-3 h-3" /> Čeká na schválení</span>
      case 'rejected':
        return <span className="badge badge-danger flex items-center gap-1"><XCircle className="w-3 h-3" /> Zamítnuto</span>
      case 'waitlist':
        return <span className="badge badge-info flex items-center gap-1"><List className="w-3 h-3" /> Čekací listina</span>
      case 'cancelled':
        return <span className="badge badge-secondary">Zrušeno</span>
      default:
        return <span className="badge badge-info">{status}</span>
    }
  }

  if (loading || authLoading) {
    return (
      <Layout>
        <div className="text-center py-16">
          <div className="inline-block">
            <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Načítání tréninku...</p>
        </div>
      </Layout>
    )
  }

  if (!training) {
    return (
      <Layout>
        <div className="card text-center py-16 animate-scale-in">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-600">Trénink nenalezen</p>
          <button onClick={() => navigate('/trainings')} className="btn btn-primary mt-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět na tréninky
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <button
          onClick={() => navigate(user?.role != null && String(user.role).toLowerCase() === 'club' ? '/my-trainings' : '/trainings')}
          className="flex items-center text-gray-600 hover:text-teal-600 font-semibold transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          {user?.role != null && String(user.role).toLowerCase() === 'club' ? 'Zpět na moje tréninky' : 'Zpět na tréninky'}
        </button>

        <div className="card animate-slide-up">
          <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-4xl font-black text-gradient">{training.title}</h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold ${(training.schedule_type ?? 'recurring') === 'one_time' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-teal-100 text-teal-800 border border-teal-200'}`}>
                  {(training.schedule_type ?? 'recurring') === 'one_time' ? 'Jednorázový' : 'Pravidelný'}
                </span>
              </div>
              {training.description && (
                <p className="text-gray-600 text-lg leading-relaxed">{training.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
              {user?.role != null && String(user.role).toLowerCase() === 'club' && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(`/trainings/${id}/edit`)}
                    className="btn btn-secondary flex items-center"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Upravit trénink
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="btn flex items-center border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-50"
                  >
                    {deleting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Smazat trénink
                  </button>
                </>
              )}
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-sm" title={formatTrainingDateLabel(training)}>
                {getTrainingDayShort(training)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="flex items-start group">
                <div className="p-3 bg-teal-100 rounded-xl mr-4">
                  <Calendar className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Den</p>
                  <p className="text-gray-600 font-medium">{formatTrainingDateLabel(training)}</p>
                </div>
              </div>
              <div className="flex items-start group">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Čas</p>
                  <p className="text-gray-600 font-medium">{training.start_time} - {training.end_time}</p>
                </div>
              </div>
              <div className="flex items-start group">
                <div className="p-3 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Místo</p>
                  <p className="text-gray-600 font-medium">{training.location}</p>
                  <p className="text-sm text-gray-500">{training.address}</p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                <div className="flex items-center mb-2">
                  <Target className="w-5 h-5 text-green-600 mr-2" />
                  <p className="font-bold text-gray-900">ELO rozsah</p>
                </div>
                <p className="text-2xl font-black text-green-600">{training.elo_min} - {training.elo_max}</p>
                {training.elo_tolerance > 0 && (
                  <p className="text-sm text-gray-600 mt-1">Tolerance: ±{training.elo_tolerance}</p>
                )}
              </div>

              <div className="p-5 bg-gradient-to-br bg-teal-50 rounded-xl border-2 border-teal-200">
                <div className="flex items-center mb-2">
                  <Users className="w-5 h-5 text-teal-600 mr-2" />
                  <p className="font-bold text-gray-900">Kapacita</p>
                </div>
                <p className="text-2xl font-black text-teal-600">{training.capacity} míst na termín</p>
                <p className="text-sm text-gray-600 mt-1">U každého termínu níže uvidíte, kolik míst zbývá.</p>
              </div>

              {training.fee && (
                <div className="p-5 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-200">
                  <div className="flex items-center mb-2">
                    <DollarSign className="w-5 h-5 text-amber-600 mr-2" />
                    <p className="font-bold text-gray-900">Poplatek</p>
                  </div>
                  <p className="text-2xl font-black text-amber-600">{training.fee} Kč</p>
                </div>
              )}
              {isAuthenticated && (training.contact_email || training.contact_phone) && (
                <div className="p-5 bg-teal-50 rounded-xl border-2 border-teal-200">
                  <p className="font-bold text-gray-900 mb-2">Kontakt klubu</p>
                  {training.contact_email && (
                    <p className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4 text-sky-600 flex-shrink-0" />
                      <a href={`mailto:${training.contact_email}`} className="text-teal-600 font-semibold hover:underline break-all">
                        {training.contact_email}
                      </a>
                    </p>
                  )}
                  {training.contact_phone && (
                    <p className="flex items-center gap-2 mt-2">
                      <Phone className="w-4 h-4 text-sky-600 flex-shrink-0" />
                      <a href={`tel:${training.contact_phone}`} className="text-teal-600 font-semibold hover:underline">
                        {training.contact_phone}
                      </a>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {training.rules && (
            <div className="mt-6 p-5 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border-2 border-gray-200">
              <p className="font-bold text-gray-900 mb-2">📋 Pravidla tréninku</p>
              <p className="text-gray-700 leading-relaxed">{training.rules}</p>
            </div>
          )}
        </div>

        <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-3xl font-black mb-0 flex items-center gap-2">
              <span className="text-gray-700" aria-hidden>📅</span>
              <span className="text-gradient">Termíny</span>
            </h2>
            {user?.role != null && String(user.role).toLowerCase() === 'player' && sessions.length > 0 && (
              <p className="text-gray-600 font-medium">
                Vyberte termín a klikněte na <strong className="text-teal-600">Přihlásit se</strong>
              </p>
            )}
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Zatím nejsou k dispozici žádné termíny</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session, index) => {
                const registration = registrations.get(session.id)
                const sessionRegs = sessionRegistrations.get(session.id) || []
                const isPast = new Date(session.date) < new Date()
                const statusStr = typeof session.status === 'string' ? session.status : ''
                const isScheduled = statusStr.toLowerCase() === 'scheduled'
                const isPlayer = user?.role != null && String(user.role).toLowerCase() === 'player'
                const isClub = user?.role != null && String(user.role).toLowerCase() === 'club'
                const registeredCount = session.registered_count ?? 0
                const capacity = training?.capacity ?? 0
                const freeSpots = Math.max(0, capacity - registeredCount)

                return (
                  <div
                    key={session.id}
                    className="card-hover animate-scale-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex-1">
                        <p className="text-xl font-bold text-gray-900 mb-2">
                          {format(new Date(session.date), 'd. MMMM yyyy, HH:mm', { locale: cs })}
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                          {isScheduled ? (
                            <span className="badge badge-success">✓ Naplánováno</span>
                          ) : (
                            <span className="badge badge-info">{statusStr || '—'}</span>
                          )}
                          {!isPast && (
                            <span
                              className={
                                freeSpots === 0
                                  ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm bg-red-100 text-red-700 border border-red-200'
                                  : 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }
                            >
                              <Users className="w-4 h-4 flex-shrink-0" />
                              {freeSpots === 0
                                ? 'Plně obsazeno (0 volných míst)'
                                : freeSpots === 1
                                  ? `1 volné místo (${registeredCount}/${capacity} obsazeno)`
                                  : freeSpots >= 2 && freeSpots <= 4
                                    ? `${freeSpots} volná místa (${registeredCount}/${capacity} obsazeno)`
                                    : `${freeSpots} volných míst (${registeredCount}/${capacity} obsazeno)`}
                            </span>
                          )}
                          {isPast && (
                            <span className="text-gray-500 text-sm font-medium">
                              {registeredCount} / {capacity} míst
                            </span>
                          )}
                          {registration && getStatusBadge(String(registration.status))}
                          {isPast && (
                            <span className="badge badge-warning">🕐 Proběhlo</span>
                          )}
                        </div>
                        {isClub && sessionRegs.length > 0 && (
                          <div className="mt-3 pl-2 border-l-2 border-teal-200">
                            <p className="text-sm font-bold text-gray-700 mb-1">Přihlášení:</p>
                            <ul className="space-y-1">
                              {sessionRegs.map((r) => (
                                <li key={r.id} className="flex items-center gap-2 flex-wrap text-sm">
                                  <span className="font-medium text-gray-900">{(r as RegistrationWithPlayer).player_name || `Hráč #${r.player_id}`}</span>
                                  {getStatusBadge(String(r.status))}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {isPast ? (
                          <div className="text-gray-400 font-medium">Proběhlo</div>
                        ) : isPlayer ? (
                          registration ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/registrations/${registration.id}`)}
                              className="btn btn-secondary w-full sm:w-auto"
                            >
                              Zobrazit přihlášku
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRegister(session.id)}
                              disabled={registering || !isScheduled}
                              className="btn btn-primary flex items-center justify-center w-full sm:w-auto"
                            >
                              {registering ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Přihlašování...
                                </>
                              ) : (
                                <>
                                  <Zap className="w-4 h-4 mr-2" />
                                  Přihlásit se
                                </>
                              )}
                            </button>
                          )
                        ) : isClub ? null : (
                          <p className="text-sm text-gray-500">Přihlášení jen pro hráče</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
