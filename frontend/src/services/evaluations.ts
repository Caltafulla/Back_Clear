import api from './api'
import { requestQueue } from '../utils/requestQueue'

export interface Evaluation {
  id: string
  name: string
  description: string
  courseId: string
  challengeIds: string[]
  startDate: string | Date
  endDate: string | Date
  durationMinutes: number
  maxAttempts: number
  status: 'draft' | 'scheduled' | 'active' | 'finished' | 'cancelled'
  createdBy?: string
  createdAt?: string | Date
  updatedAt?: string | Date
}

export async function getEvaluations(params?: { limit?: number; offset?: number; courseId?: string; status?: string }): Promise<Evaluation[]> {
  try {
    const qs = new URLSearchParams()
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.offset) qs.set('offset', String(params.offset))
    // Backend uses if-else, so prioritize courseId if provided
    if (params?.courseId) {
      qs.set('courseId', params.courseId)
    } else if (params?.status) {
      // Only use status if no courseId
      qs.set('status', params.status)
    }
    
    console.log('getEvaluations: Fetching with params:', params, 'query:', qs.toString())
    
    const res = await requestQueue.add(() => 
      api.get(`/evaluations?${qs.toString()}`)
    )
    
    console.log('getEvaluations: Response received:', {
      status: res.status,
      success: res.data?.success,
      dataType: Array.isArray(res.data?.data) ? 'array' : typeof res.data?.data,
      dataLength: Array.isArray(res.data?.data) ? res.data.data.length : 'N/A',
      fullData: res.data
    })
    
    const data = res.data?.data
    let evaluations: any[] = []
    
    if (Array.isArray(data)) {
      evaluations = data
    } else if (data?.evaluations && Array.isArray(data.evaluations)) {
      evaluations = data.evaluations
    } else if (data && typeof data === 'object') {
      // Single evaluation object
      evaluations = [data]
    }
    
    console.log('getEvaluations: Found', evaluations.length, 'evaluations')
    
    const mapped = evaluations.map((e: any) => {
      const normalized = {
        id: e.id || e._id || '',
        name: e.name || '',
        description: e.description || '',
        courseId: e.courseId || '',
        challengeIds: Array.isArray(e.challengeIds) ? e.challengeIds : [],
        startDate: e.startDate,
        endDate: e.endDate,
        durationMinutes: e.durationMinutes || 0,
        maxAttempts: e.maxAttempts || 1,
        status: (e.status || 'draft').toLowerCase(),
        createdBy: e.createdBy,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      }
      console.log('getEvaluations: Normalized evaluation:', normalized.id, normalized.name, normalized.status)
      return normalized
    })
    
    return mapped
  } catch (error: any) {
    console.error('getEvaluations: Error fetching evaluations:', {
      error: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      fullError: error
    })
    return []
  }
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

