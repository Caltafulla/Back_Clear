import type { FC } from 'react'
import Editor from '@monaco-editor/react'
import styles from '../../styles/CodeEditor.module.css'

const CodeEditor: FC = () => {
  return (
    <div className={styles.editor}>
      <Editor height="400px" defaultLanguage="typescript" defaultValue={'// Escribe tu código aquí'} />
    </div>
  )
}

export default CodeEditor
