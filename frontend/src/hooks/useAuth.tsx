import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types'
import { authService } from '../services/auth'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ email_verified: boolean }>
  register: (email: string, password: string, role: string, firstName?: string, lastName?: string, clubName?: string) => Promise<{ email: string }>
  logout: () => void
  loading: boolean
  resendVerification: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      authService.getCurrentUser()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('access_token')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string): Promise<{ email_verified: boolean }> => {
    const response = await authService.login({ email, password })
    localStorage.setItem('access_token', response.access_token)
    const user = await authService.getCurrentUser()
    setUser(user)
    return { email_verified: response.email_verified ?? false }
  }

  const register = async (email: string, password: string, role: string, firstName?: string, lastName?: string, clubName?: string): Promise<{ email: string }> => {
    const response = await authService.register({ 
      email, 
      password, 
      role: role as 'player' | 'club', 
      first_name: firstName, 
      last_name: lastName, 
      club_name: clubName 
    })
    // Don't auto-login - user needs to verify email first
    return { email: response.email }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
  }

  const resendVerification = async (email: string) => {
    await authService.resendVerification(email)
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      loading,
      resendVerification,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
