import React, { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { useAuthStore } from './stores/auth-store'
import './styles/global.css'

const queryClient = new QueryClient()

function AppWithAuth() {
  const loadUser = useAuthStore((state) => state.loadUser)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token && !user) {
      loadUser()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppWithAuth />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
