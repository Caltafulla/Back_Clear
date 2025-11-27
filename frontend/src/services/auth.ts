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
  } catch (error) {
    console.error('Failed to get profile:', error)
    return null
  }
}
