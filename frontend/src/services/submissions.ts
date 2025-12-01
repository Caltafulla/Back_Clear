import api from './api'
import { requestQueue } from '../utils/requestQueue'
import type { Submission, Language } from '../types/api'

type SubmitSolutionPayload = {
  challengeId: string
  courseId: string
  language: Language
  code: string
}

function normalizeSubmission(data: any): Submission {
  return {
    id: data.id || data._id || '',
    challengeId: data.challengeId,
    courseId: data.courseId,
    code: data.code,
    language: data.language,
    status: data.status,
    executionTime: data.timeMsTotal ?? data.executionTime,
    memoryUsage: data.memoryKbTotal ?? data.memoryUsage,
    score: data.score,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    errorMessage: data.errorMessage,
    testCaseResults: Array.isArray(data.testCaseResults)
      ? data.testCaseResults.map((tc: any) => ({
          caseId: tc.caseId || '',
          status: tc.status,
          timeMs: tc.timeMs,
          memoryKb: tc.memoryKb,
          actualOutput: tc.actualOutput,
          expectedOutput: tc.expectedOutput,
          errorMessage: tc.errorMessage,
        }))
      : [],
  }
}

export async function submitSolution(payload: SubmitSolutionPayload): Promise<Submission> {
  const res = await requestQueue.add(() => api.post('/submissions', payload))
  return normalizeSubmission(res.data?.data)
}

export async function getSubmissionById(submissionId: string): Promise<Submission | null> {
  try {
    const res = await requestQueue.add(() => api.get(`/submissions/${submissionId}`))
    
    // Backend returns { success: true, data: submission }
    const submission = res.data?.data
    if (!submission) {
      return null
    }
    
    return normalizeSubmission(submission)
  } catch (error: any) {
    console.error('Failed to fetch submission:', error)
    if (error?.response?.status === 404) {
      return null
    }
    throw error
  }
}

export async function getMySubmissions(params: { challengeId?: string; limit?: number; offset?: number }): Promise<Submission[]> {
  const query = new URLSearchParams()
  if (params.challengeId) query.append('challengeId', params.challengeId)
  if (params.limit) query.append('limit', params.limit.toString())
  if (params.offset) query.append('offset', params.offset.toString())

  const url = query.toString() ? `/submissions/my?${query.toString()}` : '/submissions/my'
  const res = await requestQueue.add(() => api.get(url))
  
  // Backend may return data as array directly or nested
  let data: any[] = []
  if (Array.isArray(res.data?.data)) {
    data = res.data.data
  } else if (Array.isArray(res.data?.data?.submissions)) {
    data = res.data.data.submissions
  } else if (res.data?.data && !Array.isArray(res.data.data)) {
    // Single submission object
    data = [res.data.data]
  }
  
  return data
    .map(normalizeSubmission)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

