import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getChallenge } from '../../services/challenges'
import CodeEditor from '../../components/editor/CodeEditor'
import SubmissionStatus from '../../components/submission/SubmissionStatus'
import Badge from '../../components/ui/Badge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import styles from '../../styles/ChallengeDetail.module.css'
import type { Submission } from '../../types/api'

type Tab = 'description' | 'solutions' | 'discussion'

export default function ChallengeDetail() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('description')
  const [code, setCode] = useState('')
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [consoleOutput, setConsoleOutput] = useState('')

  const { data: challenge, isLoading } = useQuery({
    queryKey: ['challenge', id],
    queryFn: () => getChallenge(id!),
    enabled: !!id,
  })

  const handleRun = async () => {
    setIsRunning(true)
    setConsoleOutput('Running your code...\n')
    // TODO: Implement actual code execution
    setTimeout(() => {
      setConsoleOutput('Code executed successfully!\nOutput: [Your output here]')
      setIsRunning(false)
    }, 2000)
  }

  const handleSubmit = async () => {
    if (!code.trim()) {
      alert('Please write some code before submitting')
      return
    }
    // TODO: Implement actual submission
    console.log('Submitting code:', code)
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
        <p>Loading challenge...</p>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className={styles.errorContainer}>
        <h2>Challenge not found</h2>
        <p>The challenge you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className={styles.challengeDetail}>
      <div className={styles.splitView}>
        {/* Left Panel - Description */}
        <div className={styles.leftPanel}>
          <div className={styles.challengeHeader}>
            <div className={styles.headerTop}>
              <h1 className={styles.title}>{challenge.title}</h1>
              <Badge difficulty={challenge.difficulty} variant="difficulty">
                {challenge.difficulty}
              </Badge>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.actionButton}>❤️ Like</button>
              <button className={styles.actionButton}>🔖 Bookmark</button>
            </div>
          </div>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'description' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'solutions' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('solutions')}
            >
              Solutions
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'discussion' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('discussion')}
            >
              Discussion
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'description' && (
              <div className={styles.description}>
                <div className={styles.markdownContent}>
                  {challenge.description.split('\n').map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>

                {challenge.testCases && challenge.testCases.length > 0 && (
                  <div className={styles.examples}>
                    <h3 className={styles.sectionTitle}>Examples</h3>
                    {challenge.testCases.slice(0, 2).map((testCase, idx) => (
                      <div key={idx} className={styles.exampleCard}>
                        <div className={styles.exampleRow}>
                          <span className={styles.exampleLabel}>Input:</span>
                          <pre className={styles.exampleCode}>{testCase.input}</pre>
                        </div>
                        <div className={styles.exampleRow}>
                          <span className={styles.exampleLabel}>Output:</span>
                          <pre className={styles.exampleCode}>{testCase.output}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.constraints}>
                  <h3 className={styles.sectionTitle}>Constraints</h3>
                  <ul className={styles.constraintsList}>
                    <li>Time Limit: {challenge.timeLimit}ms</li>
                    <li>Memory Limit: {challenge.memoryLimit}MB</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'solutions' && (
              <div className={styles.solutions}>
                <p>Solutions will be available after you solve this challenge.</p>
              </div>
            )}

            {activeTab === 'discussion' && (
              <div className={styles.discussion}>
                <p>Discussion forum coming soon!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Editor */}
        <div className={styles.rightPanel}>
          <CodeEditor
            value={code}
            onChange={setCode}
            onSubmit={handleSubmit}
            onRun={handleRun}
            disabled={isRunning}
            consoleOutput={consoleOutput}
            isRunning={isRunning}
          />
          {submission && (
            <SubmissionStatus submission={submission} />
          )}
        </div>
      </div>
    </div>
  )
}
