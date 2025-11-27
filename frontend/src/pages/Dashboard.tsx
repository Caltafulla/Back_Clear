import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth-store'
import { getDashboardStats } from '../services/dashboard'
import { CircularProgress, LinearProgress } from '../components/ui/Progress'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import styles from '../styles/Dashboard.module.css'
import type { Challenge, Submission } from '../types/api'

export default function DashboardPage() {
  const user = useAuthStore((s: import('../stores/auth-store').AuthState) => s.user)
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const getStatusIcon = (status: Submission['status']) => {
    switch (status) {
      case 'ACCEPTED': return '✅'
      case 'RUNNING': return '⚡'
      case 'WRONG_ANSWER': return '❌'
      case 'TIME_LIMIT_EXCEEDED': return '⏰'
      case 'RUNTIME_ERROR': return '💥'
      default: return '🔄'
    }
  }

  const getStatusColor = (status: Submission['status']) => {
    switch (status) {
      case 'ACCEPTED': return 'var(--success)'
      case 'RUNNING': return 'var(--primary-600)'
      case 'WRONG_ANSWER': return 'var(--error)'
      case 'TIME_LIMIT_EXCEEDED': return 'var(--warning)'
      case 'RUNTIME_ERROR': return 'var(--info)'
      default: return 'var(--gray-500)'
    }
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome back, {user?.name}!</h1>
          <p className={styles.subtitle}>Here's your progress overview</p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className={styles.statsGrid}>
        {/* Progress Overview Card */}
        <div className={`${styles.card} ${styles.progressCard}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Progress Overview</h3>
          </div>
          <div className={styles.cardBody}>
            <CircularProgress 
              value={stats?.submissions.successRate || 0} 
              size="lg"
              label="Success Rate"
            />
            <div className={styles.statsList}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total Submissions</span>
                <span className={styles.statValue}>{stats?.submissions.total || 0}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Accepted</span>
                <span className={styles.statValue} style={{ color: 'var(--success)' }}>
                  {stats?.submissions.accepted || 0}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Today</span>
                <span className={styles.statValue}>{stats?.submissions.today || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Challenges Card */}
        <div className={`${styles.card} ${styles.challengesCard}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Active Challenges</h3>
            <a href="/challenges" className={styles.viewAll}>View all →</a>
          </div>
          <div className={styles.cardBody}>
            {stats?.activeChallenges && stats.activeChallenges.length > 0 ? (
              <div className={styles.challengeList}>
                {stats.activeChallenges.map((challenge: Challenge) => (
                  <div key={challenge.id} className={styles.challengeItem}>
                    <div className={styles.challengeInfo}>
                      <span className={styles.challengeTitle}>{challenge.title}</span>
                      <Badge difficulty={challenge.difficulty} variant="difficulty">
                        {challenge.difficulty}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <span>📝</span>
                <p>No active challenges</p>
                <a href="/challenges" className="btn btn-primary btn-sm">Browse Challenges</a>
              </div>
            )}
          </div>
        </div>

        {/* Recent Submissions Card */}
        <div className={`${styles.card} ${styles.submissionsCard}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Recent Submissions</h3>
            <a href="/my-submissions" className={styles.viewAll}>View all →</a>
          </div>
          <div className={styles.cardBody}>
            {stats?.recentSubmissions && stats.recentSubmissions.length > 0 ? (
              <div className={styles.submissionList}>
                {stats.recentSubmissions.map((submission: Submission) => (
                  <div key={submission.id} className={styles.submissionItem}>
                    <div className={styles.submissionIcon} style={{ color: getStatusColor(submission.status) }}>
                      {getStatusIcon(submission.status)}
                    </div>
                    <div className={styles.submissionInfo}>
                      <span className={styles.submissionStatus}>{submission.status.replace('_', ' ')}</span>
                      <span className={styles.submissionTime}>
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {submission.executionTime && (
                      <div className={styles.submissionMeta}>
                        {submission.executionTime}ms
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <span>📊</span>
                <p>No submissions yet</p>
                <a href="/challenges" className="btn btn-primary btn-sm">Start Coding</a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          <a href="/challenges" className={styles.actionCard}>
            <span className={styles.actionIcon}>💻</span>
            <span className={styles.actionLabel}>Browse Challenges</span>
          </a>
          <a href="/leaderboard" className={styles.actionCard}>
            <span className={styles.actionIcon}>🏆</span>
            <span className={styles.actionLabel}>View Leaderboard</span>
          </a>
          <a href="/my-submissions" className={styles.actionCard}>
            <span className={styles.actionIcon}>📝</span>
            <span className={styles.actionLabel}>My Submissions</span>
          </a>
        </div>
      </div>
    </div>
  )
}
