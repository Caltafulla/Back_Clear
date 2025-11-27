import React, { useState, useEffect } from 'react'
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
  submitDisabled?: boolean
  consoleOutput?: string
  isRunning?: boolean
}

export default function CodeEditor({
  value = '',
  language = 'python',
  onChange,
  onSubmit,
  onRun,
  disabled = false,
  submitDisabled = false,
  consoleOutput = '',
  isRunning = false,
}: CodeEditorProps) {
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [editorValue, setEditorValue] = useState(value)

  useEffect(() => {
    setEditorValue(value)
  }, [value])

  const handleEditorChange = (newValue: string | undefined) => {
    setEditorValue(newValue || '')
    onChange?.(newValue)
  }

  useEffect(() => {
    if ((consoleOutput && !consoleOpen) || isRunning) {
      setConsoleOpen(true)
    }
  }, [consoleOutput, isRunning, consoleOpen])

  const getLanguageLabel = (lang: Language) => {
    switch (lang) {
      case 'python':
        return 'Python'
      case 'javascript':
        return 'JavaScript'
      case 'cpp':
        return 'C++'
      case 'java':
        return 'Java'
      default:
        return lang
    }
  }

  return (
    <div className={styles.editorContainer}>
      <div className={styles.editorHeader}>
        <div className={styles.languageTag}>{getLanguageLabel(language)}</div>
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
            disabled={disabled || isRunning || submitDisabled}
          >
            Submit
          </button>
        </div>
      </div>

      <div className={styles.editorWrapper}>
        <Editor
          height="100%"
          language={language}
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
