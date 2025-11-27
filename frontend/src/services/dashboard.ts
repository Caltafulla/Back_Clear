import api from './api'
import { requestQueue } from '../utils/requestQueue'
import type { Challenge, Submission } from '../types/api'

export interface DashboardStats {
  submissions: {
    total: number
    accepted: number
    today: number
    successRate: number
  }
  challenges: {
    total: number
    completed: number
    inProgress: number
  }
  recentSubmissions: Submission[]
  activeChallenges: Challenge[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Use request queue to prevent too many simultaneous requests
    const submissionsRes = await requestQueue.add(() => 
      api.get('/submissions/my?limit=10')
    )
    
    const challengesRes = await requestQueue.add(() => 
      api.get('/challenges?status=published&limit=100')
    )
    
    // Use the same submissions data for both recent and stats
    // Backend may return data as array directly or nested in submissions
    const submissions = Array.isArray(submissionsRes.data?.data)
      ? submissionsRes.data.data
      : submissionsRes.data?.data?.submissions || []
    const challenges = Array.isArray(challengesRes.data?.data) 
      ? challengesRes.data.data 
      : challengesRes.data?.data?.challenges || []
    
    const accepted = submissions.filter((s: Submission) => s.status === 'ACCEPTED').length
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todaySubmissions = submissions.filter((s: Submission) => 
      new Date(s.createdAt) >= today
    )

    return {
      submissions: {
        total: submissions.length,
        accepted,
        today: todaySubmissions.length,
        successRate: submissions.length > 0 ? (accepted / submissions.length) * 100 : 0,
      },
      challenges: {
        total: challenges.length,
        completed: 0, // TODO: Calculate based on accepted submissions
        inProgress: 0, // TODO: Calculate based on pending submissions
      },
      recentSubmissions: submissions.slice(0, 5),
      activeChallenges: challenges.slice(0, 5),
    }
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return {
      submissions: { total: 0, accepted: 0, today: 0, successRate: 0 },
      challenges: { total: 0, completed: 0, inProgress: 0 },
      recentSubmissions: [],
      activeChallenges: [],
    }
  }
}

export async function getSubmissionStats() {
  try {
    const res = await requestQueue.add(() => 
      api.get('/submissions/stats')
    )
    return res.data?.data || {}
  } catch (error) {
    console.error('Failed to fetch submission stats:', error)
    return {}
  }
}

