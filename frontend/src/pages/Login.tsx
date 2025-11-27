import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/auth'
import { useAuthStore } from '../stores/auth-store'
import '../styles/global.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setUser = useAuthStore((s: import('../stores/auth-store').AuthState) => s.setUser)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    setLoading(true)
    try {
      const data = await login(email, password)
      // data should be { user, token }
      if (!data || !data.token) {
        setError('Invalid response from server')
        setLoading(false)
        return
      }
      if (!data.user) {
        setError(data.message || 'Authenticated but user info missing')
        setLoading(false)
        return
      }

      localStorage.setItem('access_token', data.token)
      setUser(data.user)
      if (data.user.role === 'ADMIN') navigate('/admin')
      else navigate('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--gray-50)' }}>
      <div className="card" style={{ width: 360 }}>
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Login</h2>
        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <label style={{ fontSize: '0.85rem' }}>Email
            <input value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 6 }} />
          </label>
          <label style={{ fontSize: '0.85rem' }}>Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 6 }} />
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>{loading ? 'Signing...' : 'Sign in'}</button>
          </div>
          {error && <div style={{ color: 'var(--error)', fontSize: '0.9rem' }}>{error}</div>}
        </form>
      </div>
    </div>
  )
}
