import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import { RegistrationDetail as RegistrationDetailType } from '../types'
import Layout from '../components/Layout'
import { ArrowLeft, Calendar, CheckCircle, XCircle, Clock, List } from 'lucide-react'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'

export default function RegistrationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [registration, setRegistration] = useState<RegistrationDetailType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id && !authLoading) {
      loadData()
    }
  }, [id, authLoading])

  const loadData = async () => {
    try {
      const res = await api.get(`/api/v1/registrations/${id}`)
      setRegistration(res.data)
    } catch (err) {
      console.error('Error loading registration:', err)
      setRegistration(null)
    } finally {
      setLoading(false)
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
          <p className="mt-4 text-gray-600 font-medium">Načítání přihlášky...</p>
        </div>
      </Layout>
    )
  }

  if (!registration) {
    return (
      <Layout>
        <div className="card text-center py-16 animate-scale-in">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-600">Přihláška nenalezena</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary mt-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět na přehled
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 hover:text-teal-600 font-semibold transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Zpět na přehled
        </button>

        <div className="card animate-slide-up">
          <h1 className="text-3xl font-black text-gradient mb-6">Přihláška na trénink</h1>

          <div className="space-y-5">
            <div className="p-5 bg-gradient-to-br bg-teal-50 rounded-xl border-2 border-teal-200">
              <div className="flex items-center mb-2">
                <Calendar className="w-5 h-5 text-teal-600 mr-2" />
                <p className="font-bold text-gray-900">Trénink</p>
              </div>
              <p className="text-xl font-bold text-gray-900">{registration.training_title}</p>
              <p className="text-gray-600 mt-1">
                Termín: {format(new Date(registration.session_date), 'd. MMMM yyyy, HH:mm', { locale: cs })}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <p className="font-bold text-gray-900">Stav:</p>
              {getStatusBadge(String(registration.status))}
            </div>

            {registration.approved_at && (
              <p className="text-sm text-gray-600">
                Schváleno dne: {format(new Date(registration.approved_at), 'd. MMMM yyyy', { locale: cs })}
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => navigate(`/trainings/${registration.training_id}`)}
              className="btn btn-primary"
            >
              Zobrazit trénink
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
