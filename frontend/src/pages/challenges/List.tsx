import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getChallenges } from '../../services/challenges'
import Badge from '../../components/ui/Badge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import styles from '../../styles/Challenges.module.css'
import type { Difficulty } from '../../types/api'

export default function ChallengesList() {
  const [search, setSearch] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'ALL'>('ALL')
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'easiest'>('newest')

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges', difficultyFilter, search],
    queryFn: () => getChallenges({
      difficulty: difficultyFilter !== 'ALL' ? difficultyFilter : undefined,
      search: search || undefined,
      limit: 100,
    }),
  })

  const filteredChallenges = [...challenges].sort((a, b) => {
    if (sortBy === 'easiest') {
      const order = { EASY: 1, MEDIUM: 2, HARD: 3 }
      return order[a.difficulty] - order[b.difficulty]
    }
    // For newest and popular, keep original order (would need createdAt or popularity data)
    return 0
  })

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
      ) : filteredChallenges.length === 0 ? (
        <div className={styles.emptyState}>
          <span>📝</span>
          <h3>No challenges found</h3>
          <p>Try adjusting your filters</p>
        </div>
      ) : (
        <div className={styles.challengesGrid}>
          {filteredChallenges.map((challenge) => (
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
