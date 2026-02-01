import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Mail, Lock, LogIn, Home, AlertTriangle, Send } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailNotVerified, setEmailNotVerified] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const { login, resendVerification } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextUrl = searchParams.get('next') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setEmailNotVerified(false)
    setResendSuccess(false)
    setLoading(true)

    try {
      const result = await login(email, password)
      if (!result.email_verified) {
        setEmailNotVerified(true)
      }
      // Navigate to dashboard even if email not verified (user can still use the app)
      navigate(nextUrl.startsWith('/') ? nextUrl : '/dashboard')
    } catch (err: unknown) {
      const detail =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined
      setError(detail || 'Přihlášení selhalo. Zkontrolujte email a heslo.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setResendLoading(true)
    try {
      await resendVerification(email)
      setResendSuccess(true)
    } catch {
      // Silently fail - we don't want to reveal if email exists
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-72 h-72 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
        <div className="absolute -bottom-40 -left-40 w-72 h-72 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" style={{ animationDelay: '2s' }} />
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
          <div className="inline-block mb-4">
            <span className="text-5xl sm:text-6xl" aria-hidden>🏆</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-teal-700 mb-2">Můj trénink</h1>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Přihlášení</h2>
          <p className="mt-2 text-gray-600 font-medium">
            Vítejte zpět! Přihlaste se ke svému účtu
          </p>
        </div>

        <div className="card animate-scale-in">
          <p className="text-sm text-gray-600 mb-4">Pole označená <span className="text-red-600 font-semibold">*</span> jsou povinná.</p>
          
          {emailNotVerified && (
            <div className="bg-amber-50 border-2 border-amber-200 text-amber-800 px-4 py-3 rounded-xl font-medium animate-scale-in mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">E-mail není ověřen</p>
                  <p className="text-sm mt-1">Pro plné využití služby prosím ověřte svůj e-mail.</p>
                  {!resendSuccess ? (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      className="mt-2 text-sm font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
                    >
                      <Send className="w-4 h-4" />
                      {resendLoading ? 'Odesílám...' : 'Znovu odeslat ověřovací e-mail'}
                    </button>
                  ) : (
                    <p className="text-sm mt-2 text-emerald-700 font-medium">Ověřovací e-mail byl odeslán!</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium animate-scale-in">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                Email <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-12"
                  placeholder="vas@email.cz"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                Heslo <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-12"
                  placeholder="••••••••"
                />
              </div>
              <div className="mt-2 text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors"
                >
                  Zapomenuté heslo?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full flex items-center justify-center text-lg"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Přihlašování...
                  </div>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Přihlásit se
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Nemáte účet?{' '}
              <Link to="/register" className="font-bold text-teal-600 hover:text-teal-700 transition-colors">
                Zaregistrujte se →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
