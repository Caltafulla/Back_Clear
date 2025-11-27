import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle rate limiting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 429 errors specifically
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after']
      const message = error.response.data?.message || 'Too many requests. Please wait a moment.'
      
      console.warn('Rate limited:', {
        url: error.config?.url,
        retryAfter,
        message
      })
      
      // Don't retry automatically, let the caller handle it
      return Promise.reject(error)
    }
    
    return Promise.reject(error)
  }
)

export default api
