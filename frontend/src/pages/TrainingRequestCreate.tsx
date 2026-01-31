import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Layout from '../components/Layout'
import { Calendar, Target, Plus, ArrowLeft, MapPin, Phone } from 'lucide-react'

export default function TrainingRequestCreate() {
  const navigate = useNavigate()
  const [districts, setDistricts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    preferred_days: [] as number[],
    district_ids: [] as string[],
    elo_min: 1000,
    elo_max: 1500,
    phone: '',
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
      const data = {
        ...formData,
        district_ids: formData.district_ids.map(id => parseInt(id)),
        phone: formData.phone || null
      }

      await api.post('/api/v1/training-requests/', data)
      navigate('/training-requests')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Chyba při vytváření poptávky.')
    } finally {
      setLoading(false)
    }
  }

  const toggleDay = (day: number) => {
    if (formData.preferred_days.includes(day)) {
      setFormData({ ...formData, preferred_days: formData.preferred_days.filter(d => d !== day) })
    } else {
      setFormData({ ...formData, preferred_days: [...formData.preferred_days, day] })
    }
  }

  const toggleDistrict = (districtId: string) => {
    if (formData.district_ids.includes(districtId)) {
      setFormData({ ...formData, district_ids: formData.district_ids.filter(d => d !== districtId) })
    } else {
      setFormData({ ...formData, district_ids: [...formData.district_ids, districtId] })
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
          onClick={() => navigate('/training-requests')}
          className="flex items-center text-gray-600 hover:text-teal-600 font-semibold transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Zpět na poptávky
        </button>

        <div className="card">
          <div className="flex items-center mb-8">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mr-6">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gradient">Nová poptávka</h1>
              <p className="text-gray-600 font-medium mt-1">Popište, jaký trénink hledáte</p>
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
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Název poptávky <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="Např. Hledám sparring 2x týdně"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Popis <span className="text-gray-500 font-normal">(nepovinné)</span></label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="input min-h-[100px]"
                  placeholder="Popište, co hledáte..."
                />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-teal-600" />
                Preferované dny <span className="text-red-600 text-base font-normal ml-1">* (alespoň jeden)</span>
              </h2>
              <div className="grid grid-cols-7 gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`py-3 px-2 rounded-xl font-semibold text-sm transition-all ${formData.preferred_days.includes(day)
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {getDayName(day).substring(0, 2)}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-500" />
                ELO rozsah
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-bold text-gray-700 mb-2">Telefon <span className="text-gray-500 font-normal">(nepovinné)</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="input pl-10"
                      placeholder="+420 123 456 789"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-pink-500" />
                Preferované lokality <span className="text-red-600 text-base font-normal ml-1">* (alespoň jedna)</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2">
                {districts.map(district => (
                  <button
                    key={district.id}
                    type="button"
                    onClick={() => toggleDistrict(district.id.toString())}
                    className={`py-2 px-3 rounded-lg font-medium text-sm transition-all text-left ${formData.district_ids.includes(district.id.toString())
                      ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {district.name}
                  </button>
                ))}
              </div>
            </section>

            <button
              type="submit"
              disabled={loading || formData.preferred_days.length === 0 || formData.district_ids.length === 0}
              className="btn btn-primary w-full text-lg py-4 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Vytvořit poptávku
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
