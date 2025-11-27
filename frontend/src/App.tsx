import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import ChallengesList from './pages/challenges/List'
import ChallengeDetail from './pages/challenges/Detail'
import Layout from './components/layout/Layout'
import LoadingSpinner from './components/ui/LoadingSpinner'
import { useAuthStore } from './stores/auth-store'
import type { ReactNode } from 'react'
import type { Role } from './types/api'

function RequireAuth({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const user = useAuthStore((state: import('./stores/auth-store').AuthState) => state.user)
  const isLoading = useAuthStore((state: import('./stores/auth-store').AuthState) => state.isLoading)

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        gap: '16px'
      }}>
        <LoadingSpinner size="lg" />
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth roles={["STUDENT"]}>
            <Layout>
              <DashboardPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/challenges"
        element={
          <RequireAuth>
            <Layout>
              <ChallengesList />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/challenges/:id"
        element={
          <RequireAuth>
            <Layout fullWidth>
              <ChallengeDetail />
            </Layout>
          </RequireAuth>
        }
      />
      <Route path="/test-layout" element={<Layout><div style={{ padding: 24 }}>Test Layout OK</div></Layout>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
