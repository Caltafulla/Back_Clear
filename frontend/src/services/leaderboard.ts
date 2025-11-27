import api from './api'
import { requestQueue } from '../utils/requestQueue'

export type LeaderboardRow = {
  rank: number
  userId?: string
  userName: string
  score: number
  totalTime?: number
}

export async function getChallengeLeaderboard(challengeId: string, limit = 50): Promise<LeaderboardRow[]> {
  if (!challengeId) return []
  const res = await requestQueue.add(() => 
    api.get(`/leaderboard/challenge/${challengeId}?limit=${limit}`)
  )
  const rankings = res.data?.data?.rankings || []
  return rankings.map((r: any) => ({
    rank: r.rank ?? 0,
    userId: r.user?.id,
    userName: r.user?.name || 'Unknown',
    score: r.score ?? 0,
    totalTime: r.totalTime,
  }))
}

export async function getCourseLeaderboard(courseId: string, limit = 50): Promise<LeaderboardRow[]> {
  if (!courseId) return []
  const res = await requestQueue.add(() => 
    api.get(`/leaderboard/course/${courseId}?limit=${limit}`)
  )
  const rankings = res.data?.data?.rankings || []
  return rankings.map((r: any) => ({
    rank: r.rank ?? 0,
    userId: r.user?.id,
    userName: r.user?.name || 'Unknown',
    score: r.score ?? 0,
    totalTime: r.totalTime,
  }))
}

export async function getEvaluationLeaderboard(evaluationId: string, limit = 50): Promise<LeaderboardRow[]> {
  if (!evaluationId) return []
  const res = await requestQueue.add(() => 
    api.get(`/leaderboard/evaluation/${evaluationId}?limit=${limit}`)
  )
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
  const res = await requestQueue.add(() => 
    api.get('/courses?limit=100')
  )
  // Backend returns { success, data } where data may be array or wrapped
  const data = res.data?.data
  return Array.isArray(data) ? data : data?.courses || []
}

export async function listEvaluations() {
  const res = await requestQueue.add(() => 
    api.get('/evaluations?limit=100')
  )
  const data = res.data?.data
  return Array.isArray(data) ? data : data?.evaluations || []
}

