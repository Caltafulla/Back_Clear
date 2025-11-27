import React, { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import styles from '../../styles/Layout.module.css'

const Layout: React.FC<{ children: React.ReactNode; fullWidth?: boolean }> = ({ 
  children, 
  fullWidth = false 
}) => {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed))
  }, [collapsed])

  return (
    <div className={styles.shell} data-collapsed={collapsed}>
      <Header collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={styles.body}>
        <Sidebar collapsed={collapsed} />
        <main className={fullWidth ? styles.mainFullWidth : styles.main}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
