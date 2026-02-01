import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Mail, Lock, UserPlus, User, Home, CheckCircle } from 'lucide-react'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'player' | 'club'>('player')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [clubName, setClubName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (role === 'player' && !firstName.trim()) {
      setError('Pro registraci hráče je povinné alespoň křestní jméno.')
      return
    }
    if (role === 'club' && !clubName.trim()) {
      setError('Pro registraci klubu je povinný název klubu.')
      return
    }
    setLoading(true)
    try {
      const result = await register(email, password, role, firstName.trim() || undefined, lastName.trim() || undefined, clubName.trim() || undefined)
      setRegisteredEmail(result.email)
      setSuccess(true)
    } catch (err: unknown) {
      const detail =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined
      setError(detail || 'Registrace selhala. Zkuste to znovu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-72 h-72 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
        <div className="absolute -bottom-40 -left-40 w-72 h-72 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
      </div>

      <div className="max-w-md w-full space-y-6 sm:space-y-8 relative z-10 animate-fade-in px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 font-medium transition-colors"
        >
          <Home className="w-4 h-4" />
          Zpět na úvodní stránku
        </Link>
        <div className="text-center">
          <span className="text-5xl sm:text-6xl inline-block mb-4" aria-hidden>🏆</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-teal-700 mb-2">Můj trénink</h1>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Registrace</h2>
          <p className="text-gray-600 font-medium">
            Začněte svou sportovní cestu
          </p>
        </div>

        <div className="card animate-scale-in">
          {success ? (
            <div className="space-y-6">
              <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-800 px-4 py-4 rounded-xl font-medium flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-1">Registrace úspěšná!</p>
                  <p>Na adresu <strong>{registeredEmail}</strong> jsme odeslali e-mail s odkazem pro ověření.</p>
                  <p className="mt-2 text-sm">Zkontrolujte svou e-mailovou schránku (i složku spam) a klikněte na odkaz pro dokončení registrace.</p>
                </div>
              </div>
              <Link
                to="/login"
                className="btn btn-primary w-full flex items-center justify-center text-lg"
              >
                Přejít na přihlášení
              </Link>
            </div>
          ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium animate-scale-in">
                {error}
              </div>
            )}

            <p className="text-sm text-gray-600 mb-4">Pole označená <span className="text-red-600 font-semibold">*</span> jsou povinná. Pořadí: email, role, pak jméno nebo název klubu.</p>

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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-12"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-bold text-gray-700 mb-2">
                Role <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'player' | 'club')}
                  className="input pl-12 appearance-none cursor-pointer"
                >
                  <option value="player">Hráč 🎯</option>
                  <option value="club">Klub 🏢</option>
                </select>
              </div>
            </div>

            {role === 'player' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-bold text-gray-700 mb-2">
                    Křestní jméno <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="input"
                    placeholder="Jan"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-bold text-gray-700 mb-2">
                    Příjmení <span className="text-gray-500 font-normal">(nepovinné)</span>
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input"
                    placeholder="Novák"
                  />
                </div>
              </div>
            )}

            {role === 'club' && (
              <div>
                <label htmlFor="clubName" className="block text-sm font-bold text-gray-700 mb-2">
                  Název klubu <span className="text-red-600">*</span>
                </label>
                <input
                  id="clubName"
                  name="clubName"
                  type="text"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  className="input"
                  placeholder="TT Klub Praha"
                />
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full flex items-center justify-center text-lg"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Registrace...
                  </div>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Registrovat se
                  </>
                )}
              </button>
            </div>
          </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Již máte účet?{' '}
              <Link to="/login" className="font-bold text-teal-600 hover:text-teal-700 transition-colors">
                Přihlaste se →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
