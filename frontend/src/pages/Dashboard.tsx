import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import { Training } from '../types'
import Layout from '../components/Layout'
import { Calendar, MapPin, Clock, Zap, Target, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { formatTrainingDateLabel, formatTimeNoSeconds, getTrainingDayShort } from '../utils/trainingDate'

interface RecommendationItem {
  training: Training & { session_date?: string }
  elo_score: number
  region_score: number
  reliability_score: number
  time_score: number
  total_score: number
}

interface RegistrationDetail {
  id: number
  training_session_id: number
  status: string
  training_id: number
  training_title: string
  training_location: string
  session_date: string
}

interface TrainingRequestItem {
  id: number
  title: string
  status: string
}

interface TrainingRequestForClub extends TrainingRequestItem {
  district_ids: number[]
  elo_min: number
  elo_max: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    upcoming: 0,
    total: 0,
    registeredCount: 0,
    activeRequestsCount: 0,
  })
  const [registrationsDetail, setRegistrationsDetail] = useState<RegistrationDetail[]>([])
  const [activeRequests, setActiveRequests] = useState<TrainingRequestItem[]>([])
  const [suitableRequests, setSuitableRequests] = useState<TrainingRequestForClub[]>([])
  const [expandedRegistrations, setExpandedRegistrations] = useState(false)
  const [expandedRequests, setExpandedRequests] = useState(false)
  const [expandedOffers, setExpandedOffers] = useState(false)
  const [expandedSuitableRequests, setExpandedSuitableRequests] = useState(false)

  useEffect(() => {
    if (!user) return

    if (user.role === 'player') {
      const loadPlayerData = async () => {
        try {
          const [recRes, regRes, regDetailRes, reqRes] = await Promise.all([
            api.get('/api/v1/matching/recommendations?limit=6'),
            api.get('/api/v1/registrations/me').catch(() => ({ data: [] })),
            api.get('/api/v1/registrations/me/detail').catch(() => ({ data: [] })),
            api.get('/api/v1/training-requests/').catch(() => ({ data: [] })),
          ])
          const recs: RecommendationItem[] = recRes.data
          setRecommendations(recs)
          setTrainings(recs.map((r: RecommendationItem) => r.training))
          const registrations = regRes.data || []
          const registeredCount = registrations.filter(
            (r: { status: string }) => r.status === 'approved' || r.status === 'pending'
          ).length
          const detailList: RegistrationDetail[] = (regDetailRes.data || []).filter(
            (r: RegistrationDetail) => r.status === 'approved' || r.status === 'pending'
          )
          setRegistrationsDetail(detailList)
          const requests = reqRes.data || []
          const openRequests = requests.filter((r: { status: string }) => r.status === 'open')
          setActiveRequests(openRequests)
          setStats({
            upcoming: recs.length,
            total: recs.length,
            registeredCount,
            activeRequestsCount: openRequests.length,
          })
        } catch (err) {
          console.error('Error loading player dashboard:', err)
        } finally {
          setLoading(false)
        }
      }
      loadPlayerData()
    } else if (user.role === 'club') {
      const loadClubData = async () => {
        try {
          const [trainingsRes, requestsRes] = await Promise.all([
            api.get('/api/v1/users/me/trainings'),
            api.get('/api/v1/training-requests/').catch(() => ({ data: [] })),
          ])
          const clubTrainings: Training[] = trainingsRes.data || []
          setTrainings(clubTrainings)
          const allOpen: TrainingRequestForClub[] = (requestsRes.data || []).filter(
            (r: { status: string }) => r.status === 'open'
          )
          const clubDistrictIds = new Set(clubTrainings.map((t: Training) => t.district_id))
          const suitable = allOpen.filter((req: TrainingRequestForClub) => {
            const districtMatch = (req.district_ids || []).some((d: number) => clubDistrictIds.has(d))
            if (!districtMatch) return false
            const eloOverlap = clubTrainings.some(
              (t: Training) =>
                Math.max(t.elo_min, req.elo_min) <= Math.min(t.elo_max, req.elo_max)
            )
            return eloOverlap
          })
          setSuitableRequests(suitable)
          setStats({
            upcoming: clubTrainings.length,
            total: clubTrainings.length,
            registeredCount: 0,
            activeRequestsCount: suitable.length,
          })
        } catch (err) {
          console.error('Error loading club dashboard:', err)
        } finally {
          setLoading(false)
        }
      }
      loadClubData()
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

        <div className="grid grid-cols-1 gap-6 animate-slide-up md:grid-cols-2">
          {user?.role === 'player' ? (
            <>
              <div className="card-hover">
                <button
                  type="button"
                  onClick={() => setExpandedRegistrations((v) => !v)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center">
                    <div className="p-4 bg-teal-600 rounded-2xl shadow-sm">
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                    <div className="ml-5">
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Přihlášené tréninky</p>
                      <p className="text-3xl sm:text-4xl font-bold text-teal-600">{stats.registeredCount}</p>
                    </div>
                  </div>
                  <span className="text-gray-400 p-2">
                    {expandedRegistrations ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </span>
                </button>
                {expandedRegistrations && registrationsDetail.length > 0 && (
                  <ul className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    {registrationsDetail.map((r) => (
                      <li key={r.id}>
                        <Link
                          to={`/registrations/${r.id}`}
                          className="flex items-center gap-2 text-teal-600 hover:text-teal-800 font-medium group/link"
                        >
                          <span className="flex-1 min-w-0">
                            <span className="block truncate">{r.training_location}</span>
                            <span className="text-gray-500 text-sm block truncate mt-0.5">
                              {new Date(r.session_date).toLocaleDateString('cs-CZ')}
                            </span>
                          </span>
                          <span className="ml-2 flex-shrink-0 group-hover/link:translate-x-0.5 transition-transform">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {expandedRegistrations && registrationsDetail.length === 0 && (
                  <p className="mt-4 pt-4 border-t border-gray-200 text-gray-500 text-sm">Žádné přihlášené tréninky</p>
                )}
              </div>
              <div className="card-hover">
                <button
                  type="button"
                  onClick={() => setExpandedRequests((v) => !v)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center">
                    <div className="p-4 bg-emerald-600 rounded-2xl shadow-sm">
                      <Target className="w-7 h-7 text-white" />
                    </div>
                    <div className="ml-5">
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Aktivní poptávky</p>
                      <p className="text-3xl sm:text-4xl font-bold text-emerald-600">{stats.activeRequestsCount}</p>
                    </div>
                  </div>
                  <span className="text-gray-400 p-2">
                    {expandedRequests ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </span>
                </button>
                {expandedRequests && activeRequests.length > 0 && (
                  <ul className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    {activeRequests.map((r) => (
                      <li key={r.id}>
                        <Link
                          to={`/training-requests/${r.id}`}
                          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 font-medium"
                        >
                          <span className="truncate">{r.title}</span>
                          <span className="ml-auto">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {expandedRequests && activeRequests.length === 0 && (
                  <p className="mt-4 pt-4 border-t border-gray-200 text-gray-500 text-sm">Žádné aktivní poptávky</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="card-hover">
                <button
                  type="button"
                  onClick={() => setExpandedOffers((v) => !v)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center">
                    <div className="p-4 bg-teal-600 rounded-2xl shadow-sm">
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                    <div className="ml-5">
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Aktivní nabídky</p>
                      <p className="text-3xl sm:text-4xl font-bold text-teal-600">{stats.upcoming}</p>
                    </div>
                  </div>
                  <span className="text-gray-400 p-2">
                    {expandedOffers ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </span>
                </button>
                {expandedOffers && trainings.length > 0 && (
                  <ul className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    {trainings.map((t) => (
                      <li key={t.id}>
                        <Link
                          to={`/trainings/${t.id}`}
                          className="flex items-center gap-2 text-teal-600 hover:text-teal-800 font-medium group/link"
                        >
                          <span className="flex-1 min-w-0">
                            <span className="block truncate">{t.title?.trim() || `Trénink #${t.id}`}</span>
                            <span className="text-gray-500 text-sm block truncate mt-0.5">
                              {t.location}
                              <span className="mx-1.5">·</span>
                              {formatTrainingDateLabel(t)}
                            </span>
                          </span>
                          <span className="ml-2 flex-shrink-0 group-hover/link:translate-x-0.5 transition-transform">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {expandedOffers && trainings.length === 0 && (
                  <p className="mt-4 pt-4 border-t border-gray-200 text-gray-500 text-sm">Žádné aktivní nabídky</p>
                )}
              </div>
              <div className="card-hover">
                <button
                  type="button"
                  onClick={() => setExpandedSuitableRequests((v) => !v)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center">
                    <div className="p-4 bg-emerald-600 rounded-2xl shadow-sm">
                      <Target className="w-7 h-7 text-white" />
                    </div>
                    <div className="ml-5">
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Potenciálně vhodné poptávky</p>
                      <p className="text-3xl sm:text-4xl font-bold text-emerald-600">{stats.activeRequestsCount}</p>
                    </div>
                  </div>
                  <span className="text-gray-400 p-2">
                    {expandedSuitableRequests ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </span>
                </button>
                {expandedSuitableRequests && suitableRequests.length > 0 && (
                  <ul className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    {suitableRequests.map((r) => (
                      <li key={r.id}>
                        <Link
                          to={`/training-requests/${r.id}`}
                          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 font-medium"
                        >
                          <span className="truncate">{r.title?.trim() || `Poptávka #${r.id}`}</span>
                          <span className="ml-auto">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {expandedSuitableRequests && suitableRequests.length === 0 && (
                  <p className="mt-4 pt-4 border-t border-gray-200 text-gray-500 text-sm">Žádné potenciálně vhodné poptávky</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <span className="text-gray-600" aria-hidden>{user?.role === 'player' ? '⭐' : '🎯'}</span>
              <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                {user?.role === 'player' ? 'Doporučené tréninky' : 'Moje tréninky'}
              </span>
              {user?.role === 'player' && (
                <span className="relative inline-flex items-center group/info">
                  <span className="text-gray-400 hover:text-teal-600 transition-colors cursor-help">
                    <Info className="w-5 h-5" aria-hidden />
                  </span>
                  <span
                    role="tooltip"
                    className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-150 z-20 w-72 text-center pointer-events-none"
                  >
                    Tréninky se doporučují podle shody ELO, lokality (okres/region), spolehlivosti a časové dostupnosti.
                  </span>
                </span>
              )}
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
              {(user?.role === 'player' ? recommendations : trainings.map((t) => ({ training: t }))).map((item: { training: Training }, index: number) => {
                const training = item.training
                return (
                  <Link
                    key={training.id}
                    to={`/trainings/${training.id}`}
                    className="card-hover group animate-scale-in relative"
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
                        {formatTimeNoSeconds(training.start_time)} - {formatTimeNoSeconds(training.end_time)}
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
                          💺 {typeof training.free_spots_next === 'number'
                            ? training.free_spots_next === 0
                              ? 'Plně obsazeno'
                              : training.free_spots_next === 1
                                ? '1 volné místo'
                                : training.free_spots_next >= 2 && training.free_spots_next <= 4
                                  ? training.free_spots_next + ' volná místa'
                                  : training.free_spots_next + ' volných míst'
                            : 'Kapacita: ' + training.capacity}
                        </span>
                        <span className="text-teal-600 font-bold text-sm group-hover:translate-x-1 transition-transform flex items-center">
                          Detail
                          <span className="ml-1">→</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
