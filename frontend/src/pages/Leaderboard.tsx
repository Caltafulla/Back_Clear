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
  type LeaderboardRow,
  type LeaderboardFilters
} from '../services/leaderboard'
import { useAuthStore } from '../stores/auth-store'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Badge from '../components/ui/Badge'
import { LinearProgress } from '../components/ui/Progress'
import styles from '../styles/Leaderboard.module.css'

type Tab = 'challenge' | 'course' | 'evaluation'

export default function LeaderboardPage() {
  const user = useAuthStore((state) => state.user)
  const [tab, setTab] = useState<Tab>('challenge')
  const [selectedId, setSelectedId] = useState<string>('')
  const [language, setLanguage] = useState<LeaderboardFilters['language']>('')
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [includeEval, setIncludeEval] = useState<boolean>(false)

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
    queryKey: ['leaderboard', tab, selectedId, language, from, to, includeEval],
    queryFn: async () => {
      if (!selectedId) return []
      try {
        const filters: LeaderboardFilters = {
          language: (language || undefined) as any,
          from: from || undefined,
          to: to || undefined,
          includeEvaluationSubmissions: tab !== 'evaluation' ? includeEval : undefined
        }
        if (tab === 'challenge') return await getChallengeLeaderboard(selectedId, 50, filters)
        if (tab === 'course') {
          const result = await getCourseLeaderboard(selectedId, 50, filters)
          console.log('Course leaderboard result:', result)
          return result
        }
        return await getEvaluationLeaderboard(selectedId, 50, filters)
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
        return []
      }
    },
    enabled: !!selectedId,
    staleTime: 30000,
    retry: 1,
  })

  useEffect(() => {
    // Reset selection when tab changes
    setSelectedId('')
    // Keep filters, but reset includeEval for evaluation tab as it doesn't apply
    if (tab === 'evaluation') setIncludeEval(false)
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
      const course = courses.find((c: any) => c.id === selectedId)
      return course
    }
    return evaluations.find((e: any) => e.id === selectedId)
  }, [selectedId, tab, challenges, courses, evaluations])

  // Calculate max score for progress bar
  const maxScore = React.useMemo(() => {
    if (!leaderboardQuery.data || leaderboardQuery.data.length === 0) return 100
    return Math.max(...leaderboardQuery.data.map(r => r.score || 0), 100)
  }, [leaderboardQuery.data])

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
            <div className={styles.selectorRow}>
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
                  courses.map((c: any) => {
                    const displayName = c.name 
                      ? (c.code ? `${c.code} - ${c.name}` : c.name)
                      : c.title || c.id
                    return (
                      <option key={c.id} value={c.id}>
                        {displayName}
                      </option>
                    )
                  })}
                {tab === 'evaluation' &&
                  evaluations.map((ev: any) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title || ev.name || ev.id}
                    </option>
                  ))}
              </select>
            </div>

            {/* Filters */}
            <div className={styles.filtersRow}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Language</label>
                <select
                  value={language || ''}
                  onChange={(e) => setLanguage((e.target.value || '') as any)}
                  className={styles.filterControl}
                >
                  <option value="">All Languages</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>From Date</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className={styles.filterControl}
                />
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>To Date</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className={styles.filterControl}
                />
              </div>

              {tab !== 'evaluation' && (
                <div className={styles.filterGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={includeEval}
                      onChange={(e) => setIncludeEval(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span>Include evaluation submissions</span>
                  </label>
                </div>
              )}
            </div>

            {selectedItem && (
              <div className={styles.selectedInfo}>
                {tab === 'challenge' && (
                  <Link to={`/challenges/${selectedId}`} className={styles.viewLink}>
                    View Challenge →
                  </Link>
                )}
                {tab === 'course' && selectedItem && (
                  <div className={styles.courseInfo}>
                    <span className={styles.courseName}>
                      {selectedItem.code ? `${selectedItem.code} - ` : ''}
                      {selectedItem.name || selectedItem.title || 'Course'}
                    </span>
                  </div>
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
            <span className={styles.errorIcon}>❌</span>
            <h3>Failed to load leaderboard</h3>
            <p>
              {leaderboardQuery.error instanceof Error 
                ? leaderboardQuery.error.message 
                : 'Please try again later'}
            </p>
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
                  const scorePercentage = maxScore > 0 ? (row.score / maxScore) * 100 : 0
                  
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
                          <div className={styles.userDetails}>
                            <span className={styles.userName}>
                              {row.userName}
                            </span>
                            {isUser && (
                              <Badge status="ACCEPTED" variant="status" className={styles.userBadge}>
                                You
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={styles.scoreCell}>
                        <div className={styles.scoreContainer}>
                          <div className={styles.scoreValue}>{row.score}</div>
                          <LinearProgress 
                            value={row.score} 
                            max={maxScore}
                            className={styles.scoreProgress}
                          />
                        </div>
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
