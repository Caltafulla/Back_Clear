import React, { useState } from 'react'
import Editor from '@monaco-editor/react'
import type { Language } from '../../types/api'
import styles from '../../styles/CodeEditor.module.css'

type CodeEditorProps = {
  value?: string
  language?: Language
  onChange?: (value: string | undefined) => void
  onSubmit?: () => void
  onRun?: () => void
  disabled?: boolean
  consoleOutput?: string
  isRunning?: boolean
}

const languages: { value: Language; label: string }[] = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
]

export default function CodeEditor({
  value = '',
  language = 'typescript',
  onChange,
  onSubmit,
  onRun,
  disabled = false,
  consoleOutput = '',
  isRunning = false,
}: CodeEditorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language)
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [editorValue, setEditorValue] = useState(value)

  const handleEditorChange = (newValue: string | undefined) => {
    setEditorValue(newValue || '')
    onChange?.(newValue)
  }

  return (
    <div className={styles.editorContainer}>
      <div className={styles.editorHeader}>
        <div className={styles.headerLeft}>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as Language)}
            className={styles.languageSelect}
            disabled={disabled}
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.headerRight}>
          <button
            className={`btn btn-secondary ${styles.actionButton}`}
            onClick={onRun}
            disabled={disabled || isRunning}
          >
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
          <button
            className={`btn btn-primary ${styles.actionButton}`}
            onClick={onSubmit}
            disabled={disabled || isRunning}
          >
            Submit
          </button>
        </div>
      </div>

      <div className={styles.editorWrapper}>
        <Editor
          height="100%"
          language={selectedLanguage}
          value={editorValue}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            readOnly: disabled,
            wordWrap: 'on',
            tabSize: 2,
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>

      {(consoleOutput || isRunning) && (
        <div className={styles.consoleSection}>
          <button
            className={styles.consoleToggle}
            onClick={() => setConsoleOpen(!consoleOpen)}
          >
            <span>{consoleOpen ? '▼' : '▶'}</span>
            <span>Console {isRunning && '⚡'}</span>
          </button>
          {consoleOpen && (
            <div className={styles.console}>
              {isRunning ? (
                <div className={styles.consoleLoading}>
                  <span>Running your code...</span>
                </div>
              ) : (
                <pre className={styles.consoleOutput}>{consoleOutput || 'No output'}</pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
