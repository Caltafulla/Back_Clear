import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getMetrics } from '../../services/metrics'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import styles from '../../styles/ProfessorDashboard.module.css'

export default function ProfessorDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['metrics', 'professor-overview'],
    queryFn: getMetrics,
    staleTime: 30000, // Cache for 30 seconds
    refetchInterval: 60000, // Refetch every minute
  })

  if (isLoading) {
    return (
      <div className={styles.professorDashboard}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
          <p>Loading professor overview...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className={styles.professorDashboard}>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>Failed to load metrics.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.professorDashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Professor Overview</h1>
        <p className={styles.subtitle}>
          Monitor course activity and manage evaluations
        </p>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Total Submissions"
          value={data?.submissions?.total ?? 0}
          icon="📦"
          variant="primary"
        />
        <StatCard
          title="Today Submissions"
          value={data?.submissions?.today ?? 0}
          icon="🕒"
          variant="info"
        />
        <StatCard
          title="Challenges"
          value={data?.challenges?.total ?? 0}
          icon="💻"
          variant="success"
        />
        <StatCard
          title="Active Evaluations"
          value={data?.evaluations?.active ?? 0}
          icon="⏱️"
          variant="warning"
        />
      </div>

      {/* Quick Links */}
      <div className={styles.quickLinksSection}>
        <h2 className={styles.sectionTitle}>Quick Links</h2>
        <div className={styles.quickLinksGrid}>
          <Link to="/challenge-management" className={styles.quickLink}>
            <span className={styles.quickLinkIcon}>⚙️</span>
            <span className={styles.quickLinkLabel}>Manage Challenges</span>
          </Link>
          <Link to="/professor/evaluations" className={styles.quickLink}>
            <span className={styles.quickLinkIcon}>📝</span>
            <span className={styles.quickLinkLabel}>Manage Evaluations</span>
          </Link>
          <Link to="/metrics" className={styles.quickLink}>
            <span className={styles.quickLinkIcon}>📈</span>
            <span className={styles.quickLinkLabel}>View Metrics</span>
          </Link>
          <Link to="/assistant" className={styles.quickLink}>
            <span className={styles.quickLinkIcon}>🤖</span>
            <span className={styles.quickLinkLabel}>AI Assistant</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  variant = 'primary',
}: {
  title: string
  value: number
  icon: string
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'error' | 'gray'
}) {
  const variantClass = `statCard${variant.charAt(0).toUpperCase() + variant.slice(1)}`

  return (
    <div className={`${styles.statCard} ${styles[variantClass]}`}>
      <div className={styles.statHeader}>
        <h3 className={styles.statTitle}>{title}</h3>
        <div className={styles.statIcon}>{icon}</div>
      </div>
      <div className={styles.statValue}>{value.toLocaleString()}</div>
    </div>
  )
}
