import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMetrics } from '../../services/metrics'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import LineChart from '../../components/ui/LineChart'

type Sample = {
  t: number
  submissionsTotal: number
  submissionsToday: number
  avgExecMs: number
  workerUtil: number
  usersTotal: number
  challengesTotal: number
}

export default function AdminMetrics() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['metrics', 'full'],
    queryFn: getMetrics,
    refetchInterval: 15000,
  })

  const [samples, setSamples] = React.useState<Sample[]>([])

  React.useEffect(() => {
    if (!data) return
    const s: Sample = {
      t: Date.now(),
      submissionsTotal: Number(data?.submissions?.total ?? 0),
      submissionsToday: Number(data?.submissions?.today ?? 0),
      avgExecMs: Number(data?.performance?.average_execution_time ?? data?.performance?.average_execution_time_ms ?? 0),
      workerUtil: Number(data?.performance?.worker_utilization ?? 0) * 100,
      usersTotal: Number(data?.users?.total ?? 0),
      challengesTotal: Number(data?.challenges?.total ?? 0),
    }
    setSamples(prev => {
      const next = [...prev, s]
      // keep last 30 samples
      return next.slice(-30)
    })
  }, [data])

  if (isLoading && samples.length === 0) {
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

  const submissionSeries = [
    {
      name: 'Submissions Total',
      color: 'var(--primary-600)',
      points: samples.map(s => ({ x: s.t, y: s.submissionsTotal })),
    },
    {
      name: 'Submissions Today',
      color: 'var(--success)',
      points: samples.map(s => ({ x: s.t, y: s.submissionsToday })),
    },
  ]

  const usageSeries = [
    {
      name: 'Avg Exec Time (ms)',
      color: 'var(--info)',
      points: samples.map(s => ({ x: s.t, y: s.avgExecMs })),
    },
  ]

  const systemSeries = [
    {
      name: 'Worker Utilization (%)',
      color: 'var(--warning)',
      points: samples.map(s => ({ x: s.t, y: s.workerUtil })),
    },
    {
      name: 'Users Total',
      color: 'var(--gray-700)',
      points: samples.map(s => ({ x: s.t, y: s.usersTotal })),
    },
    {
      name: 'Challenges Total',
      color: 'var(--secondary-600)',
      points: samples.map(s => ({ x: s.t, y: s.challengesTotal })),
    },
  ]

  return (
    <div style={{ padding: 24, display: 'grid', gap: 24 }}>
      <h1>System Metrics</h1>
      <section>
        <h3 style={{ margin: '4px 0 8px' }}>Submissions</h3>
        <LineChart series={submissionSeries} height={260} />
      </section>
      <section>
        <h3 style={{ margin: '4px 0 8px' }}>Performance</h3>
        <LineChart series={usageSeries} height={260} />
      </section>
      <section>
        <h3 style={{ margin: '4px 0 8px' }}>System/Users</h3>
        <LineChart series={systemSeries} height={260} />
      </section>
    </div>
  )
}

