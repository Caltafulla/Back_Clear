import api from './api'
import { requestQueue } from '../utils/requestQueue'
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
    // If search is provided, use search endpoint and filter results client-side
    if (filters?.search) {
      try {
        const searchRes = await requestQueue.add(() => 
          api.get(`/challenges/search?q=${encodeURIComponent(filters.search)}`)
        )
        let challenges = Array.isArray(searchRes.data?.data) ? searchRes.data.data : []
        challenges = challenges.map(normalizeChallenge)
        
        // Apply difficulty filter client-side if provided
        if (filters?.difficulty) {
          const targetDifficulty = toBackendDifficulty(filters.difficulty)
          challenges = challenges.filter(c => {
            // Normalize challenge difficulty for comparison
            const challengeDiff = c.difficulty === 'EASY' ? 'Easy' : 
                                 c.difficulty === 'MEDIUM' ? 'Medium' : 
                                 c.difficulty === 'HARD' ? 'Hard' : c.difficulty
            return challengeDiff === targetDifficulty
          })
        }
        
        // Filter by published status
        challenges = challenges.filter(c => 
          c.status === 'PUBLISHED' || c.status === 'published'
        )
        
        return challenges
      } catch (searchError) {
        console.error('Search failed, falling back to regular list:', searchError)
        // Fall through to regular list if search fails
      }
    }
    
    // Regular list endpoint - backend uses if-else, so we need to handle filtering client-side
    const params = new URLSearchParams()
    
    // Get all published challenges first (backend prioritizes status)
    params.append('status', 'published')
    
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())
    
    const res = await requestQueue.add(() => 
      api.get(`/challenges?${params.toString()}`)
    )
    
    // Backend returns { success: true, data: [...] } directly, not nested in challenges
    let challenges = Array.isArray(res.data?.data) ? res.data.data : []
    
    if (!res.data?.success) {
      console.warn('API returned unsuccessful response:', res.data)
    }
    
    challenges = challenges.map(normalizeChallenge)
    
    // Always filter by published status client-side (safety check)
    challenges = challenges.filter(c => 
      c.status === 'PUBLISHED' || c.status === 'published'
    )
    
    // Apply difficulty filter client-side (backend doesn't combine with status)
    if (filters?.difficulty) {
      const targetDifficulty = filters.difficulty
      challenges = challenges.filter(c => c.difficulty === targetDifficulty)
    }
    
    return challenges
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
    const res = await requestQueue.add(() => 
      api.get(`/challenges/${id}`)
    )
    
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

