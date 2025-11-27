import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/auth'
import { useAuthStore } from '../stores/auth-store'
import styles from '../styles/Login.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const setUser = useAuthStore((s: import('../stores/auth-store').AuthState) => s.setUser)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    try {
      const data = await login(email, password)
      // Defensive: ensure the response has the expected shape
      if (!data || !data.access_token) {
        setError('Invalid response from server')
        return
      }
      if (!data.user) {
        // If backend returns a message, show it
        setError(data.message || 'Authenticated but user info missing')
        return
      }

      localStorage.setItem('access_token', data.access_token)
      setUser(data.user)
      if (data.user.role === 'ADMIN') navigate('/admin')
      else navigate('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.message || String(err))
    }
  }

  return (
    <div className={styles.container}>
      <form onSubmit={submit} className={styles.form}>
        <h2>Login</h2>
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">Sign in</button>
        {error && <div className={styles.error}>{error}</div>}
      </form>
    </div>
  )
}
