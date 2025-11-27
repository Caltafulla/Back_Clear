import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getChallenges } from '../services/challenges'
import {
  getChallengeLeaderboard,
  getCourseLeaderboard,
  getEvaluationLeaderboard,
  listCourses,
  listEvaluations,
  type LeaderboardRow
} from '../services/leaderboard'
import { useAuthStore } from '../stores/auth-store'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Badge from '../components/ui/Badge'
import styles from '../styles/Leaderboard.module.css'

type Tab = 'challenge' | 'course' | 'evaluation'

export default function LeaderboardPage() {
  const user = useAuthStore((state) => state.user)
  const [tab, setTab] = useState<Tab>('challenge')
  const [selectedId, setSelectedId] = useState<string>('')

  const { data: challenges = [], isLoading: loadingChallenges } = useQuery({
    queryKey: ['challenges', 'leaderboard'],
    queryFn: () => getChallenges({ limit: 100 }),
  })

  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ['courses', 'leaderboard'],
    queryFn: () => listCourses(),
  })

  const { data: evaluations = [], isLoading: loadingEvaluations } = useQuery({
    queryKey: ['evaluations', 'leaderboard'],
    queryFn: () => listEvaluations(),
  })

  const leaderboardQuery = useQuery<LeaderboardRow[]>({
    queryKey: ['leaderboard', tab, selectedId],
    queryFn: async () => {
      if (!selectedId) return []
      if (tab === 'challenge') return getChallengeLeaderboard(selectedId)
      if (tab === 'course') return getCourseLeaderboard(selectedId)
      return getEvaluationLeaderboard(selectedId)
    },
    enabled: !!selectedId,
    staleTime: 30000,
  })

  useEffect(() => {
    // Reset selection when tab changes
    setSelectedId('')
  }, [tab])

  const isLoadingLists = loadingChallenges || loadingCourses || loadingEvaluations

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  const getRankClass = (rank: number) => {
    if (rank === 1) return styles.rankGold
    if (rank === 2) return styles.rankSilver
    if (rank === 3) return styles.rankBronze
    return ''
  }

  const isCurrentUser = (userId?: string) => {
    return userId && user?.id === userId
  }

  const selectedItem = React.useMemo(() => {
    if (!selectedId) return null
    if (tab === 'challenge') {
      return challenges.find((c: any) => c.id === selectedId)
    }
    if (tab === 'course') {
      return courses.find((c: any) => c.id === selectedId)
    }
    return evaluations.find((e: any) => e.id === selectedId)
  }, [selectedId, tab, challenges, courses, evaluations])

  return (
    <div className={styles.leaderboardPage}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Leaderboard</h1>
          <p className={styles.subtitle}>
            Compete with others and see how you rank
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'challenge' ? styles.tabActive : ''}`}
          onClick={() => setTab('challenge')}
        >
          <span className={styles.tabIcon}>💻</span>
          <span>Challenge</span>
        </button>
        <button
          className={`${styles.tab} ${tab === 'course' ? styles.tabActive : ''}`}
          onClick={() => setTab('course')}
        >
          <span className={styles.tabIcon}>🏫</span>
          <span>Course</span>
        </button>
        <button
          className={`${styles.tab} ${tab === 'evaluation' ? styles.tabActive : ''}`}
          onClick={() => setTab('evaluation')}
        >
          <span className={styles.tabIcon}>📝</span>
          <span>Evaluation</span>
        </button>
      </div>

      {/* Selector Card */}
      <div className={styles.selectorCard}>
        {isLoadingLists ? (
          <div className={styles.loadingSelector}>
            <LoadingSpinner size="sm" />
            <span>Loading options...</span>
          </div>
        ) : (
          <div className={styles.selectorContent}>
            <label className={styles.selectorLabel}>
              Select {tab === 'challenge' ? 'Challenge' : tab === 'course' ? 'Course' : 'Evaluation'}
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className={styles.selector}
            >
              <option value="">Choose one...</option>
              {tab === 'challenge' &&
                challenges.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              {tab === 'course' &&
                courses.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.title || c.name || c.id}
                  </option>
                ))}
              {tab === 'evaluation' &&
                evaluations.map((ev: any) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title || ev.name || ev.id}
                  </option>
                ))}
            </select>
            {selectedItem && (
              <div className={styles.selectedInfo}>
                {tab === 'challenge' && (
                  <Link to={`/challenges/${selectedId}`} className={styles.viewLink}>
                    View Challenge →
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Leaderboard Table */}
      <div className={styles.leaderboardContainer}>
        {!selectedId ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🏆</span>
            <h3>Select a {tab} to view rankings</h3>
            <p>Choose from the dropdown above to see the leaderboard</p>
          </div>
        ) : leaderboardQuery.isLoading ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner size="lg" />
            <p>Loading leaderboard...</p>
          </div>
        ) : leaderboardQuery.isError ? (
          <div className={styles.errorState}>
            <span>❌</span>
            <h3>Failed to load leaderboard</h3>
            <p>Please try again later</p>
          </div>
        ) : (leaderboardQuery.data || []).length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📊</span>
            <h3>No rankings yet</h3>
            <p>Be the first to submit a solution!</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.leaderboardTable}>
              <thead>
                <tr>
                  <th className={styles.rankHeader}>Rank</th>
                  <th className={styles.userHeader}>User</th>
                  <th className={styles.scoreHeader}>Score</th>
                  <th className={styles.timeHeader}>Avg Time</th>
                </tr>
              </thead>
              <tbody>
                {(leaderboardQuery.data || []).map((row) => {
                  const rankIcon = getRankIcon(row.rank)
                  const rankClass = getRankClass(row.rank)
                  const isUser = isCurrentUser(row.userId)
                  
                  return (
                    <tr
                      key={`${row.userId || row.userName}-${row.rank}`}
                      className={`${rankClass} ${isUser ? styles.currentUser : ''}`}
                    >
                      <td className={styles.rankCell}>
                        <div className={styles.rankContent}>
                          {rankIcon && <span className={styles.rankIcon}>{rankIcon}</span>}
                          <span className={styles.rankNumber}>{row.rank}</span>
                        </div>
                      </td>
                      <td className={styles.userCell}>
                        <div className={styles.userInfo}>
                          <div className={styles.userAvatar}>
                            {row.userName.charAt(0).toUpperCase()}
                          </div>
                          <span className={styles.userName}>
                            {row.userName}
                            {isUser && <Badge status="ACCEPTED" variant="status">You</Badge>}
                          </span>
                        </div>
                      </td>
                      <td className={styles.scoreCell}>
                        <div className={styles.scoreValue}>{row.score}</div>
                      </td>
                      <td className={styles.timeCell}>
                        {row.totalTime ? (
                          <span className={styles.timeValue}>{row.totalTime}ms</span>
                        ) : (
                          <span className={styles.timeValue}>-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
