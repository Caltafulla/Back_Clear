import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getChallenges } from '../services/challenges'
import {
  getChallengeLeaderboard,
  getCourseLeaderboard,
  getEvaluationLeaderboard,
  listCourses,
  listEvaluations,
  type LeaderboardRow
} from '../services/leaderboard'
import LoadingSpinner from '../components/ui/LoadingSpinner'

type Tab = 'challenge' | 'course' | 'evaluation'

export default function LeaderboardPage() {
  const [tab, setTab] = React.useState<Tab>('challenge')
  const [selectedId, setSelectedId] = React.useState<string>('')

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
  })

  React.useEffect(() => {
    // Reset selection when tab changes
    setSelectedId('')
  }, [tab])

  const isLoadingLists = loadingChallenges || loadingCourses || loadingEvaluations

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Leaderboard</h1>
      <p style={{ marginTop: 0, color: 'var(--gray-600)' }}>
        Select a context to view rankings.
      </p>

      <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        <button
          className="btn"
          data-active={tab === 'challenge'}
          onClick={() => setTab('challenge')}
        >
          Challenge
        </button>
        <button
          className="btn"
          data-active={tab === 'course'}
          onClick={() => setTab('course')}
        >
          Course
        </button>
        <button
          className="btn"
          data-active={tab === 'evaluation'}
          onClick={() => setTab('evaluation')}
        >
          Evaluation
        </button>
      </div>

      {isLoadingLists ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LoadingSpinner />
          <span>Loading options...</span>
        </div>
      ) : (
        <div style={{ margin: '12px 0' }}>
          {tab === 'challenge' && (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">Select challenge...</option>
              {challenges.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          )}
          {tab === 'course' && (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">Select course...</option>
              {courses.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.title || c.name || c.id}
                </option>
              ))}
            </select>
          )}
          {tab === 'evaluation' && (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">Select evaluation...</option>
              {evaluations.map((ev: any) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title || ev.name || ev.id}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        {!selectedId ? (
          <div style={{ color: 'var(--gray-600)' }}>
            Choose an item to load rankings.
          </div>
        ) : leaderboardQuery.isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LoadingSpinner />
            <span>Loading leaderboard...</span>
          </div>
        ) : leaderboardQuery.isError ? (
          <div style={{ color: 'var(--error)' }}>
            Failed to load leaderboard.
          </div>
        ) : (leaderboardQuery.data || []).length === 0 ? (
          <div style={{ color: 'var(--gray-600)' }}>
            No data available.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Rank</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>User</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Score</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Avg Time (ms)</th>
                </tr>
              </thead>
              <tbody>
                {(leaderboardQuery.data || []).map((row) => (
                  <tr key={`${row.userId || row.userName}-${row.rank}`}>
                    <td style={{ padding: '8px 12px' }}>{row.rank}</td>
                    <td style={{ padding: '8px 12px' }}>{row.userName}</td>
                    <td style={{ padding: '8px 12px' }}>{row.score}</td>
                    <td style={{ padding: '8px 12px' }}>{row.totalTime ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

