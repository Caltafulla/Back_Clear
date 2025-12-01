import api from './api'

export async function getCourses(params?: { limit?: number; offset?: number; period?: string }) {
  const qs = new URLSearchParams()
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.offset) qs.set('offset', String(params.offset))
  if (params?.period) qs.set('period', params.period)
  const res = await api.get(`/courses?${qs.toString()}`)
  const data = res.data?.data
  return Array.isArray(data) ? data : data?.courses || []
}

export async function createCourse(payload: {
  name: string
  code: string
  description: string
  period: string
  group: number
  professorIds?: string[]
}) {
  const res = await api.post('/courses', payload)
  return res.data?.data || {}
}

export async function updateCourse(id: string, payload: any) {
  const res = await api.put(`/courses/${id}`, payload)
  return res.data?.data || {}
}

export async function deleteCourse(id: string) {
  const res = await api.delete(`/courses/${id}`)
  return res.data?.data || {}
}

export async function enrollStudent(courseId: string, studentId: string) {
  const res = await api.post(`/courses/${courseId}/enroll`, { studentId })
  return res.data?.data || {}
}

export async function enrollStudentByEmail(courseId: string, email: string) {
  try {
    const res = await api.post(`/courses/${courseId}/enroll-by-email`, { email })
    // Backend returns { success: true, data: enrollment }
    if (res.data?.success && res.data?.data) {
      return res.data.data
    }
    // If response doesn't have expected structure, return the whole response
    return res.data || {}
  } catch (error: any) {
    // Re-throw with more context
    const message = error?.response?.data?.message || error?.message || 'Failed to enroll student'
    throw new Error(message)
  }
}

