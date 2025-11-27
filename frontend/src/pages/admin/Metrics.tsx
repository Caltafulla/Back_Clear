import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMetrics } from '../../services/metrics'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function AdminMetrics() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['metrics', 'full'],
    queryFn: getMetrics,
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <LoadingSpinner />
        <span style={{ marginLeft: 8 }}>Loading metrics...</span>
      </div>
    )
  }

  if (isError) {
    return <div style={{ padding: 24, color: 'var(--error)' }}>Failed to load metrics.</div>
  }

  return (
    <div style={{ padding: 24, display: 'grid', gap: 16 }}>
      <h1>System Metrics</h1>
      <pre style={{ background: 'var(--gray-50)', padding: 16, borderRadius: 8, overflow: 'auto' }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

