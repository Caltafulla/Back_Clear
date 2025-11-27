import React from 'react'
import { generateChallengeIdeas, generateTestCases, validateTestCase, type GeneratedChallengeIdea, type GeneratedTestCase } from '../services/assistant'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function AIAssistantPage() {
  const [topic, setTopic] = React.useState('')
  const [ideaCount, setIdeaCount] = React.useState(3)
  const [ideas, setIdeas] = React.useState<GeneratedChallengeIdea[]>([])
  const [loadingIdeas, setLoadingIdeas] = React.useState(false)
  const [ideasError, setIdeasError] = React.useState<string | null>(null)

  const [description, setDescription] = React.useState('')
  const [caseCount, setCaseCount] = React.useState(5)
  const [testCases, setTestCases] = React.useState<GeneratedTestCase[]>([])
  const [loadingCases, setLoadingCases] = React.useState(false)
  const [casesError, setCasesError] = React.useState<string | null>(null)

  const [validationResult, setValidationResult] = React.useState<string | null>(null)
  const [validating, setValidating] = React.useState(false)

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

  return (
    <div style={{ padding: 24, display: 'grid', gap: 20 }}>
      <h1 style={{ margin: 0 }}>AI Assistant</h1>
      <p style={{ margin: '4px 0 16px', color: 'var(--gray-700)' }}>
        Use AI to draft challenge ideas and initial test cases. Always review outputs before publishing.
      </p>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <div style={{ border: '1px solid var(--gray-300)', borderRadius: 8, padding: 16 }}>
          <h2 style={{ margin: '0 0 12px' }}>Generate Challenge Ideas</h2>
          <form onSubmit={onGenerateIdeas} style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Topic or category</span>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder='e.g. "Árboles binarios", "Búsqueda binaria", "Ordenamiento"'
              />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>How many ideas?</span>
              <input
                type="number"
                min={1}
                max={10}
                value={ideaCount}
                onChange={(e) => setIdeaCount(Number(e.target.value))}
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={!topic.trim() || loadingIdeas}>
              {loadingIdeas ? <><LoadingSpinner size="sm" /> <span style={{ marginLeft: 8 }}>Generating...</span></> : 'Generate ideas'}
            </button>
            {ideasError && <div style={{ color: 'var(--error)' }}>{ideasError}</div>}
          </form>
          <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
            {ideas.map((idea, idx) => (
              <div key={idx} style={{ border: '1px solid var(--gray-200)', borderRadius: 6, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <strong>{idea.title}</strong>
                  <button className="btn btn-secondary" onClick={() => copy(`${idea.title}\n\n${idea.description}`)}>Copy</button>
                </div>
                <p style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{idea.description}</p>
              </div>
            ))}
            {(!loadingIdeas && ideas.length === 0) && (
              <div style={{ color: 'var(--gray-700)' }}>No ideas yet.</div>
            )}
          </div>
        </div>

        <div style={{ border: '1px solid var(--gray-300)', borderRadius: 8, padding: 16 }}>
          <h2 style={{ margin: '0 0 12px' }}>Generate Test Cases</h2>
          <form onSubmit={onGenerateCases} style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Challenge description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder='Describe the problem in detail for better test cases...'
              />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>How many cases?</span>
              <input
                type="number"
                min={1}
                max={20}
                value={caseCount}
                onChange={(e) => setCaseCount(Number(e.target.value))}
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={!description.trim() || loadingCases}>
              {loadingCases ? <><LoadingSpinner size="sm" /> <span style={{ marginLeft: 8 }}>Generating...</span></> : 'Generate cases'}
            </button>
            {casesError && <div style={{ color: 'var(--error)' }}>{casesError}</div>}
          </form>
          <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
            {testCases.map((tc, idx) => (
              <div key={idx} style={{ border: '1px solid var(--gray-200)', borderRadius: 6, padding: 12, display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>Case #{idx + 1}</strong>
                  <button className="btn btn-secondary" onClick={() => copy(`${tc.input}\n${tc.expectedOutput}`)}>Copy .in/.out</button>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--gray-700)' }}>Input</div>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{tc.input}</pre>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--gray-700)' }}>Expected Output</div>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{tc.expectedOutput}</pre>
                </div>
              </div>
            ))}
            {(!loadingCases && testCases.length === 0) && (
              <div style={{ color: 'var(--gray-700)' }}>No test cases yet.</div>
            )}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" onClick={onValidateFirstCase} disabled={testCases.length === 0 || validating}>
              {validating ? 'Validating...' : 'Quick-validate first case'}
            </button>
            {validationResult && <span>{validationResult}</span>}
          </div>
        </div>
      </section>
    </div>
  )
}


