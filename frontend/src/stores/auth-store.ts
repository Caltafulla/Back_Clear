import { create } from 'zustand'
import { User } from '../types/api'

export interface AuthState {
  user?: User | null
  setUser: (u: User | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
  logout: () => {
    localStorage.removeItem('access_token')
    set({ user: null })
  }
}))
