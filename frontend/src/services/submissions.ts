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

export async function getMySubmissions(params: { challengeId?: string; limit?: number; offset?: number }) {
  const query = new URLSearchParams()
  if (params.challengeId) query.append('challengeId', params.challengeId)
  if (params.limit) query.append('limit', params.limit.toString())
  if (params.offset) query.append('offset', params.offset.toString())

  const url = query.toString() ? `/submissions/my?${query.toString()}` : '/submissions/my'
  const res = await requestQueue.add(() => api.get(url))
  const data = Array.isArray(res.data?.data) ? res.data.data : []
  return data
    .map(normalizeSubmission)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

