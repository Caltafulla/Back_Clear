import React, { useState } from 'react'
import { generateChallengeIdeas, generateTestCases, validateTestCase, type GeneratedChallengeIdea, type GeneratedTestCase } from '../services/assistant'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import styles from '../styles/AIAssistant.module.css'

export default function AIAssistantPage() {
  const [topic, setTopic] = useState('')
  const [ideaCount, setIdeaCount] = useState(3)
  const [ideas, setIdeas] = useState<GeneratedChallengeIdea[]>([])
  const [loadingIdeas, setLoadingIdeas] = useState(false)
  const [ideasError, setIdeasError] = useState<string | null>(null)

  const [description, setDescription] = useState('')
  const [caseCount, setCaseCount] = useState(5)
  const [testCases, setTestCases] = useState<GeneratedTestCase[]>([])
  const [loadingCases, setLoadingCases] = useState(false)
  const [casesError, setCasesError] = useState<string | null>(null)

  const [validationResult, setValidationResult] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)

  async function onGenerateIdeas(e: React.FormEvent) {
    e.preventDefault()
    setIdeasError(null)
    setLoadingIdeas(true)
    try {
      const res = await generateChallengeIdeas(topic.trim(), ideaCount)
      setIdeas(res)
    } catch (err: any) {
      setIdeas([])
      setIdeasError(err?.response?.data?.message || 'Failed to generate ideas')
    } finally {
      setLoadingIdeas(false)
    }
  }

  async function onGenerateCases(e: React.FormEvent) {
    e.preventDefault()
    setCasesError(null)
    setLoadingCases(true)
    try {
      const res = await generateTestCases(description.trim(), caseCount)
      setTestCases(res)
    } catch (err: any) {
      setTestCases([])
      setCasesError(err?.response?.data?.message || 'Failed to generate test cases')
    } finally {
      setLoadingCases(false)
    }
  }

  async function onValidateFirstCase() {
    if (!testCases[0]) return
    setValidating(true)
    setValidationResult(null)
    try {
      const ok = await validateTestCase(testCases[0].input, testCases[0].expectedOutput, 'python')
      setValidationResult(ok ? 'First test case looks consistent.' : 'The first test case may be inconsistent.')
    } catch (e) {
      setValidationResult('Validation failed.')
    } finally {
      setValidating(false)
    }
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {})
  }

  const getValidationClass = () => {
    if (!validationResult) return ''
    if (validationResult.includes('consistent')) return styles.validationSuccess
    if (validationResult.includes('failed')) return styles.validationError
    return styles.validationInfo
  }

  return (
    <div className={styles.aiAssistant}>
      <div className={styles.header}>
        <h1 className={styles.title}>AI Assistant</h1>
        <p className={styles.subtitle}>
          Use AI to draft challenge ideas and initial test cases. Always review outputs before publishing.
        </p>
      </div>

      <div className={styles.toolsGrid}>
        {/* Generate Challenge Ideas Card */}
        <div className={styles.toolCard}>
          <div className={styles.toolHeader}>
            <span className={styles.toolIcon}>💡</span>
            <div>
              <h2 className={styles.toolTitle}>Generate Challenge Ideas</h2>
              <p className={styles.toolDescription}>
                Get AI-generated challenge ideas based on a topic or category
              </p>
            </div>
          </div>

          <form onSubmit={onGenerateIdeas} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Topic or Category *</label>
              <input
                type="text"
                className={styles.input}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder='e.g. "Árboles binarios", "Búsqueda binaria", "Ordenamiento"'
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Number of Ideas</label>
              <input
                type="number"
                className={styles.input}
                min={1}
                max={10}
                value={ideaCount}
                onChange={(e) => setIdeaCount(Number(e.target.value))}
              />
            </div>
            <button
              type="submit"
              className={`btn btn-primary ${styles.submitButton}`}
              disabled={!topic.trim() || loadingIdeas}
            >
              {loadingIdeas ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Generating...</span>
                </>
              ) : (
                'Generate Ideas'
              )}
            </button>
            {ideasError && (
              <div className={styles.errorMessage}>{ideasError}</div>
            )}
          </form>

          {ideas.length > 0 && (
            <div className={styles.resultsSection}>
              <h3 className={styles.resultsTitle}>Generated Ideas ({ideas.length})</h3>
              <div className={styles.resultsList}>
                {ideas.map((idea, idx) => (
                  <div key={idx} className={styles.ideaCard}>
                    <div className={styles.ideaHeader}>
                      <h4 className={styles.ideaTitle}>{idea.title}</h4>
                      <button
                        className={`btn btn-secondary btn-sm ${styles.copyButton}`}
                        onClick={() => copy(`${idea.title}\n\n${idea.description}`)}
                      >
                        Copy
                      </button>
                    </div>
                    <p className={styles.ideaDescription}>{idea.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loadingIdeas && ideas.length === 0 && !ideasError && (
            <div className={styles.emptyState}>
              Enter a topic and click "Generate Ideas" to get started.
            </div>
          )}
        </div>

        {/* Generate Test Cases Card */}
        <div className={styles.toolCard}>
          <div className={styles.toolHeader}>
            <span className={styles.toolIcon}>🧪</span>
            <div>
              <h2 className={styles.toolTitle}>Generate Test Cases</h2>
              <p className={styles.toolDescription}>
                Generate test cases for a challenge based on its description
              </p>
            </div>
          </div>

          <form onSubmit={onGenerateCases} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Challenge Description *</label>
              <textarea
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Describe the problem in detail for better test cases...'
                rows={6}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Number of Test Cases</label>
              <input
                type="number"
                className={styles.input}
                min={1}
                max={20}
                value={caseCount}
                onChange={(e) => setCaseCount(Number(e.target.value))}
              />
            </div>
            <button
              type="submit"
              className={`btn btn-primary ${styles.submitButton}`}
              disabled={!description.trim() || loadingCases}
            >
              {loadingCases ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Generating...</span>
                </>
              ) : (
                'Generate Test Cases'
              )}
            </button>
            {casesError && (
              <div className={styles.errorMessage}>{casesError}</div>
            )}
          </form>

          {testCases.length > 0 && (
            <div className={styles.resultsSection}>
              <h3 className={styles.resultsTitle}>Generated Test Cases ({testCases.length})</h3>
              <div className={styles.resultsList}>
                {testCases.map((tc, idx) => (
                  <div key={idx} className={styles.testCaseCard}>
                    <div className={styles.testCaseHeader}>
                      <span className={styles.testCaseNumber}>Test Case #{idx + 1}</span>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => copy(`Input:\n${tc.input}\n\nExpected Output:\n${tc.expectedOutput}`)}
                      >
                        Copy
                      </button>
                    </div>
                    <div className={styles.testCaseContent}>
                      <div className={styles.testCaseField}>
                        <span className={styles.testCaseLabel}>Input</span>
                        <pre className={styles.testCaseValue}>{tc.input}</pre>
                      </div>
                      <div className={styles.testCaseField}>
                        <span className={styles.testCaseLabel}>Expected Output</span>
                        <pre className={styles.testCaseValue}>{tc.expectedOutput}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loadingCases && testCases.length === 0 && !casesError && (
            <div className={styles.emptyState}>
              Enter a challenge description and click "Generate Test Cases" to get started.
            </div>
          )}

          {testCases.length > 0 && (
            <div className={styles.validationSection}>
              <button
                className={`btn btn-secondary ${styles.validationButton}`}
                onClick={onValidateFirstCase}
                disabled={validating}
              >
                {validating ? 'Validating...' : 'Validate First Case'}
              </button>
              {validationResult && (
                <div className={`${styles.validationResult} ${getValidationClass()}`}>
                  {validationResult}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
