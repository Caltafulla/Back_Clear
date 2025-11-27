import React, { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import styles from '../../styles/Layout.module.css'

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className={styles.shell} data-collapsed={collapsed}>
      <Header collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={styles.body}>
        <Sidebar collapsed={collapsed} />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  )
}

export default Layout
