import React, { useState } from 'react'
import Badge from '../ui/Badge'
import LoadingSpinner from '../ui/LoadingSpinner'
import styles from './SubmissionStatus.module.css'
import type { Submission } from '../../types/api'

type SubmissionStatusProps = {
  submission: Submission
  testCases?: Array<{
    input: string
    expectedOutput: string
    actualOutput?: string
    passed?: boolean
    executionTime?: number
    memoryUsage?: number
  }>
}

export default function SubmissionStatus({ submission, testCases = [] }: SubmissionStatusProps) {
  const [expanded, setExpanded] = useState(false)

  const getStatusConfig = (status: Submission['status']) => {
    switch (status) {
      case 'QUEUED':
        return { icon: '🔄', label: 'In Queue', color: 'var(--gray-600)', spinner: false }
      case 'RUNNING':
        return { icon: '⚡', label: 'Running', color: 'var(--primary-600)', spinner: true }
      case 'ACCEPTED':
        return { icon: '✅', label: 'Accepted', color: 'var(--success)', spinner: false }
      case 'WRONG_ANSWER':
        return { icon: '❌', label: 'Wrong Answer', color: 'var(--error)', spinner: false }
      case 'TIME_LIMIT_EXCEEDED':
        return { icon: '⏰', label: 'Time Limit Exceeded', color: 'var(--warning)', spinner: false }
      case 'RUNTIME_ERROR':
        return { icon: '💥', label: 'Runtime Error', color: 'var(--info)', spinner: false }
      case 'COMPILATION_ERROR':
        return { icon: '🔨', label: 'Compilation Error', color: 'var(--error)', spinner: false }
      default:
        return { icon: '❓', label: status, color: 'var(--gray-600)', spinner: false }
    }
  }

  const statusConfig = getStatusConfig(submission.status)
  const hasResults = testCases.length > 0

  return (
    <div className={styles.submissionStatus}>
      <div className={styles.statusHeader}>
        <div className={styles.statusInfo}>
          {statusConfig.spinner ? (
            <LoadingSpinner size="sm" />
          ) : (
            <span className={styles.statusIcon} style={{ color: statusConfig.color }}>
              {statusConfig.icon}
            </span>
          )}
          <div className={styles.statusDetails}>
            <Badge status={submission.status} variant="status">
              {statusConfig.label}
            </Badge>
            <span className={styles.statusTime}>
              {new Date(submission.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
        {submission.executionTime && (
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Time</span>
              <span className={styles.metricValue}>{submission.executionTime}ms</span>
            </div>
            {submission.memoryUsage && (
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Memory</span>
                <span className={styles.metricValue}>{submission.memoryUsage}MB</span>
              </div>
            )}
          </div>
        )}
      </div>
      {submission.errorMessage && (
        <div className={styles.errorMessage}>
          {submission.errorMessage}
        </div>
      )}

      {hasResults && (
        <div className={styles.resultsSection}>
          <button
            className={styles.expandButton}
            onClick={() => setExpanded(!expanded)}
          >
            <span>{expanded ? '▼' : '▶'}</span>
            <span>Test Cases ({testCases.filter(tc => tc.passed).length}/{testCases.length} passed)</span>
          </button>

          {expanded && (
            <div className={styles.testCases}>
              {testCases.map((testCase, idx) => (
                <div
                  key={idx}
                  className={`${styles.testCase} ${testCase.passed ? styles.testCasePassed : styles.testCaseFailed}`}
                >
                  <div className={styles.testCaseHeader}>
                    <span className={styles.testCaseIcon}>
                      {testCase.passed ? '✅' : '❌'}
                    </span>
                    <span className={styles.testCaseTitle}>Test Case {idx + 1}</span>
                    {testCase.executionTime && (
                      <span className={styles.testCaseTime}>{testCase.executionTime}ms</span>
                    )}
                  </div>
                  <div className={styles.testCaseContent}>
                    <div className={styles.testCaseRow}>
                      <span className={styles.testCaseLabel}>Input:</span>
                      <pre className={styles.testCaseCode}>{testCase.input}</pre>
                    </div>
                    <div className={styles.testCaseRow}>
                      <span className={styles.testCaseLabel}>Expected:</span>
                      <pre className={styles.testCaseCode}>{testCase.expectedOutput}</pre>
                    </div>
                    {testCase.actualOutput !== undefined && (
                      <div className={styles.testCaseRow}>
                        <span className={styles.testCaseLabel}>Your Output:</span>
                        <pre className={`${styles.testCaseCode} ${testCase.passed ? '' : styles.testCaseError}`}>
                          {testCase.actualOutput}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

