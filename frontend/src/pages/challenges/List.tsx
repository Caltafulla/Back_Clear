import React from 'react'
import Header from '../../components/layout/Header'
import styles from '../../styles/Challenges.module.css'

export default function ChallengesList() {
  return (
    <div>
      <Header />
      <main className={styles.main}>
        <h1>Challenges</h1>
        <p>List of challenges will appear here.</p>
      </main>
    </div>
  )
}
