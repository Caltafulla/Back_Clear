import React from 'react'
import styles from './Badge.module.css'
import type { Difficulty } from '../../types/api'

type BadgeProps = {
  children: React.ReactNode
  variant?: 'difficulty' | 'status' | 'default' | 'info'
  difficulty?: Difficulty
  status?: string
  className?: string
}

export default function Badge({ 
  children, 
  variant = 'default', 
  difficulty, 
  status,
  className = '' 
}: BadgeProps) {
  const variantClass = variant === 'difficulty' && difficulty 
    ? styles[`difficulty-${difficulty.toLowerCase()}`]
    : variant === 'status' && status
    ? styles[`status-${status.toLowerCase().replace(/_/g, '-')}`]
    : variant === 'info'
    ? styles.info
    : styles.default

  return (
    <span className={`${styles.badge} ${variantClass} ${className}`}>
      {children}
    </span>
  )
}

