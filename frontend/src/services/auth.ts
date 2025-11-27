import api from './api'

export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password })
  // Backend returns { success: true, data: { user, token } }
  return res.data?.data
}

export async function getProfile() {
  const res = await api.get('/auth/me')
  // returns { success: true, data: { user } }
  return res.data?.data?.user
}
