import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth-store'
import Badge from '../ui/Badge'
import styles from '../../styles/Header.module.css'

type Props = { collapsed?: boolean; onToggle?: () => void }

export default function Header({ collapsed = false, onToggle }: Props) {
  const user = useAuthStore((s: import('../../stores/auth-store').AuthState) => s.user)
  const logout = useAuthStore((s: import('../../stores/auth-store').AuthState) => s.logout)
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const navItems = user?.role === 'ADMIN' 
    ? [
        { path: '/admin', label: 'Dashboard' },
        { path: '/challenges', label: 'Challenges' },
        { path: '/leaderboard', label: 'Leaderboard' },
      ]
    : user?.role === 'PROFESSOR' 
    ? [
        { path: '/professor', label: 'Dashboard' },
        { path: '/challenges', label: 'Challenges' },
        { path: '/leaderboard', label: 'Leaderboard' },
      ]
    : [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/challenges', label: 'Challenges' },
        { path: '/leaderboard', label: 'Leaderboard' },
      ]

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.toggle} onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? '☰' : '✕'}
        </button>
        <Link to="/dashboard" className={styles.brand}>
          <span className={styles.brandIcon}>CJ</span>
          <span>CodeJudge</span>
        </Link>
        <nav className={styles.nav}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navLink} ${location.pathname === item.path ? styles.navLinkActive : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className={styles.right}>
        {user ? (
          <div className={styles.userMenu} ref={dropdownRef}>
            <div 
              className={styles.userInfo}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span className={styles.username}>{user.name || user.email || 'User'}</span>
              <span className={styles.userRole}>{user.role?.toLowerCase() || 'user'}</span>
            </div>
            <div 
              className={styles.avatar}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {getInitials(user.name || user.firstName || user.lastName || user.email)}
            </div>
            {dropdownOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownItem}>
                  <span>👤</span>
                  <span>Profile</span>
                </div>
                <div className={styles.dropdownItem}>
                  <span>⚙️</span>
                  <span>Settings</span>
                </div>
                <div className={styles.dropdownItem} onClick={logout}>
                  <span>🚪</span>
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary">Login</Link>
        )}
      </div>
    </header>
  )
}
