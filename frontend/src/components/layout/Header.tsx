import React from 'react'
import { useAuthStore } from '../../stores/auth-store'
import styles from '../../styles/Header.module.css'

export default function Header() {
  const user = useAuthStore((s: import('../../stores/auth-store').AuthState) => s.user)
  const logout = useAuthStore((s: import('../../stores/auth-store').AuthState) => s.logout)

  return (
    <header className={styles.header}>
      <div className={styles.left}>Back Clear</div>
      <div className={styles.right}>
        {user ? (
          <>
            <span>{user.name}</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <span>Not logged</span>
        )}
      </div>
    </header>
  )
}
