import api from './api'

export async function getEvaluations(params?: { limit?: number; offset?: number; courseId?: string; status?: string }) {
  const qs = new URLSearchParams()
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.offset) qs.set('offset', String(params.offset))
  if (params?.courseId) qs.set('courseId', params.courseId)
  if (params?.status) qs.set('status', params.status)
  const res = await api.get(`/evaluations?${qs.toString()}`)
  const data = res.data?.data
  return Array.isArray(data) ? data : data?.evaluations || []
}

export async function createEvaluation(payload: {
  name: string
  description: string
  courseId: string
  challengeIds: string[]
  startDate: string
  endDate: string
  durationMinutes: number
  maxAttempts: number
}) {
  const res = await api.post('/evaluations', payload)
  return res.data?.data || {}
}

export async function updateEvaluation(id: string, payload: any) {
  const res = await api.put(`/evaluations/${id}`, payload)
  return res.data?.data || {}
}

export async function deleteEvaluation(id: string) {
  const res = await api.delete(`/evaluations/${id}`)
  return res.data?.data || {}
}

