import React from 'react'
import { useParams } from 'react-router-dom'
import Header from '../../components/layout/Header'
import CodeEditor from '../../components/editor/CodeEditor'
import styles from '../../styles/ChallengeDetail.module.css'

export default function ChallengeDetail() {
  const { id } = useParams()
  return (
    <div>
      <Header />
      <main className={styles.main}>
        <h1>Challenge {id}</h1>
        <div className={styles.split}>
          <section className={styles.left}>
            <h2>Description</h2>
            <p>Markdown description will render here.</p>
          </section>
          <aside className={styles.right}>
            <CodeEditor />
          </aside>
        </div>
      </main>
    </div>
  )
}
