import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authService } from '../services/auth'
import { Lock, Home, CheckCircle } from 'lucide-react'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      setError('Chybí odkaz pro obnovu hesla. Požádejte znovu o obnovu hesla.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Hesla se neshodují.')
      return
    }
    if (newPassword.length < 6) {
      setError('Heslo musí mít alespoň 6 znaků.')
      return
    }
    setLoading(true)
    try {
      await authService.resetPassword(token, newPassword)
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2500)
    } catch (err: unknown) {
      const detail =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined
      setError(detail || 'Nastavení hesla selhalo. Odkaz mohl vypršet – požádejte o nový.')
    } finally {
      setLoading(false)
    }
  }

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
            🔐
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-teal-700 mb-2">Nové heslo</h1>
          <p className="text-gray-600 font-medium">
            Zadejte nové heslo pro váš účet. Odkaz z e-mailu je platný 1 hodinu.
          </p>
        </div>

        <div className="card animate-scale-in">
          {success ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl font-medium flex items-center gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                Heslo bylo úspěšně změněno. Za chvíli vás přesměrujeme na přihlášení.
              </div>
              <Link
                to="/login"
                className="btn btn-primary w-full flex items-center justify-center text-lg"
              >
                Přejít na přihlášení
              </Link>
            </div>
          ) : !token ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border-2 border-amber-200 text-amber-800 px-4 py-3 rounded-xl font-medium">
                {error}
              </div>
              <Link
                to="/forgot-password"
                className="btn btn-primary w-full flex items-center justify-center text-lg"
              >
                Požádat o obnovu hesla znovu
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="newPassword" className="block text-sm font-bold text-gray-700 mb-2">
                  Nové heslo <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input pl-12"
                    placeholder="••••••••"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimálně 6 znaků</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-2">
                  Nové heslo znovu <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input pl-12"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full flex items-center justify-center text-lg"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                    Ukládám...
                  </div>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Nastavit nové heslo
                  </>
                )}
              </button>
            </form>
          )}

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
