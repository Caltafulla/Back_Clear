import React from 'react'
import styles from '../../styles/Sidebar.module.css'

const Sidebar: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  return (
    <aside className={styles.sidebar} data-collapsed={collapsed}>
      <nav>
        <ul>
          <li>Dashboard</li>
          <li>Challenges</li>
          <li>Leaderboard</li>
          <li>Evaluations</li>
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
