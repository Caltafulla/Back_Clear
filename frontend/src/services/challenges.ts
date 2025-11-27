import api from './api'
import type { Challenge } from '../types/api'

export async function getChallenges(filters?: {
  difficulty?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<Challenge[]> {
  try {
    const params = new URLSearchParams()
    if (filters?.difficulty) params.append('difficulty', filters.difficulty)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const res = await api.get(`/challenges?${params.toString()}`)
    return res.data?.data?.challenges || []
  } catch (error) {
    console.error('Failed to fetch challenges:', error)
    return []
  }
}

export async function getChallenge(id: string): Promise<Challenge | null> {
  try {
    const res = await api.get(`/challenges/${id}`)
    return res.data?.data?.challenge || null
  } catch (error) {
    console.error('Failed to fetch challenge:', error)
    return null
  }
}

