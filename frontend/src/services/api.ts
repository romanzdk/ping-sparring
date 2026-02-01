import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 errors – redirect to login with return URL
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      const path = window.location.pathname + window.location.search
      // Don't redirect if already on login page - let the login form handle the error
      if (!path.startsWith('/login')) {
        const next = encodeURIComponent(path)
        window.location.href = `/login?next=${next}`
      }
    }
    return Promise.reject(error)
  }
)

export default api
