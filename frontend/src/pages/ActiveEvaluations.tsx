import React, { useMemo, useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getEvaluations, type Evaluation } from '../services/evaluations'
import { listCourses } from '../services/leaderboard'
import { getChallenge } from '../services/challenges'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import styles from '../styles/ActiveEvaluations.module.css'

export default function ActiveEvaluationsPage() {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')

  const { data: courses = [] } = useQuery({
    queryKey: ['courses', 'active-evaluations'],
    queryFn: () => listCourses(),
    staleTime: 60000,
  })

  // Fetch evaluations - backend uses if-else, so we filter client-side
  const { data: allEvaluations = [], isLoading } = useQuery({
    queryKey: ['evaluations', 'all', selectedCourseId],
    queryFn: () => {
      // If course is selected, filter by course, otherwise get all
      if (selectedCourseId) {
        return getEvaluations({ courseId: selectedCourseId, limit: 100 })
      }
      return getEvaluations({ limit: 100 })
    },
    staleTime: 30000,
  })

  // Filter by active status client-side (backend doesn't combine filters)
  const evaluations = useMemo(() => {
    let filtered = allEvaluations.filter(e => 
      e.status === 'active' || e.status === 'ACTIVE'
    )
    
    // Also filter by course if selected (double-check)
    if (selectedCourseId) {
      filtered = filtered.filter(e => e.courseId === selectedCourseId)
    }
    
    return filtered
  }, [allEvaluations, selectedCourseId])

  // Get all unique challenge IDs from all evaluations
  const allChallengeIds = useMemo(() => {
    const ids = new Set<string>()
    evaluations.forEach(evaluation => {
      evaluation.challengeIds.forEach(id => ids.add(id))
    })
    return Array.from(ids)
  }, [evaluations])

  // Fetch all challenges for all evaluations
  const challengeQueries = useQueries({
    queries: allChallengeIds.map(challengeId => ({
      queryKey: ['challenge', challengeId],
      queryFn: () => getChallenge(challengeId),
      staleTime: 60000,
      enabled: challengeId.length > 0,
    })),
  })

  // Create a map of challengeId -> challenge for quick lookup
  const challengeMap = useMemo(() => {
    const map = new Map()
    challengeQueries.forEach((query, index) => {
      if (query.data) {
        map.set(allChallengeIds[index], query.data)
      }
    })
    return map
  }, [challengeQueries, allChallengeIds])

  // Helper to get challenge names for an evaluation
  const getChallengeNames = (challengeIds: string[]): string => {
    if (challengeIds.length === 0) return 'No challenges'
    
    const names = challengeIds
      .map(id => challengeMap.get(id))
      .filter(Boolean)
      .map(challenge => challenge.title)
    
    if (names.length === 0) {
      return `${challengeIds.length} challenge${challengeIds.length !== 1 ? 's' : ''}`
    }
    
    if (names.length === 1) {
      return names[0]
    }
    
    // If multiple, show first name + count
    return `${names[0]}${names.length > 1 ? ` (+${names.length - 1} more)` : ''}`
  }

  // Helper to get the first challenge ID for navigation
  const getFirstChallengeId = (challengeIds: string[]): string | null => {
    if (challengeIds.length === 0) return null
    return challengeIds[0]
  }

  // Create a map of courseId -> course for quick lookup
  const courseMap = useMemo(() => {
    const map = new Map()
    courses.forEach((c: any) => {
      map.set(c.id, c)
    })
    return map
  }, [courses])

  const getCourseName = (courseId: string) => {
    const course = courseMap.get(courseId)
    if (!course) return 'Unknown Course'
    return course.code ? `${course.code} - ${course.name}` : course.name || course.title || 'Unknown Course'
  }

  const getTimeRemaining = (endDate: string | Date) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return { text: 'Ended', isUrgent: false }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) {
      return { text: `${days}d ${hours}h remaining`, isUrgent: days <= 1 }
    } else if (hours > 0) {
      return { text: `${hours}h ${minutes}m remaining`, isUrgent: hours <= 2 }
    } else {
      return { text: `${minutes}m remaining`, isUrgent: true }
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
        <p>Loading active evaluations...</p>
      </div>
    )
  }

  return (
    <div className={styles.activeEvaluationsPage}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Active Evaluations</h1>
          <p className={styles.subtitle}>
            View and participate in ongoing evaluations
          </p>
        </div>
      </div>

      {/* Course Filter */}
      <div className={styles.filtersCard}>
        <label className={styles.filterLabel}>Filter by Course:</label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Courses</option>
          {courses.map((course: any) => {
            const displayName = course.name 
              ? (course.code ? `${course.code} - ${course.name}` : course.name)
              : course.title || course.id
            return (
              <option key={course.id} value={course.id}>
                {displayName}
              </option>
            )
          })}
        </select>
        {selectedCourseId && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setSelectedCourseId('')}
            style={{ marginLeft: '8px' }}
          >
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
          <p>Loading evaluations...</p>
        </div>
      ) : evaluations.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>⏱️</span>
          <h3>No active evaluations</h3>
          <p>
            {selectedCourseId 
              ? 'There are no active evaluations for the selected course.'
              : 'There are currently no active evaluations available.'}
          </p>
          {selectedCourseId && (
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedCourseId('')}
              style={{ marginTop: '16px' }}
            >
              Clear Filter
            </button>
          )}
          <Link to="/challenges" className="btn btn-primary" style={{ marginTop: selectedCourseId ? '8px' : '16px' }}>
            Browse Challenges
          </Link>
        </div>
      ) : (
        <div className={styles.evaluationsGrid}>
          {evaluations.map((evaluation) => {
            const timeRemaining = getTimeRemaining(evaluation.endDate)
            const startDate = new Date(evaluation.startDate)
            const endDate = new Date(evaluation.endDate)
            const now = new Date()
            const isStarted = now >= startDate
            const isEnded = now >= endDate

            return (
              <div key={evaluation.id} className={styles.evaluationCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.headerLeft}>
                    <h3 className={styles.evaluationTitle}>{evaluation.name}</h3>
                    <Badge 
                      variant="default"
                      className={styles.statusBadge}
                    >
                      {evaluation.status.toUpperCase()}
                    </Badge>
                  </div>
                  {timeRemaining.isUrgent && !isEnded && (
                    <div className={styles.urgentBadge}>⚠️ Urgent</div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <p className={styles.description}>{evaluation.description}</p>

                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>📚 Course:</span>
                      <span className={styles.infoValue}>
                        {getCourseName(evaluation.courseId)}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>💻 Challenge:</span>
                      <span className={styles.infoValue}>
                        {getChallengeNames(evaluation.challengeIds)}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>⏱️ Duration:</span>
                      <span className={styles.infoValue}>
                        {evaluation.durationMinutes} minutes
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>🔄 Max Attempts:</span>
                      <span className={styles.infoValue}>
                        {evaluation.maxAttempts}
                      </span>
                    </div>
                  </div>

                  <div className={styles.datesSection}>
                    <div className={styles.dateRow}>
                      <span className={styles.dateLabel}>Start:</span>
                      <span className={styles.dateValue}>{formatDate(evaluation.startDate)}</span>
                    </div>
                    <div className={styles.dateRow}>
                      <span className={styles.dateLabel}>End:</span>
                      <span className={styles.dateValue}>{formatDate(evaluation.endDate)}</span>
                    </div>
                  </div>

                  {!isEnded && (
                    <div className={styles.timeRemaining}>
                      <span className={styles.timeLabel}>Time Remaining:</span>
                      <span className={`${styles.timeValue} ${timeRemaining.isUrgent ? styles.timeUrgent : ''}`}>
                        {timeRemaining.text}
                      </span>
                    </div>
                  )}

                  {isEnded && (
                    <div className={styles.endedBadge}>
                      <span>⏰ This evaluation has ended</span>
                    </div>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  {!isEnded && isStarted ? (() => {
                    const firstChallengeId = getFirstChallengeId(evaluation.challengeIds)
                    return firstChallengeId ? (
                      <Link
                        to={`/challenges/${firstChallengeId}`}
                        className="btn btn-primary"
                      >
                        Start Evaluation
                      </Link>
                    ) : (
                      <button className="btn btn-primary" disabled>
                        No Challenge Available
                      </button>
                    )
                  })() : !isStarted ? (
                    <div className={styles.scheduledInfo}>
                      <span>⏳ Starts {formatDate(evaluation.startDate)}</span>
                    </div>
                  ) : (
                    <Link
                      to={`/evaluations/${evaluation.id}/results`}
                      className="btn btn-secondary"
                    >
                      View Results
                    </Link>
                  )}
                  <Link
                    to={`/leaderboard?evaluation=${evaluation.id}`}
                    className="btn btn-secondary"
                  >
                    View Leaderboard
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

