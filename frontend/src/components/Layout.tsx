import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { LogOut, User, Home, Calendar, Bell, Users, LogIn, UserPlus, Menu, X, Mail, AlertTriangle, Send } from 'lucide-react'
import { useEffect, useState } from 'react'

const navLinkClass = "flex items-center min-h-[44px] px-4 py-3 text-base font-semibold text-gray-700 hover:text-teal-600 rounded-xl hover:bg-teal-50/80 transition-all w-full sm:w-auto"

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated, resendVerification } = useAuth()
  const { unreadCount, refetch } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const handleResendVerification = async () => {
    if (!user?.email) return
    setResendLoading(true)
    try {
      await resendVerification(user.email)
      setResendSuccess(true)
    } catch {
      // Silently fail
    } finally {
      setResendLoading(false)
    }
  }

  const showEmailBanner = isAuthenticated && user && !user.email_verified && !bannerDismissed

  useEffect(() => {
    if (isAuthenticated && location.pathname === '/notifications') {
      refetch()
    }
  }, [isAuthenticated, location.pathname, refetch])

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMobileMenuOpen(false)
  }

  const isPublicListingPage =
    location.pathname === '/trainings' ||
    location.pathname === '/training-requests' ||
    location.pathname === '/contact'

  const PublicNav = () => (
    <>
      <Link to="/trainings" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
        <Calendar className="w-5 h-5 mr-2 flex-shrink-0" aria-hidden />
        Trénink
      </Link>
      <Link to="/training-requests" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
        <Users className="w-5 h-5 mr-2 flex-shrink-0" aria-hidden />
        Poptávky
      </Link>
      <Link to="/#jak-to-funguje" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
        Jak to funguje
      </Link>
      <Link to="/contact" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
        <Mail className="w-5 h-5 mr-2 flex-shrink-0" aria-hidden />
        Kontakt
      </Link>
    </>
  )

  const AuthNav = () => (
    <>
      <Link to="/dashboard" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
        <Home className="w-5 h-5 mr-2 flex-shrink-0" aria-hidden />
        Přehled
      </Link>
      {user?.role === 'player' && (
        <Link to="/trainings" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
          <Calendar className="w-5 h-5 mr-2 flex-shrink-0" aria-hidden />
          Trénink
        </Link>
      )}
      {user?.role === 'club' && (
        <Link to="/my-trainings" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
          <Calendar className="w-5 h-5 mr-2 flex-shrink-0" aria-hidden />
          Moje tréninky
        </Link>
      )}
      <Link to="/training-requests" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
        <Users className="w-5 h-5 mr-2 flex-shrink-0" aria-hidden />
        {user?.role === 'player' ? 'Moje poptávky' : 'Poptávky'}
      </Link>
    </>
  )

  if (!isAuthenticated) {
    if (isPublicListingPage) {
      return (
        <div className="min-h-screen">
          <nav className="glass sticky top-0 z-50 pt-safe-top">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center min-h-[56px] sm:min-h-16">
                <Link to="/" className="flex items-center text-lg sm:text-xl font-bold text-teal-700 hover:text-teal-800 transition-colors min-h-[44px] items-center">
                  <span className="text-xl sm:text-2xl mr-2" aria-hidden>🏆</span>
                  Můj trénink
                </Link>
                <div className="hidden md:flex md:items-center md:gap-1">
                  <PublicNav />
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/profile" className={navLinkClass + " hidden sm:flex"}>
                    <User className="w-5 h-5 mr-2" aria-hidden />
                    Můj účet
                  </Link>
                  <Link to="/login" className="btn btn-secondary text-sm sm:text-base min-h-[44px]">
                    <LogIn className="w-4 h-4 sm:mr-2" aria-hidden />
                    <span className="hidden sm:inline">Přihlásit se</span>
                  </Link>
                  <Link to="/register" className="btn btn-primary text-sm sm:text-base min-h-[44px]">
                    <UserPlus className="w-4 h-4 sm:mr-2" aria-hidden />
                    <span className="hidden sm:inline">Registrovat</span>
                  </Link>
                  <button
                    type="button"
                    className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl text-gray-600 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? 'Zavřít menu' : 'Otevřít menu'}
                  >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </button>
                </div>
              </div>
              {mobileMenuOpen && (
                <div className="md:hidden py-4 border-t border-gray-100 space-y-1">
                  <PublicNav />
                </div>
              )}
            </div>
          </nav>
          <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 pb-safe-bottom">
            {children}
          </main>
        </div>
      )
    }
    return <>{children}</>
  }

  return (
    <div className="min-h-screen">
      <nav className="glass sticky top-0 z-50 pt-safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center min-h-[56px] sm:min-h-16">
            <Link to="/dashboard" className="flex items-center text-lg sm:text-xl font-bold text-teal-700 hover:text-teal-800 transition-colors min-h-[44px] items-center">
              <span className="text-xl sm:text-2xl mr-2" aria-hidden>🏆</span>
              Můj trénink
            </Link>
            <div className="hidden md:flex md:items-center md:gap-1">
              <AuthNav />
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                to="/notifications"
                className="relative flex items-center justify-center min-w-[44px] min-h-[44px] text-gray-500 hover:text-teal-600 rounded-xl hover:bg-teal-50/80 transition-all"
                title="Oznámení"
              >
                <Bell className="w-5 h-5" aria-hidden />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center font-bold">{unreadCount}</span>
                  </span>
                )}
              </Link>
              <Link to="/profile" className={navLinkClass + " hidden sm:flex max-w-[180px]"} onClick={() => setMobileMenuOpen(false)}>
                <User className="w-5 h-5 mr-2 flex-shrink-0" aria-hidden />
                <span className="truncate">{user?.role === 'club' ? (user?.club_name || user?.email?.split('@')[0]) : (user?.first_name || user?.email?.split('@')[0])}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden sm:flex items-center min-h-[44px] px-4 py-2 text-base font-semibold text-gray-700 hover:text-red-600 rounded-xl hover:bg-red-50/80 transition-all"
              >
                <LogOut className="w-4 h-4 mr-2" aria-hidden />
                Odhlásit
              </button>
              <button
                type="button"
                className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl text-gray-600 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Zavřít menu' : 'Otevřít menu'}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100 space-y-1">
              <AuthNav />
              <Link to="/profile" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
                <User className="w-5 h-5 mr-2" aria-hidden />
                Můj účet
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className={navLinkClass + " text-red-600 hover:bg-red-50/80"}
              >
                <LogOut className="w-5 h-5 mr-2" aria-hidden />
                Odhlásit
              </button>
            </div>
          )}
        </div>
      </nav>
      {showEmailBanner && (
        <div className="bg-amber-50 border-b-2 border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-start sm:items-center gap-2 text-amber-800">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <span className="font-bold">E-mail není ověřen.</span>
                  <span className="ml-1 text-sm">Prosím ověřte svůj e-mail pro plné využití služby.</span>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-7 sm:ml-0">
                {!resendSuccess ? (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="text-sm font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 whitespace-nowrap"
                  >
                    <Send className="w-4 h-4" />
                    {resendLoading ? 'Odesílám...' : 'Znovu odeslat'}
                  </button>
                ) : (
                  <span className="text-sm text-emerald-700 font-medium whitespace-nowrap">Odesláno!</span>
                )}
                <button
                  type="button"
                  onClick={() => setBannerDismissed(true)}
                  className="text-amber-600 hover:text-amber-800 p-1"
                  aria-label="Zavřít upozornění"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 pb-safe-bottom">
        {children}
      </main>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 right-20 w-72 h-72 sm:w-96 sm:h-96 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        <div className="absolute bottom-20 left-20 w-72 h-72 sm:w-96 sm:h-96 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  )
}
