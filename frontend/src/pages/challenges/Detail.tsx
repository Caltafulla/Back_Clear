import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/auth-store'
import { getChallenge } from '../../services/challenges'
import { getMySubmissions, submitSolution } from '../../services/submissions'
import CodeEditor from '../../components/editor/CodeEditor'
import SubmissionStatus from '../../components/submission/SubmissionStatus'
import Badge from '../../components/ui/Badge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import styles from '../../styles/ChallengeDetail.module.css'
import type { Submission } from '../../types/api'

type Tab = 'description' | 'solutions' | 'discussion'

export default function ChallengeDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const user = useAuthStore((s: import('../../stores/auth-store').AuthState) => s.user)
  const [activeTab, setActiveTab] = useState<Tab>('description')
  const [code, setCode] = useState('')
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [consoleOutput, setConsoleOutput] = useState('')
  
  // Disable submit button for ADMIN and PROFESSOR users
  const isSubmitDisabled = user?.role === 'ADMIN' || user?.role === 'PROFESSOR'

  const { data: challenge, isLoading } = useQuery({
    queryKey: ['challenge', id],
    queryFn: () => getChallenge(id!),
    enabled: !!id,
  })

  const { data: mySubmissions = [] } = useQuery({
    queryKey: ['my-submissions', id],
    queryFn: () => getMySubmissions({ challengeId: id!, limit: 5 }),
    enabled: !!id,
    staleTime: 30000,
  })

  useEffect(() => {
    if (mySubmissions.length > 0) {
      setSubmission(mySubmissions[0])
    }
  }, [mySubmissions])

  const submitMutation = useMutation({
    mutationFn: submitSolution,
    onMutate: () => {
      setConsoleOutput('Submitting your code...\n')
    },
    onSuccess: (newSubmission) => {
      setSubmission(newSubmission)
      setConsoleOutput((prev) => `${prev}Submission queued successfully!`)
      queryClient.invalidateQueries({ queryKey: ['my-submissions', id] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to submit'
      setConsoleOutput(`Submission failed: ${message}`)
    },
  })

  const latestTestCaseResults = useMemo(() => {
    if (!submission?.testCaseResults || !challenge?.testCases) return []
    const testCaseMap = new Map(challenge.testCases.map((tc) => [tc.id, tc]))

    return submission.testCaseResults.map((result, idx) => {
      const tc = testCaseMap.get(result.caseId)
      return {
        input: tc?.input || `Case ${idx + 1}`,
        expectedOutput: tc?.output || result.expectedOutput || '',
        actualOutput: result.actualOutput,
        passed: result.status === 'ACCEPTED',
        executionTime: result.timeMs,
        memoryUsage: result.memoryKb,
      }
    })
  }, [submission, challenge])

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
    if (!challenge?.courseId) {
      alert('Course information is missing for this challenge.')
      return
    }

    submitMutation.mutate({
      challengeId: challenge.id,
      courseId: challenge.courseId,
      language: 'python',
      code,
    })
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
                {mySubmissions.length === 0 ? (
                  <div className={styles.solutionsEmpty}>
                    <p>Solutions will be available after you submit your code.</p>
                    <p>Build and submit your solution to see detailed evaluations.</p>
                  </div>
                ) : (
                  <div className={styles.solutionsList}>
                    {mySubmissions.map((submissionItem) => (
                      <SubmissionStatus
                        key={submissionItem.id}
                        submission={submissionItem}
                        testCases={
                          submissionItem.id === submission?.id ? latestTestCaseResults : undefined
                        }
                      />
                    ))}
                  </div>
                )}
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
          <div className={styles.codeEditorWrapper}>
            <CodeEditor
              value={code}
              onChange={setCode}
              onSubmit={handleSubmit}
              onRun={handleRun}
              disabled={isRunning || submitMutation.isPending}
              submitDisabled={isSubmitDisabled}
              consoleOutput={consoleOutput}
              isRunning={isRunning || submitMutation.isPending}
              language="python"
            />
          </div>
          {submission && (
            <SubmissionStatus submission={submission} testCases={latestTestCaseResults} />
          )}
        </div>
      </div>
    </div>
  )
}
