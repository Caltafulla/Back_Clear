import api from './api'

export async function getMetrics() {
  const res = await api.get('/metrics')
  return res.data?.data || {}
}

