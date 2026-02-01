import api from './api'
import { User } from '../types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  role: 'player' | 'club'
  first_name?: string
  last_name?: string
  club_name?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  email_verified?: boolean
}

export interface RegisterResponse {
  detail: string
  email: string
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new FormData()
    formData.append('username', credentials.email)
    formData.append('password', credentials.password)

    const response = await api.post<AuthResponse>('/api/v1/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  },

  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/api/v1/auth/register', data)
    return response.data
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/api/v1/auth/me')
    return response.data
  },

  async forgotPassword(email: string): Promise<{ detail: string }> {
    const response = await api.post<{ detail: string }>('/api/v1/auth/forgot-password', {
      email,
    })
    return response.data
  },

  async resetPassword(token: string, newPassword: string): Promise<{ detail: string }> {
    const response = await api.post<{ detail: string }>('/api/v1/auth/reset-password', {
      token,
      new_password: newPassword,
    })
    return response.data
  },

  async verifyEmail(token: string): Promise<{ detail: string }> {
    const response = await api.post<{ detail: string }>('/api/v1/auth/verify-email', {
      token,
    })
    return response.data
  },

  async resendVerification(email: string): Promise<{ detail: string }> {
    const response = await api.post<{ detail: string }>('/api/v1/auth/resend-verification', {
      email,
    })
    return response.data
  },
}
