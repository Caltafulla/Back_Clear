import { create } from 'zustand'
import { User } from '../types/api'
import { getProfile } from '../services/auth'

export interface AuthState {
  user?: User | null
  isLoading: boolean
  isInitialized: boolean // Flag to track if initial load has been attempted
  setUser: (u: User | null) => void
  logout: () => void
  loadUser: () => Promise<void>
}

// Global flag to prevent concurrent calls
let loadingPromise: Promise<void> | null = null
let lastLoadAttempt = 0
const MIN_LOAD_INTERVAL = 10000 // Minimum 10 seconds between load attempts

// Helper function for exponential backoff retry (reduced retries to avoid rate limiting)
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 1, // Reduced to 1 retry only
  baseDelay = 3000 // Increased base delay to 3 seconds
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      // Only retry on 429 errors, and only once
      if (error?.response?.status === 429 && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}

// Try to restore user from sessionStorage on initialization
const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null
  try {
    const stored = sessionStorage.getItem('auth_user')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn('Failed to parse stored user:', e)
  }
  return null
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getStoredUser(), // Try to restore from sessionStorage
  isLoading: false,
  isInitialized: false,
  setUser: (u) => {
    // Store user in sessionStorage for persistence across navigation
    if (typeof window !== 'undefined') {
      if (u) {
        sessionStorage.setItem('auth_user', JSON.stringify(u))
      } else {
        sessionStorage.removeItem('auth_user')
      }
    }
    set({ user: u, isInitialized: true })
  },
  logout: () => {
    localStorage.removeItem('access_token')
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_user')
      // Redirect to login page
      window.location.href = '/login'
    }
    set({ user: null, isInitialized: true })
  },
  loadUser: async () => {
    // If already loading, return the existing promise
    if (loadingPromise) {
      return loadingPromise
    }

    const state = get()
    const token = localStorage.getItem('access_token')
    
    // If we already have a user, don't reload
    if (state.user && token) {
      set({ isInitialized: true })
      return
    }

    // If no token, mark as initialized and return
    if (!token) {
      set({ user: null, isLoading: false, isInitialized: true })
      return
    }

    // Rate limit: don't attempt to load if we tried recently
    const now = Date.now()
    if (now - lastLoadAttempt < MIN_LOAD_INTERVAL && state.isInitialized) {
      console.warn('Skipping loadUser: too soon after last attempt')
      return
    }

    lastLoadAttempt = now

    // Create a promise that will be reused if called multiple times
    loadingPromise = (async () => {
      set({ isLoading: true })
      try {
        // Only 1 retry with 3 second delay to avoid rate limiting
        const user = await retryWithBackoff(() => getProfile(), 1, 3000)
        // Store user in sessionStorage for persistence
        if (user && typeof window !== 'undefined') {
          sessionStorage.setItem('auth_user', JSON.stringify(user))
        }
        set({ user, isLoading: false, isInitialized: true })
      } catch (error: any) {
        console.error('Failed to load user after retries:', error)
        
        // If it's a 429 error after retries, don't clear the token
        // Try to use stored user if available
        if (error?.response?.status === 429) {
          console.warn('Rate limited after retries, keeping token but not loading user')
          const storedUser = getStoredUser()
          if (storedUser) {
            console.log('Using stored user from sessionStorage')
            set({ user: storedUser, isLoading: false, isInitialized: true })
          } else {
            set({ isLoading: false, isInitialized: true })
          }
          // Don't clear token on rate limit - user might still be valid
          return
        }
        
        // For other errors (401, etc), clear token
        if (error?.response?.status === 401) {
          localStorage.removeItem('access_token')
          set({ user: null, isLoading: false, isInitialized: true })
        } else {
          // For other errors, keep token but mark as initialized
          set({ isLoading: false, isInitialized: true })
        }
      } finally {
        // Clear the promise after completion
        loadingPromise = null
      }
    })()

    return loadingPromise
  }
}))
