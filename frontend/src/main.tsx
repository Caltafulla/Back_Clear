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
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    // Only attempt to load user if:
    // 1. Not already initialized (first mount)
    // 2. We have a token in localStorage
    // 3. We don't already have a user in state
    const token = localStorage.getItem('access_token')
    
    if (!isInitialized && token && !user) {
      // Add a delay to batch React StrictMode double renders
      const timer = setTimeout(() => {
        // Double check conditions before loading
        const currentToken = localStorage.getItem('access_token')
        const currentState = useAuthStore.getState()
        if (currentToken && !currentState.user && !currentState.isLoading) {
          loadUser()
        }
      }, 500) // Increased delay to help with rate limiting
      
      return () => clearTimeout(timer)
    } else if (!isInitialized) {
      // Mark as initialized even if we're not loading
      useAuthStore.setState({ isInitialized: true })
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
