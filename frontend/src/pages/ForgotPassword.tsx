import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../services/auth'
import { Mail, Home, Send } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSuccess(true)
    } catch (err: unknown) {
      const detail =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined
      setError(detail || 'Odeslání odkazu selhalo. Zkuste to znovu.')
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
            🔑
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-teal-700 mb-2">Obnovení hesla</h1>
          <p className="text-gray-600 font-medium">
            Zadejte e-mail účtu a pošleme vám odkaz pro nastavení nového hesla.
          </p>
        </div>

        <div className="card animate-scale-in">
          {success ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl font-medium">
                Pokud účet s tímto e-mailem existuje, byl odeslán odkaz pro obnovu hesla. Zkontrolujte
                schránku (i složku spam) a klikněte na odkaz v e-mailu.
              </div>
              <Link
                to="/login"
                className="btn btn-primary w-full flex items-center justify-center text-lg"
              >
                Zpět na přihlášení
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

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full flex items-center justify-center text-lg"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                    Odesílám...
                  </div>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Odeslat odkaz na obnovu hesla
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
