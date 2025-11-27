import React from 'react'
import Header from '../components/layout/Header'
import styles from '../styles/Dashboard.module.css'

export default function DashboardPage() {
  return (
    <div>
      <Header />
      <main className={styles.main}>
        <h1>Student Dashboard</h1>
        <p>Progress and recent submissions will appear here.</p>
      </main>
    </div>
  )
}
