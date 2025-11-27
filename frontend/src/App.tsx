import { Routes, Route, Navigate } from 'react-router-dom'
import React from 'react'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import ChallengesList from './pages/challenges/List'
import ChallengeDetail from './pages/challenges/Detail'
import Layout from './components/layout/Layout'
import LoadingSpinner from './components/ui/LoadingSpinner'
import { useAuthStore } from './stores/auth-store'
import type { ReactNode } from 'react'
import type { Role } from './types/api'
import LeaderboardPage from './pages/Leaderboard'
import RegisterPage from './pages/Register'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminMetrics from './pages/admin/Metrics'
import ChallengeManagement from './pages/admin/ChallengeManagement'
import CourseManagement from './pages/admin/CourseManagement'
import EvaluationManagement from './pages/admin/EvaluationManagement'
import ProfessorDashboard from './pages/professor/ProfessorDashboard'

function RequireAuth({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const user = useAuthStore((state: import('./stores/auth-store').AuthState) => state.user)
  const isLoading = useAuthStore((state: import('./stores/auth-store').AuthState) => state.isLoading)
  const isInitialized = useAuthStore((state: import('./stores/auth-store').AuthState) => state.isInitialized)
  const loadUser = useAuthStore((state: import('./stores/auth-store').AuthState) => state.loadUser)

  // Check if we have a token in localStorage
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('access_token')

  // If we have a token but no user and not loading, try to load user
  React.useEffect(() => {
    if (hasToken && !user && !isLoading && isInitialized) {
      // Only try once if we're already initialized
      const timer = setTimeout(() => {
        loadUser()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [hasToken, user, isLoading, isInitialized, loadUser])

  // Show loading if we're loading or if we have a token but no user yet
  if (isLoading || (hasToken && !user && !isInitialized)) {
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

  // Only redirect to login if we don't have a token OR if we're initialized and have no user
  if (!hasToken || (isInitialized && !user)) {
    return <Navigate to="/login" replace />
  }

  // If we have a token but user is still null (e.g., rate limited), show a message
  if (hasToken && !user) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        gap: '16px',
        padding: '24px'
      }}>
        <p>Verifying authentication...</p>
        <button 
          className="btn btn-primary" 
          onClick={() => loadUser()}
        >
          Retry
        </button>
      </div>
    )
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
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
      <Route
        path="/leaderboard"
        element={
          <RequireAuth>
            <Layout>
              <LeaderboardPage />
            </Layout>
          </RequireAuth>
        }
      />
      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <RequireAuth roles={["ADMIN"]}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/metrics"
        element={
          <RequireAuth roles={["ADMIN", "PROFESSOR"]}>
            <Layout>
              <AdminMetrics />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/challenge-management"
        element={
          <RequireAuth roles={["ADMIN"]}>
            <Layout>
              <ChallengeManagement />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/course-management"
        element={
          <RequireAuth roles={["ADMIN"]}>
            <Layout>
              <CourseManagement />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/evaluation-management"
        element={
          <RequireAuth roles={["ADMIN"]}>
            <Layout>
              <EvaluationManagement />
            </Layout>
          </RequireAuth>
        }
      />
      {/* Professor routes */}
      <Route
        path="/professor"
        element={
          <RequireAuth roles={["PROFESSOR"]}>
            <Layout>
              <ProfessorDashboard />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/professor/evaluations"
        element={
          <RequireAuth roles={["PROFESSOR"]}>
            <Layout>
              <EvaluationManagement />
            </Layout>
          </RequireAuth>
        }
      />
      <Route path="/test-layout" element={<Layout><div style={{ padding: 24 }}>Test Layout OK</div></Layout>} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
