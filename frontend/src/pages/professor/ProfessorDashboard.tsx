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
    <div style={{ padding: 24, display: 'grid', gap: 20 }}>
      <h1 style={{ margin: 0 }}>Professor Overview</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard title="Total Submissions" value={data?.submissions?.total ?? 0} icon="📦" accent="var(--primary-600)" />
        <StatCard title="Today Submissions" value={data?.submissions?.today ?? 0} icon="🕒" accent="var(--secondary-600)" />
        <StatCard title="Challenges" value={data?.challenges?.total ?? 0} icon="💻" accent="var(--info)" />
        <StatCard title="Active Evaluations" value={data?.evaluations?.active ?? 0} icon="⏱️" accent="var(--warning)" />
      </div>
      <div>
        <h2 style={{ margin: '12px 0 8px' }}>Quick Links</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 8 }}>
          <QuickLink href="/professor/evaluations" icon="📝" label="Manage Evaluations" />
          <QuickLink href="/metrics" icon="📈" label="View Metrics" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, accent }: { title: string; value: number; icon: string; accent: string }) {
  return (
    <div style={{ border: '1px solid var(--gray-200)', borderRadius: 12, padding: 16, background: 'white', boxShadow: '0 1px 2px rgba(16,24,40,.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: 'var(--gray-600)', fontSize: 14 }}>{title}</div>
        <div style={{ width: 34, height: 34, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'var(--gray-50)', color: accent }}>{icon}</div>
      </div>
      <div style={{ fontSize: 34, fontWeight: 800, marginTop: 6 }}>{value}</div>
    </div>
  )
}

function QuickLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a href={href} style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      border: '1px solid var(--gray-200)',
      borderRadius: 10,
      padding: '14px 16px',
      textDecoration: 'none',
      color: 'inherit',
      background: 'white',
      boxShadow: '0 1px 2px rgba(16,24,40,.04)'
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontWeight: 600 }}>{label}</span>
    </a>
  )
}

