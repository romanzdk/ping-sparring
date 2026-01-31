import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { Training } from '../types'
import Layout from '../components/Layout'
import { Calendar, MapPin, Users, Clock, Search, Filter, Target, Sparkles, LogIn, UserPlus, Mail, Phone } from 'lucide-react'
import { getDayName, formatTrainingDateLabel, getTrainingDayShort } from '../utils/trainingDate'

export default function Trainings() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [allTrainings, setAllTrainings] = useState<Training[]>([])
  const [districts, setDistricts] = useState<{ id: number; name: string; code: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    district_id: '',
    elo_min: '',
    elo_max: '',
    day_of_week: '',
  })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    api.get('/api/v1/regions/districts')
      .then((res: { data: { id: number; name: string; code: string }[] }) => {
        const list = [...(res.data || [])].sort((a, b) => a.name.localeCompare(b.name, 'cs'))
        const jiny = list.find(d => d.code === 'JINY' || d.name === 'Jiný')
        const rest = list.filter(d => d !== jiny)
        setDistricts(jiny ? [...rest, jiny] : list)
      })
      .catch(() => { })
  }, [])

  useEffect(() => {
    loadTrainings()
  }, [filters])

  useEffect(() => {
    if (!searchTerm) {
      setTrainings(allTrainings)
      return
    }
    const term = searchTerm.toLowerCase()
    setTrainings(allTrainings.filter((t: Training) =>
      t.title.toLowerCase().includes(term) ||
      (t.description && t.description.toLowerCase().includes(term))
    ))
  }, [searchTerm, allTrainings])

  const loadTrainings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.district_id) params.append('district_id', filters.district_id)
      if (filters.elo_min) params.append('elo_min', filters.elo_min)
      if (filters.elo_max) params.append('elo_max', filters.elo_max)
      if (filters.day_of_week) params.append('day_of_week', filters.day_of_week)
      const res = await api.get(`/api/v1/trainings/?${params.toString()}`)
      setAllTrainings(res.data)
      if (!searchTerm) {
        setTrainings(res.data)
      } else {
        const term = searchTerm.toLowerCase()
        setTrainings(res.data.filter((t: Training) =>
          t.title.toLowerCase().includes(term) ||
          (t.description && t.description.toLowerCase().includes(term))
        ))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {!isAuthenticated && (
          <div className="card bg-amber-50 border-2 border-amber-200 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                Pro zobrazení detailů tréninku a přihlášení se musíte <strong>přihlásit</strong> nebo <strong>registrovat</strong>.
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
        <div className="flex justify-between items-center animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              <span className="text-teal-600">Nabídky tréninků</span>
              <span className="text-gray-700 ml-2" aria-hidden>🏓</span>
            </h1>
            <p className="text-gray-600 font-medium">Najdi vhodný trénink pro sebe</p>
          </div>
        </div>

        <div className="card p-6 space-y-4 animate-slide-up">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 mr-2 text-teal-600" />
            <h2 className="text-xl font-bold text-gray-900">Filtry</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Všechna pole filtrů jsou <span className="font-medium">nepovinná</span>.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Vyhledávání <span className="text-gray-500 font-normal">(nepovinné)</span></label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Název, popis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Okres <span className="text-gray-500 font-normal">(nepovinné)</span></label>
              <select
                value={filters.district_id}
                onChange={(e) => setFilters({ ...filters, district_id: e.target.value })}
                className="input"
              >
                <option value="">Všechny okresy</option>
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Den v týdnu <span className="text-gray-500 font-normal">(nepovinné)</span></label>
              <select
                value={filters.day_of_week}
                onChange={(e) => setFilters({ ...filters, day_of_week: e.target.value })}
                className="input"
              >
                <option value="">Všechny dny</option>
                {[0, 1, 2, 3, 4, 5, 6].map(day => (
                  <option key={day} value={day}>{getDayName(day)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ELO min <span className="text-gray-500 font-normal">(nepovinné)</span></label>
              <input
                type="number"
                value={filters.elo_min}
                onChange={(e) => setFilters({ ...filters, elo_min: e.target.value })}
                className="input"
                placeholder="Min ELO"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ELO max <span className="text-gray-500 font-normal">(nepovinné)</span></label>
              <input
                type="number"
                value={filters.elo_max}
                onChange={(e) => setFilters({ ...filters, elo_max: e.target.value })}
                className="input"
                placeholder="Max ELO"
              />
            </div>
          </div>
          {(searchTerm || filters.district_id || filters.elo_min || filters.elo_max || filters.day_of_week) && (
            <button
              onClick={() => {
                setSearchTerm('')
                setFilters({ district_id: '', elo_min: '', elo_max: '', day_of_week: '' })
              }}
              className="btn btn-secondary text-sm"
            >
              Vymazat filtry
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Načítání tréninků...</p>
          </div>
        ) : trainings.length === 0 ? (
          <div className="card text-center py-16 animate-scale-in">
            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-600">Žádné tréninky nenalezeny</p>
            <p className="text-gray-500 mt-2">Zkuste upravit filtry nebo vyhledávání</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainings.map((training, index) => {
              const isPublicItem = 'district_name' in training && typeof (training as Training & { district_name?: string }).district_name === 'string'
              const districtName = isPublicItem ? (training as Training & { district_name?: string }).district_name : null
              const detailUrl = `/trainings/${training.id}`
              const linkTo = !isAuthenticated ? `/login?next=${encodeURIComponent(detailUrl)}` : detailUrl
              return (
                <div
                  key={training.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(linkTo)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(linkTo) } }}
                  className="card-hover group animate-scale-in cursor-pointer"
                  style={{ animationDelay: `${index * 0.05}s` }}
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
                  {training.club_name && (
                    <p className="text-sm font-semibold text-teal-700 mb-1">{training.club_name}</p>
                  )}
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
                      <span className="truncate">
                        {districtName != null ? `Okres: ${districtName}` : training.location}
                      </span>
                    </div>
                    <div className="flex items-center text-sm font-semibold text-gray-700">
                      <div className="p-2 bg-gray-100 rounded-lg mr-3">
                        <Target className="w-4 h-4 text-gray-600" />
                      </div>
                      ELO: {training.elo_min} - {training.elo_max}
                    </div>
                    {isAuthenticated && (training.contact_email || training.contact_phone) && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        {training.contact_email && (
                          <a
                            href={`mailto:${training.contact_email}`}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-teal-600 font-semibold hover:underline truncate"
                          >
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{training.contact_email}</span>
                          </a>
                        )}
                        {training.contact_phone && (
                          <a
                            href={`tel:${training.contact_phone}`}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-teal-600 font-semibold hover:underline"
                          >
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            {training.contact_phone}
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <span className="badge badge-info flex items-center gap-1">
                        💺 Kapacita: {training.capacity}
                      </span>
                      <span className="text-teal-600 font-bold text-sm group-hover:translate-x-1 transition-transform flex items-center">
                        {!isAuthenticated ? 'Přihlásit se pro detail' : 'Detail'}
                        <span className="ml-1">→</span>
                      </span>
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
