import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getMySubmissions } from '../services/submissions'
import { getChallenge } from '../services/challenges'
import SubmissionStatus from '../components/submission/SubmissionStatus'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import styles from '../styles/MySubmissions.module.css'
import type { Submission } from '../types/api'

export default function MySubmissionsPage() {
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['my-submissions', selectedChallenge],
    queryFn: () => getMySubmissions({
      challengeId: selectedChallenge || undefined,
      limit: 100,
    }),
    staleTime: 30000,
  })

  // Filter submissions by status
  const filteredSubmissions = React.useMemo(() => {
    if (statusFilter === 'ALL') return submissions
    return submissions.filter(s => s.status === statusFilter)
  }, [submissions, statusFilter])

  const getStatusIcon = (status: Submission['status']) => {
    switch (status) {
      case 'ACCEPTED': return '✅'
      case 'RUNNING': return '⚡'
      case 'WRONG_ANSWER': return '❌'
      case 'TIME_LIMIT_EXCEEDED': return '⏰'
      case 'RUNTIME_ERROR': return '💥'
      case 'COMPILATION_ERROR': return '🔨'
      case 'QUEUED': return '🔄'
      default: return '❓'
    }
  }

  const getStatusColor = (status: Submission['status']) => {
    switch (status) {
      case 'ACCEPTED': return 'var(--success)'
      case 'RUNNING': return 'var(--primary-600)'
      case 'WRONG_ANSWER': return 'var(--error)'
      case 'TIME_LIMIT_EXCEEDED': return 'var(--warning)'
      case 'RUNTIME_ERROR': return 'var(--info)'
      case 'COMPILATION_ERROR': return 'var(--error)'
      case 'QUEUED': return 'var(--gray-600)'
      default: return 'var(--gray-600)'
    }
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
        <p>Loading your submissions...</p>
      </div>
    )
  }

  return (
    <div className={styles.mySubmissionsPage}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Submissions</h1>
          <p className={styles.subtitle}>View and track all your code submissions</p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="ALL">All Status</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="WRONG_ANSWER">Wrong Answer</option>
            <option value="TIME_LIMIT_EXCEEDED">Time Limit Exceeded</option>
            <option value="RUNTIME_ERROR">Runtime Error</option>
            <option value="COMPILATION_ERROR">Compilation Error</option>
            <option value="QUEUED">Queued</option>
            <option value="RUNNING">Running</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Challenge:</label>
          <input
            type="text"
            placeholder="Filter by challenge ID..."
            value={selectedChallenge || ''}
            onChange={(e) => setSelectedChallenge(e.target.value.trim() || null)}
            className={styles.filterInput}
          />
        </div>
        {(selectedChallenge || statusFilter !== 'ALL') && (
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSelectedChallenge(null)
              setStatusFilter('ALL')
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div className={styles.emptyState}>
          <span>📝</span>
          <h3>No submissions found</h3>
          <p>
            {selectedChallenge || statusFilter !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Start coding to see your submissions here'}
          </p>
          <Link to="/challenges" className="btn btn-primary">
            Browse Challenges
          </Link>
        </div>
      ) : (
        <div className={styles.submissionsList}>
          {filteredSubmissions.map((submission) => (
            <div key={submission.id} className={styles.submissionCard}>
              <div className={styles.submissionHeader}>
                <div className={styles.submissionInfo}>
                  <div className={styles.submissionMeta}>
                    <span className={styles.submissionId}>Submission #{submission.id.slice(-8)}</span>
                    <span className={styles.submissionDate}>
                      {new Date(submission.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className={styles.submissionDetails}>
                    <Link
                      to={`/challenges/${submission.challengeId}`}
                      className={styles.challengeLink}
                    >
                      Challenge: {submission.challengeId.slice(-8)}
                    </Link>
                    <Badge status={submission.status} variant="status">
                      {submission.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <div className={styles.submissionStats}>
                  {submission.executionTime && (
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Time:</span>
                      <span className={styles.statValue}>{submission.executionTime}ms</span>
                    </div>
                  )}
                  {submission.memoryUsage && (
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Memory:</span>
                      <span className={styles.statValue}>{submission.memoryUsage}KB</span>
                    </div>
                  )}
                  {submission.score !== undefined && (
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Score:</span>
                      <span className={styles.statValue}>{submission.score}</span>
                    </div>
                  )}
                </div>
              </div>
              <SubmissionStatus submission={submission} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

