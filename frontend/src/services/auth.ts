import api from './api'
import type { User } from '../types/api'

// Helper to normalize user data from backend
function normalizeUser(user: any): User {
  if (!user) return user
  // Backend returns firstName and lastName, frontend expects name
  const name = user.name || (user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`.trim()
    : user.firstName || user.lastName || user.email || 'User')
  
  return {
    ...user,
    name,
    firstName: user.firstName,
    lastName: user.lastName,
  }
}

export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password })
  // Backend returns { success: true, data: { user, token } }
  const data = res.data?.data
  if (!data) {
    throw new Error('Invalid response from server')
  }
  if (!data.token) {
    throw new Error('Token not received from server')
  }
  if (data?.user) {
    data.user = normalizeUser(data.user)
  }
  return data
}

export async function register(payload: {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: 'STUDENT' | 'ADMIN' | 'PROFESSOR'
}) {
  const res = await api.post('/auth/register', payload)
  const data = res.data?.data
  if (data?.user) {
    data.user = normalizeUser(data.user)
  }
  return data
}

export async function getProfile(): Promise<User | null> {
  try {
    const res = await api.get('/auth/me')
    // returns { success: true, data: { user } }
    const user = res.data?.data?.user
    return user ? normalizeUser(user) : null
  } catch (error: any) {
    // Don't log 429 errors as errors, they're rate limiting
    if (error?.response?.status === 429) {
      console.warn('Rate limited on /auth/me, please wait')
      throw error // Re-throw to let the store handle it
    }
    console.error('Failed to get profile:', error)
    throw error // Re-throw to let the store handle it
  }
}
