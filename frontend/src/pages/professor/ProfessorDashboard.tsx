import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMetrics } from '../../services/metrics'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function ProfessorDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['metrics', 'professor-overview'],
    queryFn: getMetrics,
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <LoadingSpinner />
        <span style={{ marginLeft: 8 }}>Loading professor overview...</span>
      </div>
    )
  }

  if (isError) {
    return <div style={{ padding: 24, color: 'var(--error)' }}>Failed to load metrics.</div>
  }

  return (
    <div style={{ padding: 24, display: 'grid', gap: 16 }}>
      <h1>Professor Overview</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <Card title="Total Submissions" value={data?.submissions?.total ?? 0} />
        <Card title="Today Submissions" value={data?.submissions?.today ?? 0} />
        <Card title="Challenges" value={data?.challenges?.total ?? 0} />
        <Card title="Active Evaluations" value={data?.evaluations?.active ?? 0} />
      </div>
      <div>
        <h2 style={{ marginTop: 8 }}>Quick Links</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
          <a className="btn" href="/professor/evaluations">Manage Evaluations</a>
          <a className="btn" href="/metrics">View Metrics</a>
        </div>
      </div>
    </div>
  )
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div style={{ border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16 }}>
      <div style={{ color: 'var(--gray-600)', fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  )
}

