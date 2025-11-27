import api from './api'
import type { Challenge } from '../types/api'

// Helper to normalize difficulty from backend format to frontend format
function normalizeDifficulty(backendDifficulty: string): 'EASY' | 'MEDIUM' | 'HARD' {
  const normalized = backendDifficulty.toUpperCase()
  if (normalized === 'EASY' || normalized === 'MEDIUM' || normalized === 'HARD') {
    return normalized as 'EASY' | 'MEDIUM' | 'HARD'
  }
  // Map backend format to frontend format
  if (backendDifficulty === 'Easy') return 'EASY'
  if (backendDifficulty === 'Medium') return 'MEDIUM'
  if (backendDifficulty === 'Hard') return 'HARD'
  return 'EASY' // default
}

// Helper to convert frontend difficulty to backend format
function toBackendDifficulty(difficulty: string): string {
  if (difficulty === 'EASY') return 'Easy'
  if (difficulty === 'MEDIUM') return 'Medium'
  if (difficulty === 'HARD') return 'Hard'
  return difficulty
}

// Helper to normalize challenge from backend format
function normalizeChallenge(challenge: any): Challenge {
  // Normalize status: backend uses lowercase 'published', frontend expects uppercase
  const normalizeStatus = (status: string): Challenge['status'] => {
    const upper = status.toUpperCase()
    if (upper === 'DRAFT' || upper === 'PUBLISHED' || upper === 'ARCHIVED') {
      return upper as Challenge['status']
    }
    return status as Challenge['status']
  }

  return {
    ...challenge,
    difficulty: normalizeDifficulty(challenge.difficulty),
    status: normalizeStatus(challenge.status || 'DRAFT'),
    testCases: challenge.testCases?.map((tc: any) => ({
      input: tc.input,
      output: tc.expectedOutput || tc.output, // Backend uses expectedOutput
    })) || [],
  }
}

export async function getChallenges(filters?: {
  difficulty?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<Challenge[]> {
  try {
    const params = new URLSearchParams()
    
    // Convert difficulty from frontend format (EASY) to backend format (Easy)
    if (filters?.difficulty) {
      params.append('difficulty', toBackendDifficulty(filters.difficulty))
    }
    
    // Backend uses 'q' for search, not 'search'
    if (filters?.search) {
      // Use search endpoint if search query provided
      try {
        const searchRes = await api.get(`/challenges/search?q=${encodeURIComponent(filters.search)}`)
        const challenges = Array.isArray(searchRes.data?.data) ? searchRes.data.data : []
        return challenges.map(normalizeChallenge)
      } catch (searchError) {
        console.error('Search failed, falling back to regular list:', searchError)
        // Fall through to regular list if search fails
      }
    }
    
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    // Add status filter to only get published challenges by default
    if (!params.has('status')) {
      params.append('status', 'published')
    }
    
    const res = await api.get(`/challenges?${params.toString()}`)
    
    // Backend returns { success: true, data: [...] } directly, not nested in challenges
    const challenges = Array.isArray(res.data?.data) ? res.data.data : []
    
    if (!res.data?.success) {
      console.warn('API returned unsuccessful response:', res.data)
    }
    
    return challenges.map(normalizeChallenge)
  } catch (error: any) {
    console.error('Failed to fetch challenges:', error)
    if (error?.response) {
      console.error('Response status:', error.response.status)
      console.error('Response data:', error.response.data)
    }
    return []
  }
}

export async function getChallenge(id: string): Promise<Challenge | null> {
  try {
    const res = await api.get(`/challenges/${id}`)
    
    // Backend returns { success: true, data: challenge } directly, not nested
    const challenge = res.data?.data
    
    if (!res.data?.success) {
      console.warn('API returned unsuccessful response:', res.data)
      return null
    }
    
    if (!challenge) {
      console.warn('Challenge not found:', id)
      return null
    }
    
    return normalizeChallenge(challenge)
  } catch (error: any) {
    console.error('Failed to fetch challenge:', error)
    if (error?.response) {
      console.error('Response status:', error.response.status)
      console.error('Response data:', error.response.data)
      if (error.response.status === 404) {
        return null // Challenge not found is expected, not an error
      }
    }
    return null
  }
}

