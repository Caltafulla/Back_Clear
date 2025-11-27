import React from 'react'
import styles from './Progress.module.css'

type ProgressProps = {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'circular' | 'linear'
  showLabel?: boolean
  label?: string
  className?: string
}

export function CircularProgress({ 
  value, 
  max = 100, 
  size = 'md',
  showLabel = true,
  label,
  className = '' 
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const radius = size === 'sm' ? 20 : size === 'md' ? 30 : 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className={`${styles.circularContainer} ${styles[size]} ${className}`}>
      <svg className={styles.circularSvg} viewBox="0 0 100 100">
        <circle
          className={styles.circularTrack}
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
        />
        <circle
          className={styles.circularProgress}
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
      </svg>
      {showLabel && (
        <div className={styles.circularLabel}>
          <span className={styles.percentage}>{Math.round(percentage)}%</span>
          {label && <span className={styles.label}>{label}</span>}
        </div>
      )}
    </div>
  )
}

export function LinearProgress({ 
  value, 
  max = 100, 
  showLabel = false,
  label,
  className = '' 
}: Omit<ProgressProps, 'size' | 'variant'>) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={`${styles.linearContainer} ${className}`}>
      {showLabel && label && (
        <div className={styles.linearHeader}>
          <span>{label}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={styles.linearTrack}>
        <div 
          className={styles.linearProgress}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

