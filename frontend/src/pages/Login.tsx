import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/auth'
import { useAuthStore } from '../stores/auth-store'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import styles from '../styles/Login.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState({ email: false, password: false })
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
      // Set user in store - this marks as initialized so we don't reload
      setUser(data.user)
      // Small delay to ensure state is updated
      setTimeout(() => {
        if (data.user.role === 'ADMIN') navigate('/admin')
        else if (data.user.role === 'PROFESSOR') navigate('/professor')
        else navigate('/dashboard')
      }, 100)
    } catch (err: any) {
      // Handle different error types
      if (err?.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.')
      } else if (err?.response?.status === 401) {
        setError('Invalid email or password. Please try again.')
      } else if (err?.response?.status === 400) {
        setError(err?.response?.data?.message || 'Invalid request. Please check your input.')
      } else if (err?.response?.status >= 500) {
        setError('Server error. Please try again later.')
      } else {
        setError(err?.response?.data?.message || err?.message || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.backgroundPattern}></div>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>CJ</span>
            <span className={styles.logoText}>CodeJudge</span>
          </div>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to continue to your account</p>
        </div>

        <form onSubmit={submit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label 
              className={`${styles.label} ${(focused.email || email) ? styles.labelFloating : ''}`}
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocused({ ...focused, email: true })}
              onBlur={() => setFocused({ ...focused, email: false })}
              className={styles.input}
              placeholder=" "
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label 
              className={`${styles.label} ${(focused.password || password) ? styles.labelFloating : ''}`}
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocused({ ...focused, password: true })}
              onBlur={() => setFocused({ ...focused, password: false })}
              className={styles.input}
              placeholder=" "
              disabled={loading}
            />
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className={`btn btn-primary ${styles.submitButton}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign in'
            )}
          </button>

          <div className={styles.footerLinks}>
            <a href="/register" className={styles.link}>Create account</a>
            <span className={styles.separator}>•</span>
            <a href="#" className={styles.link}>Forgot password?</a>
          </div>
        </form>
      </div>
    </div>
  )
}
