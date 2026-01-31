import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import Layout from '../components/Layout'
import { Calendar, Clock, MapPin, Target, Save, ArrowLeft, Info, DollarSign, Trash2, HelpCircle } from 'lucide-react'
import { SPORTS } from '../types'

function timeToInputValue(t: string | undefined): string {
  if (!t) return '18:00'
  const s = String(t)
  if (s.length >= 5) return s.substring(0, 5)
  return s
}

export default function TrainingEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [districts, setDistricts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    sport: 'stolni_tenis',
    title: '',
    description: '',
    schedule_type: 'recurring' as 'recurring' | 'one_time',
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

  useEffect(() => {
    if (id) {
      api.get(`/api/v1/trainings/${id}`)
        .then(res => {
          const t = res.data
          setFormData({
            sport: (t as { sport?: string }).sport || 'stolni_tenis',
            title: t.title || '',
            description: t.description || '',
            schedule_type: (t as { schedule_type?: string }).schedule_type === 'one_time' ? 'one_time' : 'recurring',
            day_of_week: t.day_of_week ?? 0,
            start_time: timeToInputValue(t.start_time),
            end_time: timeToInputValue(t.end_time),
            location: t.location || '',
            address: t.address || '',
            district_id: String(t.district_id ?? ''),
            elo_min: t.elo_min ?? 1000,
            elo_max: t.elo_max ?? 1500,
            elo_tolerance: t.elo_tolerance ?? 100,
            capacity: t.capacity ?? 4,
            fee: t.fee ? Number(t.fee) : 0,
            rules: t.rules || '',
            approval_mode: t.approval_mode || 'auto'
          })
          setLoadingData(false)
        })
        .catch(err => {
          console.error(err)
          setError('Trénink se nepodařilo načíst.')
          setLoadingData(false)
        })
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setLoading(true)
    setError('')

    try {
      const data = {
        ...formData,
        sport: formData.sport,
        title: formData.title || null,
        schedule_type: formData.schedule_type,
        district_id: parseInt(formData.district_id),
        fee: formData.fee > 0 ? formData.fee : null
      }

      await api.put(`/api/v1/trainings/${id}`, data)
      navigate(`/trainings/${id}`)
    } catch (err: any) {
      const detail = err.response?.data?.detail
      const message = Array.isArray(detail)
        ? detail.map((d: any) => d.msg || JSON.stringify(d)).join('. ')
        : typeof detail === 'string'
          ? detail
          : 'Chyba při ukládání tréninku. Zkontrolujte všechna pole.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const getDayName = (dayOfWeek: number) => {
    const days = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle']
    return days[dayOfWeek]
  }

  const handleDelete = async () => {
    if (!id) return
    if (!confirm('Opravdu chcete smazat tento trénink? Tato akce je nevratná.')) {
      return
    }
    setDeleting(true)
    try {
      await api.delete(`/api/v1/trainings/${id}`)
      navigate('/my-trainings')
    } catch (err: any) {
      const detail = err.response?.data?.detail
      const message = typeof detail === 'string' ? detail : 'Trénink se nepodařilo smazat.'
      setError(message)
    } finally {
      setDeleting(false)
    }
  }

  if (loadingData) {
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <button
          onClick={() => navigate(id ? `/trainings/${id}` : '/my-trainings')}
          className="flex items-center text-gray-600 hover:text-teal-600 font-semibold transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Zpět na trénink
        </button>

        <div className="card">
          <div className="flex items-center mb-8">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg mr-6">
              <Save className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gradient">Upravit trénink</h1>
              <p className="text-gray-600 font-medium mt-1">Změňte údaje o tréninku</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium animate-scale-in">
              {error}
            </div>
          )}

          <p className="text-sm text-gray-600 mb-6">Pole označená <span className="text-red-600 font-semibold">*</span> jsou povinná, ostatní jsou nepovinná.</p>
          <form onSubmit={handleSubmit} className="space-y-8">
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
                </label>
              </div>
            </section>
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-purple-500" />
                Čas a místo
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      onChange={e => setFormData({ ...formData, fee: parseInt(e.target.value) || 0 })}
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

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex-1 text-lg py-4 flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Uložit změny
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || loading}
                className="btn border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 flex items-center justify-center py-4 disabled:opacity-50"
              >
                {deleting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600" />
                ) : (
                  <>
                    <Trash2 className="w-5 h-5 mr-2" />
                    Smazat trénink
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
