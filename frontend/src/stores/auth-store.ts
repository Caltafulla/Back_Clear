import { create } from 'zustand'
import { User } from '../types/api'
import { getProfile } from '../services/auth'

export interface AuthState {
  user?: User | null
  isLoading: boolean
  setUser: (u: User | null) => void
  logout: () => void
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  setUser: (u) => set({ user: u }),
  logout: () => {
    localStorage.removeItem('access_token')
    set({ user: null })
  },
  loadUser: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      set({ user: null, isLoading: false })
      return
    }

    set({ isLoading: true })
    try {
      const user = await getProfile()
      set({ user, isLoading: false })
    } catch (error) {
      console.error('Failed to load user:', error)
      localStorage.removeItem('access_token')
      set({ user: null, isLoading: false })
    }
  }
}))
