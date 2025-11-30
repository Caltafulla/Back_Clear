import api from './api'
import type { User } from '../types/api'

// Helper to normalize user data from backend
function normalizeUser(user: any): User {
  if (!user) return user
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

export async function getUsersByRole(role: 'STUDENT' | 'PROFESSOR' | 'ADMIN'): Promise<User[]> {
  try {
    const res = await api.get(`/users?role=${role}`)
    const data = res.data?.data
    const users = Array.isArray(data) ? data : data?.users || []
    return users.map(normalizeUser)
  } catch (error) {
    console.error('Failed to get users by role:', error)
    return []
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const res = await api.get(`/users/email/${encodeURIComponent(email)}`)
    const data = res.data?.data
    return data?.user ? normalizeUser(data.user) : null
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null
    }
    console.error('Failed to get user by email:', error)
    throw error
  }
}

