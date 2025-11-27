import React from 'react'
import { useAuthStore } from '../../stores/auth-store'
import styles from '../../styles/Header.module.css'

type Props = { collapsed?: boolean; onToggle?: () => void }

export default function Header({ collapsed = false, onToggle }: Props) {
  const user = useAuthStore((s: import('../../stores/auth-store').AuthState) => s.user)
  const logout = useAuthStore((s: import('../../stores/auth-store').AuthState) => s.logout)

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.toggle} onClick={onToggle}>{collapsed ? '☰' : '✕'}</button>
        <span className={styles.brand}>CodeJudge</span>
      </div>
      <div className={styles.right}>
        {user ? (
          <>
            <span className={styles.username}>{user.name}</span>
            <button className="btn btn-secondary" onClick={logout}>Logout</button>
          </>
        ) : (
          <span>Not logged</span>
        )}
      </div>
    </header>
  )
}
