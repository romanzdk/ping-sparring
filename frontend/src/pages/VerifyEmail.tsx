import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authService } from '../services/auth'
import { Home, CheckCircle, AlertCircle, Mail } from 'lucide-react'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [alreadyVerified, setAlreadyVerified] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      setError('Chybí odkaz pro ověření e-mailu.')
      return
    }

    // Auto-verify when page loads with token
    const verifyEmail = async () => {
      setLoading(true)
      try {
        const response = await authService.verifyEmail(token)
        if (response.detail?.includes('již byl ověřen')) {
          setAlreadyVerified(true)
        } else {
          setSuccess(true)
        }
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } catch (err: unknown) {
        const detail =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : undefined
        setError(detail || 'Ověření e-mailu selhalo. Odkaz mohl vypršet.')
      } finally {
        setLoading(false)
      }
    }

    verifyEmail()
  }, [token, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-72 h-72 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
        <div className="absolute -bottom-40 -left-40 w-72 h-72 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
      </div>

      <div className="max-w-md w-full space-y-6 sm:space-y-8 relative z-10 animate-fade-in px-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 font-medium transition-colors"
        >
          <Home className="w-4 h-4" />
          Zpět na úvodní stránku
        </Link>
        <div className="text-center">
          <span className="text-5xl sm:text-6xl inline-block mb-4" aria-hidden>
            ✉️
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-teal-700 mb-2">Ověření e-mailu</h1>
          <p className="text-gray-600 font-medium">
            {loading ? 'Ověřujeme váš e-mail...' : 'Ověření vaší e-mailové adresy'}
          </p>
        </div>

        <div className="card animate-scale-in">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4" />
              <p className="text-gray-600 font-medium">Ověřujeme váš e-mail...</p>
            </div>
          ) : success ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl font-medium flex items-center gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                E-mail byl úspěšně ověřen! Za chvíli vás přesměrujeme na přihlášení.
              </div>
              <Link
                to="/login"
                className="btn btn-primary w-full flex items-center justify-center text-lg"
              >
                Přejít na přihlášení
              </Link>
            </div>
          ) : alreadyVerified ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border-2 border-blue-200 text-blue-800 px-4 py-3 rounded-xl font-medium flex items-center gap-2">
                <Mail className="w-5 h-5 flex-shrink-0" />
                Tento e-mail již byl ověřen. Můžete se přihlásit.
              </div>
              <Link
                to="/login"
                className="btn btn-primary w-full flex items-center justify-center text-lg"
              >
                Přejít na přihlášení
              </Link>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
              <p className="text-gray-600 text-sm text-center">
                Odkaz pro ověření mohl vypršet (platný 24 hodin). Přihlaste se a vyžádejte si nový odkaz.
              </p>
              <Link
                to="/login"
                className="btn btn-primary w-full flex items-center justify-center text-lg"
              >
                Přejít na přihlášení
              </Link>
            </div>
          ) : null}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors"
            >
              ← Zpět na přihlášení
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
