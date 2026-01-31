import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import Layout from '../components/Layout'
import { Calendar, Clock, MapPin, Users, Target, Zap, ArrowLeft, Info, DollarSign, HelpCircle } from 'lucide-react'
import { SPORTS } from '../types'

export default function TrainingCreate() {
  const navigate = useNavigate()
  const [districts, setDistricts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    sport: 'stolni_tenis',
    title: '',
    description: '',
    schedule_type: 'recurring' as 'recurring' | 'one_time',
    session_date: '', // YYYY-MM-DD for one_time
    day_of_week: 0,
    start_time: '18:00',
    end_time: '20:00',
    location: '',
    address: '',
    district_id: '',
    elo_min: 1000,
    elo_max: 1500,
    elo_tolerance: 100,
    capacity: 4,
    fee: 0,
    rules: '',
    approval_mode: 'auto'
  })

  useEffect(() => {
    api.get('/api/v1/regions/districts')
      .then((res: { data: { id: number; name: string; code: string }[] }) => {
        const list = [...(res.data || [])].sort((a, b) => a.name.localeCompare(b.name, 'cs'))
        const jiny = list.find(d => d.code === 'JINY' || d.name === 'Jiný')
        const rest = list.filter(d => d !== jiny)
        setDistricts(jiny ? [...rest, jiny] : list)
      })
      .catch(err => console.error(err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (formData.schedule_type === 'one_time' && !formData.session_date) {
        setError('U jednorázového tréninku zadejte datum termínu.')
        setLoading(false)
        return
      }
      const data = {
        ...formData,
        title: formData.title || null,
        schedule_type: formData.schedule_type,
        district_id: parseInt(formData.district_id),
        fee: formData.fee > 0 ? formData.fee : null
      }

      const res = await api.post('/api/v1/trainings/', data)

      let isoLocal: string
      if (formData.schedule_type === 'one_time' && formData.session_date) {
        // One-time: use chosen date + start_time (local); ensure HH:mm:00
        const timePart = formData.start_time.length >= 5 ? formData.start_time.slice(0, 5) : formData.start_time
        isoLocal = formData.session_date + 'T' + timePart + ':00'
      } else {
        // Recurring: first session = next occurrence of chosen weekday at start_time (local time)
        // Form: day_of_week 0 = Monday, 6 = Sunday. JS getDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
        const targetJsDay = formData.day_of_week === 6 ? 0 : formData.day_of_week + 1
        const nextDate = new Date()
        let daysToAdd = (targetJsDay - nextDate.getDay() + 7) % 7
        if (daysToAdd === 0) daysToAdd = 7
        nextDate.setDate(nextDate.getDate() + daysToAdd)
        const [hours, minutes] = formData.start_time.split(':')
        nextDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
        isoLocal = nextDate.getFullYear() + '-' +
          String(nextDate.getMonth() + 1).padStart(2, '0') + '-' +
          String(nextDate.getDate()).padStart(2, '0') + 'T' +
          String(nextDate.getHours()).padStart(2, '0') + ':' +
          String(nextDate.getMinutes()).padStart(2, '0') + ':00'
      }

      await api.post(`/api/v1/trainings/${res.data.id}/sessions`, {
        date: isoLocal
      })

      // Redirect to dashboard for clubs, training detail for players
      navigate('/dashboard')
    } catch (err: any) {
      const detail = err.response?.data?.detail
      const message = Array.isArray(detail)
        ? detail.map((d: any) => d.msg || JSON.stringify(d)).join('. ')
        : typeof detail === 'string'
          ? detail
          : 'Chyba při vytváření tréninku. Zkontrolujte všechna pole.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const getDayName = (dayOfWeek: number) => {
    const days = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle']
    return days[dayOfWeek]
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 hover:text-teal-600 font-semibold transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Zpět na dashboard
        </button>

        <div className="card">
          <div className="flex items-center mb-8">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mr-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gradient">Nový trénink</h1>
              <p className="text-gray-600 font-medium mt-1">Vytvořte pravidelný trénink pro hráče</p>
              <p className="text-sm text-amber-600 mt-1">Maximálně 5 aktivních nabídek. Pro více některou smažte.</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium animate-scale-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <p className="text-sm text-gray-600 mb-6">Pole označená <span className="text-red-600 font-semibold">*</span> jsou povinná, ostatní jsou nepovinná.</p>
            {/* Sport */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-500" />
                Sport
              </h2>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Sport <span className="text-red-600">*</span></label>
                <select
                  required
                  value={formData.sport}
                  onChange={e => setFormData({ ...formData, sport: e.target.value })}
                  className="input"
                >
                  {SPORTS.map(s => (
                    <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>
                  ))}
                </select>
              </div>
            </section>
            {/* Typ tréninku */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
                Typ tréninku
              </h2>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="schedule_type"
                    value="recurring"
                    checked={formData.schedule_type === 'recurring'}
                    onChange={() => setFormData({ ...formData, schedule_type: 'recurring' })}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="font-medium">Pravidelný (opakovaný)</span>
                  <span className="text-gray-500 text-sm">— každý týden stejný den a čas</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="schedule_type"
                    value="one_time"
                    checked={formData.schedule_type === 'one_time'}
                    onChange={() => setFormData({ ...formData, schedule_type: 'one_time' })}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="font-medium">Jednorázový</span>
                  <span className="text-gray-500 text-sm">— jeden konkrétní termín</span>
                </label>
              </div>
            </section>
            {/* Čas a místo */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-purple-500" />
                Čas a místo
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {formData.schedule_type === 'recurring' ? (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Den v týdnu <span className="text-red-600">*</span></label>
                    <select
                      value={formData.day_of_week}
                      onChange={e => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                      className="input"
                    >
                      {[0, 1, 2, 3, 4, 5, 6].map(day => (
                        <option key={day} value={day}>{getDayName(day)}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Datum termínu <span className="text-red-600">*</span></label>
                    <input
                      type="date"
                      required={formData.schedule_type === 'one_time'}
                      value={formData.session_date}
                      onChange={e => {
                        const dateStr = e.target.value
                        const d = new Date(dateStr + 'T12:00:00')
                        const dayOfWeek = (d.getDay() + 6) % 7
                        setFormData({ ...formData, session_date: dateStr, day_of_week: dayOfWeek })
                      }}
                      className="input"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Začátek <span className="text-red-600">*</span></label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Konec <span className="text-red-600">*</span></label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Lokalita (název místa) <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="input"
                    placeholder="Např. Sokol Brno"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Adresa <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="input"
                    placeholder="Ulice, město"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Okres <span className="text-red-600">*</span></label>
                <select
                  required
                  value={formData.district_id}
                  onChange={e => setFormData({ ...formData, district_id: e.target.value })}
                  className="input"
                >
                  <option value="">Vyberte okres</option>
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </section>

            {/* Úroveň a kapacita */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-500" />
                Úroveň a kapacita
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">ELO min <span className="text-red-600">*</span></label>
                  <input
                    type="number"
                    required
                    value={formData.elo_min}
                    onChange={e => setFormData({ ...formData, elo_min: parseInt(e.target.value) })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">ELO max <span className="text-red-600">*</span></label>
                  <input
                    type="number"
                    required
                    value={formData.elo_max}
                    onChange={e => setFormData({ ...formData, elo_max: parseInt(e.target.value) })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    Tolerance (±) <span className="text-gray-500 font-normal">(nepovinné)</span>
                    <span title="Hráči s ELO mimo rozsah min–max mohou být zobrazeni, pokud spadají do tolerance (±). Např. rozsah 1200–1500 a tolerance 100 zobrazí i 1100–1600." className="cursor-help text-gray-400 hover:text-teal-600">
                      <HelpCircle className="w-4 h-4" />
                    </span>
                  </label>
                  <input
                    type="number"
                    value={formData.elo_tolerance}
                    onChange={e => setFormData({ ...formData, elo_tolerance: parseInt(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Kapacita hostů <span className="text-red-600">*</span></label>
                  <input
                    type="number"
                    required
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Poplatek (Kč) <span className="text-gray-500 font-normal">(nepovinné)</span></label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="number"
                      value={formData.fee}
                      onChange={e => setFormData({ ...formData, fee: parseInt(e.target.value) })}
                      className="input pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    Schvalování <span className="text-gray-500 font-normal">(nepovinné)</span>
                    <span title="Automaticky: přihláška se hned schválí. Ručně: přihlášku musí klub schválit." className="cursor-help text-gray-400 hover:text-teal-600">
                      <HelpCircle className="w-4 h-4" />
                    </span>
                  </label>
                  <select
                    value={formData.approval_mode}
                    onChange={e => setFormData({ ...formData, approval_mode: e.target.value })}
                    className="input"
                  >
                    <option value="auto">Automaticky</option>
                    <option value="manual">Ručně</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Název a popis (nepovinné) */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Info className="w-5 h-5 mr-2 text-teal-600" />
                Název a popis <span className="text-gray-500 font-normal text-base">(nepovinné)</span>
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Název tréninku <span className="text-gray-500 font-normal">(nepovinné)</span></label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    placeholder="Např. Sparring pro pokročilé"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Popis <span className="text-gray-500 font-normal">(nepovinné)</span></label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="input min-h-[100px]"
                    placeholder="Popište průběh tréninku, vybavení, počet účastníků..."
                  />
                </div>
              </div>
            </section>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full text-lg py-4 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Vytvořit trénink a první termín
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
