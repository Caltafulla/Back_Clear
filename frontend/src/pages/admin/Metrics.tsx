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
  const [demoOn, setDemoOn] = React.useState(false)
  const demoTimerRef = React.useRef<number | null>(null)

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

  // Demo generator
  const startDemo = () => {
    if (demoTimerRef.current) return
    setDemoOn(true)
    // Initialize baseline if empty
    setSamples(prev => {
      if (prev.length > 0) return prev
      const t = Date.now()
      const base: Sample = {
        t,
        submissionsTotal: 5,
        submissionsToday: 2,
        avgExecMs: 350,
        workerUtil: 20,
        usersTotal: 12,
        challengesTotal: 4,
      }
      return [base]
    })
    demoTimerRef.current = window.setInterval(() => {
      setSamples(prev => {
        const last = prev[prev.length - 1] || {
          t: Date.now(),
          submissionsTotal: 5,
          submissionsToday: 2,
          avgExecMs: 350,
          workerUtil: 20,
          usersTotal: 12,
          challengesTotal: 4,
        }
        const t = (last.t || Date.now()) + 1000
        // Add some noise and trends
        const submissionsInc = Math.max(0, Math.round((Math.random() * 1.6) - 0.1))
        const todayInc = Math.max(0, Math.round((Math.random() * 1.2) - 0.1))
        const execMs = Math.max(50, Math.min(2000, Math.round(last.avgExecMs + (Math.random() - 0.5) * 30)))
        const util = Math.max(0, Math.min(100, Math.round(last.workerUtil + (Math.random() - 0.45) * 5)))
        const users = last.usersTotal + (Math.random() < 0.06 ? 1 : 0)
        const challenges = last.challengesTotal + (Math.random() < 0.05 ? 1 : 0)
        const next: Sample = {
          t,
          submissionsTotal: last.submissionsTotal + submissionsInc,
          submissionsToday: last.submissionsToday + todayInc,
          avgExecMs: execMs,
          workerUtil: util,
          usersTotal: users,
          challengesTotal: challenges,
        }
        const arr = [...prev, next]
        return arr.slice(-30)
      })
    }, 1000)
  }

  const stopDemo = () => {
    if (demoTimerRef.current) {
      window.clearInterval(demoTimerRef.current)
      demoTimerRef.current = null
    }
    setDemoOn(false)
  }

  const resetDemo = () => {
    stopDemo()
    setSamples([])
  }

  React.useEffect(() => {
    return () => {
      if (demoTimerRef.current) {
        window.clearInterval(demoTimerRef.current)
        demoTimerRef.current = null
      }
    }
  }, [])

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>System Metrics</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!demoOn ? (
            <button className="btn" onClick={startDemo}>Demo: Start</button>
          ) : (
            <button className="btn" onClick={stopDemo}>Demo: Stop</button>
          )}
          <button className="btn" onClick={resetDemo}>Reset</button>
        </div>
      </div>
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

