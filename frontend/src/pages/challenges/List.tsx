import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getChallenges } from '../../services/challenges'
import Badge from '../../components/ui/Badge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import styles from '../../styles/Challenges.module.css'
import type { Difficulty } from '../../types/api'

export default function ChallengesList() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'ALL'>('ALL')
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'easiest'>('newest')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [search])

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges', difficultyFilter, debouncedSearch],
    queryFn: () => getChallenges({
      difficulty: difficultyFilter !== 'ALL' ? difficultyFilter : undefined,
      search: debouncedSearch.trim() || undefined,
      limit: 100,
    }),
    staleTime: 60000, // Cache for 60 seconds
    retry: (failureCount, error: any) => {
      // Don't retry on 429 errors
      if (error?.response?.status === 429) {
        return false
      }
      return failureCount < 1 // Only 1 retry for other errors
    },
    retryDelay: 2000, // 2 second delay before retry
  })

  // Sort challenges client-side
  const sortedChallenges = useMemo(() => {
    const sorted = [...challenges]
    
    if (sortBy === 'easiest') {
      const order = { EASY: 1, MEDIUM: 2, HARD: 3 }
      return sorted.sort((a, b) => {
        const aOrder = order[a.difficulty] || 999
        const bOrder = order[b.difficulty] || 999
        return aOrder - bOrder
      })
    }
    
    // For newest and popular, keep original order
    // TODO: Add createdAt or popularity field to sort properly
    return sorted
  }, [challenges, sortBy])

  return (
    <div className={styles.challengesPage}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Challenges</h1>
          <p className={styles.subtitle}>Practice coding and improve your skills</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={styles.filters}>
        <div className={styles.searchContainer}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search challenges..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterChips}>
          {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
            <button
              key={diff}
              className={`${styles.filterChip} ${difficultyFilter === diff ? styles.filterChipActive : ''}`}
              onClick={() => setDifficultyFilter(diff)}
            >
              {diff === 'ALL' ? 'All' : diff}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className={styles.sortSelect}
        >
          <option value="newest">Newest</option>
          <option value="popular">Most Popular</option>
          <option value="easiest">Easiest First</option>
        </select>
      </div>

      {/* Challenges Grid */}
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
          <p>Loading challenges...</p>
        </div>
      ) : sortedChallenges.length === 0 ? (
        <div className={styles.emptyState}>
          <span>📝</span>
          <h3>No challenges found</h3>
          <p>Try adjusting your filters</p>
          {(difficultyFilter !== 'ALL' || debouncedSearch) && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setDifficultyFilter('ALL')
                setSearch('')
              }}
              style={{ marginTop: '16px' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className={styles.challengesGrid}>
          {sortedChallenges.map((challenge) => (
            <Link
              key={challenge.id}
              to={`/challenges/${challenge.id}`}
              className={styles.challengeCard}
            >
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{challenge.title}</h3>
                <Badge difficulty={challenge.difficulty} variant="difficulty">
                  {challenge.difficulty}
                </Badge>
              </div>
              <p className={styles.cardDescription}>
                {challenge.description.length > 120
                  ? challenge.description.substring(0, 120) + '...'
                  : challenge.description}
              </p>
              <div className={styles.cardFooter}>
                <div className={styles.tags}>
                  {challenge.tags?.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className={styles.cardStats}>
                  <span className={styles.stat}>⏱️ {challenge.timeLimit}ms</span>
                  <span className={styles.stat}>💾 {challenge.memoryLimit}MB</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
