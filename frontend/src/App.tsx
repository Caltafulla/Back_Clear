import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import ChallengesList from './pages/challenges/List'
import ChallengeDetail from './pages/challenges/Detail'
import { useAuthStore } from './stores/auth-store'
import type { ReactNode } from 'react'
import type { Role } from './types/api'

function RequireAuth({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const user = useAuthStore((state: import('./stores/auth-store').AuthState) => state.user)
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
        element={<RequireAuth roles={["STUDENT"]}><DashboardPage /></RequireAuth>}
      />
      <Route path="/challenges" element={<RequireAuth><ChallengesList /></RequireAuth>} />
      <Route path="/challenges/:id" element={<RequireAuth><ChallengeDetail /></RequireAuth>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
