import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth-store'
import styles from '../../styles/Sidebar.module.css'

const Sidebar: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  const location = useLocation()
  const user = useAuthStore((s: import('../../stores/auth-store').AuthState) => s.user)

  const studentMenu = [
    {
      section: 'Main',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/challenges', label: 'Challenges', icon: '💻' },
        { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
      ]
    },
    {
      section: 'My Progress',
      items: [
        { path: '/my-submissions', label: 'My Submissions', icon: '📝' },
        { path: '/active-evaluations', label: 'Active Evaluations', icon: '⏱️' },
        { path: '/recent-activity', label: 'Recent Activity', icon: '🕐' },
      ]
    }
  ]

  const adminMenu = [
    {
      section: 'Dashboard',
      items: [
        { path: '/dashboard', label: 'Overview', icon: '📊' },
        { path: '/metrics', label: 'Metrics', icon: '📈' },
      ]
    },
    {
      section: 'Management',
      items: [
        { path: '/challenges', label: 'Challenges', icon: '💻' },
        { path: '/challenge-management', label: 'Manage Challenges', icon: '⚙️' },
        { path: '/user-management', label: 'Users', icon: '👥' },
      ]
    }
  ]

  const menu = user?.role === 'ADMIN' ? adminMenu : studentMenu

  return (
    <aside className={styles.sidebar} data-collapsed={collapsed}>
      <nav>
        {menu.map((section, idx) => (
          <div key={idx} className={styles.sidebarSection}>
            <div className={styles.sidebarSectionTitle}>{section.section}</div>
            <ul className={styles.sidebarNav}>
              {section.items.map(item => {
                const isActive = location.pathname === item.path || 
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ''}`}
                    >
                      <span className={styles.sidebarIcon}>{item.icon}</span>
                      <span className={styles.sidebarLabel}>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
