import React from 'react'
import styles from './LoadingSpinner.module.css'

type LoadingSpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`${styles.spinner} ${styles[size]} ${className}`}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  )
}

