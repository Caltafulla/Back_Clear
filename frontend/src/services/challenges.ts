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
  if (!challenge) return challenge

  const normalizeStatus = (status: string): Challenge['status'] => {
    const upper = status?.toUpperCase?.() || 'DRAFT'
    if (upper === 'DRAFT' || upper === 'PUBLISHED' || upper === 'ARCHIVED') {
      return upper as Challenge['status']
    }
    return 'DRAFT'
  }

  const normalizedChallenge: Challenge = {
    id: (challenge.id || challenge._id || challenge.challengeId || '').toString(),
    title: challenge.title || 'Untitled challenge',
    description: challenge.description || '',
    difficulty: normalizeDifficulty(challenge.difficulty || 'Easy'),
    tags: Array.isArray(challenge.tags) ? challenge.tags : [],
    timeLimit: challenge.timeLimit ?? 1000,
    memoryLimit: challenge.memoryLimit ?? 256,
    status: normalizeStatus(challenge.status || 'DRAFT'),
    testCases: Array.isArray(challenge.testCases)
      ? challenge.testCases
          .filter((tc: any) => !tc?.isHidden) // never show hidden cases in UI
          .map((tc: any) => ({
          input: tc.input,
          output: tc.expectedOutput || tc.output || '',
        }))
      : [],
    courseId: challenge.courseId,
    createdBy: challenge.createdBy,
    createdAt: challenge.createdAt,
    updatedAt: challenge.updatedAt,
  }

  return normalizedChallenge
}

function extractChallengeList(raw: any): any[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw.challenges)) return raw.challenges
  if (Array.isArray(raw.data)) return raw.data
  if (Array.isArray(raw.items)) return raw.items
  return []
}

function dedupeChallenges(challenges: Challenge[]): Challenge[] {
  const map = new Map<string, Challenge>()
  challenges.forEach((challenge) => {
    if (!challenge) return
    const key = (challenge.id || challenge.title || '').toString().toLowerCase()
    if (!key) return
    if (!map.has(key)) {
      map.set(key, challenge)
    }
  })
  return Array.from(map.values())
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
        let challenges = extractChallengeList(searchRes.data?.data)
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
        
        challenges = dedupeChallenges(challenges)
        return challenges
      } catch (searchError) {
        console.error('Search failed, falling back to regular list:', searchError)
        // Fall through to regular list if search fails
      }
    }
    
    // Regular list endpoint - backend uses if-else, so we need to handle filtering client-side
    const params = new URLSearchParams()
    
    // Optional filters
    // Pass through filters supported by backend
    if (filters?.difficulty) {
      params.append('difficulty', toBackendDifficulty(filters.difficulty))
    }
    
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())
    
    const res = await requestQueue.add(() => 
      api.get(`/challenges?${params.toString()}`)
    )

    let challenges = extractChallengeList(res.data?.data)
    
    if (!res.data?.success) {
      console.warn('API returned unsuccessful response:', res.data)
    }
    
    challenges = challenges.map(normalizeChallenge)
    
    // Apply difficulty filter client-side if backend ignored it
    if (filters?.difficulty) {
      const targetDifficulty = filters.difficulty
      challenges = challenges.filter(c => c.difficulty === targetDifficulty)
    }
    
    challenges = dedupeChallenges(challenges)
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

