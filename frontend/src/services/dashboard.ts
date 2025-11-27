import api from './api'
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
    const [submissionsRes, challengesRes, mySubmissionsRes] = await Promise.all([
      api.get('/submissions/my?limit=10'),
      api.get('/challenges?limit=100'),
      api.get('/submissions/my?limit=5'),
    ])

    const submissions = mySubmissionsRes.data?.data?.submissions || []
    const challenges = challengesRes.data?.data?.challenges || []
    
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
    const res = await api.get('/submissions/stats')
    return res.data?.data || {}
  } catch (error) {
    console.error('Failed to fetch submission stats:', error)
    return {}
  }
}

