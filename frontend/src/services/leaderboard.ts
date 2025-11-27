import api from './api'
import { requestQueue } from '../utils/requestQueue'

export type LeaderboardRow = {
  rank: number
  userId?: string
  userName: string
  score: number
  totalTime?: number
}

export type LeaderboardFilters = {
  language?: 'python' | 'javascript' | 'cpp' | 'java'
  from?: string // ISO
  to?: string   // ISO
  includeEvaluationSubmissions?: boolean
  publicMode?: boolean
}

function toQuery(params: Record<string, any>): string {
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    usp.append(k, String(v))
  }
  const s = usp.toString()
  return s ? `?${s}` : ''
}

export async function getChallengeLeaderboard(challengeId: string, limit = 50, filters?: LeaderboardFilters): Promise<LeaderboardRow[]> {
  if (!challengeId) return []
  const path = filters?.publicMode ? `/leaderboard/public/challenge/${challengeId}` : `/leaderboard/challenge/${challengeId}`
  const res = await requestQueue.add(() => {
    const queryParams = {
      limit,
      language: filters?.language,
      from: filters?.from,
      to: filters?.to,
      includeEvaluationSubmissions: filters?.includeEvaluationSubmissions
    }
    console.log('getChallengeLeaderboard: Sending query params:', queryParams)
    const q = toQuery(queryParams)
    console.log('getChallengeLeaderboard: Query string:', q)
    return api.get(`${path}${q}`)
  })
  const rankings = res.data?.data?.rankings || []
  return rankings.map((r: any) => ({
    rank: r.rank ?? 0,
    userId: r.user?.id,
    userName: r.user?.name || 'Unknown',
    score: r.score ?? 0,
    totalTime: r.totalTime,
  }))
}

export async function getCourseLeaderboard(courseId: string, limit = 50, filters?: LeaderboardFilters): Promise<LeaderboardRow[]> {
  if (!courseId) {
    console.warn('getCourseLeaderboard: No courseId provided')
    return []
  }
  
  try {
    const path = filters?.publicMode ? `/leaderboard/public/course/${courseId}` : `/leaderboard/course/${courseId}`
    const res = await requestQueue.add(() => {
      const queryParams = {
        limit,
        language: filters?.language,
        from: filters?.from,
        to: filters?.to,
        includeEvaluationSubmissions: filters?.includeEvaluationSubmissions
      }
      console.log('getCourseLeaderboard: Sending query params:', queryParams)
      const q = toQuery(queryParams)
      console.log('getCourseLeaderboard: Query string:', q)
      return api.get(`${path}${q}`)
    })
    
    console.log('getCourseLeaderboard: Response received:', {
      status: res.status,
      success: res.data?.success,
      dataKeys: res.data?.data ? Object.keys(res.data.data) : [],
      fullData: res.data
    })
    
    // Backend returns: { success: true, data: { rankings: [...] } }
    let rankings: any[] = []
    
    if (res.data?.success && res.data?.data) {
      // Primary format: { success: true, data: { rankings: [...] } }
      if (Array.isArray(res.data.data.rankings)) {
        rankings = res.data.data.rankings
        console.log('getCourseLeaderboard: Found rankings array with', rankings.length, 'entries')
      } 
      // Fallback: data might be the array directly
      else if (Array.isArray(res.data.data)) {
        rankings = res.data.data
        console.log('getCourseLeaderboard: Found data as array with', rankings.length, 'entries')
      }
      // Fallback: entries might be nested
      else if (Array.isArray(res.data.data.entries)) {
        rankings = res.data.data.entries
        console.log('getCourseLeaderboard: Found entries array with', rankings.length, 'entries')
      } else {
        console.warn('getCourseLeaderboard: Unexpected data format:', res.data.data)
      }
    } else {
      console.warn('getCourseLeaderboard: Response not successful or missing data:', res.data)
    }
    
    if (rankings.length === 0) {
      console.log('getCourseLeaderboard: No rankings found, returning empty array')
      return []
    }
    
    const mapped = rankings.map((r: any) => {
      const userName = r.user?.name 
        || (r.firstName || r.lastName ? `${r.firstName || ''} ${r.lastName || ''}`.trim() : 'Unknown')
        || 'Unknown'
      
      return {
        rank: r.rank ?? 0,
        userId: r.user?.id || r.userId,
        userName: userName,
        score: r.score ?? 0,
        totalTime: r.totalTime || r.averageTimeMs,
      }
    })
    
    console.log('getCourseLeaderboard: Mapped', mapped.length, 'entries')
    return mapped
  } catch (error: any) {
    console.error('getCourseLeaderboard: Error fetching course leaderboard:', {
      courseId,
      error: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      fullError: error
    })
    
    if (error?.response?.status === 404) {
      console.warn('getCourseLeaderboard: Course leaderboard not found (404) for course:', courseId)
    } else if (error?.response?.status === 500) {
      console.error('getCourseLeaderboard: Server error (500) for course:', courseId)
    }
    
    return []
  }
}

export async function getEvaluationLeaderboard(evaluationId: string, limit = 50, filters?: LeaderboardFilters): Promise<LeaderboardRow[]> {
  if (!evaluationId) return []
  const path = filters?.publicMode ? `/leaderboard/public/evaluation/${evaluationId}` : `/leaderboard/evaluation/${evaluationId}`
  const res = await requestQueue.add(() => {
    const q = toQuery({
      limit,
      language: filters?.language,
      from: filters?.from,
      to: filters?.to
    })
    return api.get(`${path}${q}`)
  })
  const entries = res.data?.data?.entries || []
  return entries.map((e: any) => ({
    rank: e.rank ?? 0,
    userId: e.userId,
    userName: `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Unknown',
    score: e.score ?? 0,
    totalTime: e.averageTimeMs,
  }))
}

export async function listCourses() {
  try {
    const res = await requestQueue.add(() => 
      api.get('/courses?limit=100')
    )
    // Backend returns { success, data } where data may be array or wrapped
    const data = res.data?.data
    const courses = Array.isArray(data) ? data : data?.courses || []
    
    // Ensure all courses have required fields
    return courses.map((c: any) => ({
      id: c.id || c._id || '',
      name: c.name || '',
      code: c.code || '',
      title: c.title || c.name || '',
      ...c
    }))
  } catch (error: any) {
    console.error('Failed to fetch courses:', error)
    return []
  }
}

export async function listEvaluations() {
  const res = await requestQueue.add(() => 
    api.get('/evaluations?limit=100')
  )
  const data = res.data?.data
  return Array.isArray(data) ? data : data?.evaluations || []
}

