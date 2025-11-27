import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register as registerApi } from '../services/auth'
import { useAuthStore } from '../stores/auth-store'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import styles from '../styles/Login.module.css'

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'STUDENT' | 'ADMIN' | 'PROFESSOR'>('STUDENT')
  const [focused, setFocused] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    role: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setUser = useAuthStore((s: import('../stores/auth-store').AuthState) => s.setUser)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!firstName || !lastName || !email || !password) {
      setError('All fields are required')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const data = await registerApi({ email, password, firstName, lastName, role })
      if (!data?.user) {
        setError('Invalid response from server')
        setLoading(false)
        return
      }
      // After successful registration, redirect to login page so the user can sign in
      setTimeout(() => navigate('/login'), 100)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Registration failed')
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
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>Register as Student, Admin, or Professor</p>
        </div>

        <form onSubmit={submit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label 
              className={`${styles.label} ${(focused.firstName || firstName) ? styles.labelFloating : ''}`} 
              htmlFor="firstName"
            >
              First name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              onFocus={() => setFocused({ ...focused, firstName: true })}
              onBlur={() => setFocused({ ...focused, firstName: false })}
              className={styles.input}
              placeholder=" "
              disabled={loading}
            />
          </div>
          <div className={styles.inputGroup}>
            <label 
              className={`${styles.label} ${(focused.lastName || lastName) ? styles.labelFloating : ''}`} 
              htmlFor="lastName"
            >
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              onFocus={() => setFocused({ ...focused, lastName: true })}
              onBlur={() => setFocused({ ...focused, lastName: false })}
              className={styles.input}
              placeholder=" "
              disabled={loading}
            />
          </div>
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
          <div className={styles.inputGroup}>
            <label 
              className={`${styles.label} ${(focused.role || role) ? styles.labelFloating : ''}`} 
              htmlFor="role"
            >
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              onFocus={() => setFocused({ ...focused, role: true })}
              onBlur={() => setFocused({ ...focused, role: false })}
              className={styles.input}
              disabled={loading}
            >
              <option value="STUDENT">Student</option>
              <option value="ADMIN">Admin</option>
              <option value="PROFESSOR">Professor</option>
            </select>
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
                <span>Creating account...</span>
              </>
            ) : (
              'Create account'
            )}
          </button>

          <div className={styles.footerLinks}>
            <span>Already have an account?</span>
            <span className={styles.separator}>•</span>
            <Link to="/login" className={styles.link}>Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

