import React from 'react'

type Point = { x: number; y: number }
type Series = { name: string; color: string; points: Point[] }

type Props = {
  series: Series[]
  height?: number
}

export default function LineChart({ series, height = 240 }: Props) {
  const padding = { top: 12, right: 16, bottom: 24, left: 40 }
  const width = 800 // will scale via viewBox to parent width

  const allPoints = series.flatMap(s => s.points)
  if (allPoints.length === 0) {
    return <div style={{ color: 'var(--gray-600)' }}>No data</div>
  }

  const xMin = Math.min(...allPoints.map(p => p.x))
  const xMax = Math.max(...allPoints.map(p => p.x))
  const yMin = 0
  const yMax = Math.max(1, Math.max(...allPoints.map(p => p.y)))

  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom

  const sx = (x: number) => {
    if (xMax === xMin) return padding.left
    return padding.left + ((x - xMin) / (xMax - xMin)) * plotW
  }
  const sy = (y: number) => {
    if (yMax === yMin) return padding.top + plotH
    return padding.top + (1 - (y - yMin) / (yMax - yMin)) * plotH
  }

  // Build axes ticks (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + (i * (yMax - yMin)) / 4)
  const xTicks = Array.from({ length: 5 }, (_, i) => xMin + (i * (xMax - xMin || 1)) / 4)

  const linePath = (pts: Point[]) => {
    if (pts.length === 0) return ''
    return pts
      .sort((a, b) => a.x - b.x)
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x)} ${sy(p.y)}`)
      .join(' ')
  }

  const formatTime = (t: number) => {
    const d = new Date(t)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
  }

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
        {/* Grid horizontal */}
        {yTicks.map((yt, idx) => (
          <line
            key={`ygrid-${idx}`}
            x1={padding.left}
            y1={sy(yt)}
            x2={width - padding.right}
            y2={sy(yt)}
            stroke="var(--gray-200)"
            strokeDasharray="3 3"
          />
        ))}
        {/* Y axis */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="var(--gray-400)"
        />
        {/* X axis */}
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="var(--gray-400)"
        />
        {/* Y ticks labels */}
        {yTicks.map((yt, idx) => (
          <text key={`ylabel-${idx}`} x={padding.left - 6} y={sy(yt)} textAnchor="end" alignmentBaseline="middle" fontSize="10" fill="var(--gray-600)">
            {Math.round(yt)}
          </text>
        ))}
        {/* X ticks labels */}
        {xTicks.map((xt, idx) => (
          <text key={`xlabel-${idx}`} x={sx(xt)} y={height - padding.bottom + 12} textAnchor="middle" fontSize="10" fill="var(--gray-600)">
            {formatTime(xt)}
          </text>
        ))}

        {/* Series lines */}
        {series.map((s, idx) => (
          <path
            key={`line-${idx}`}
            d={linePath(s.points)}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
          />
        ))}
      </svg>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
        {series.map((s, idx) => (
          <div key={`legend-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 2, background: s.color, display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: 'var(--gray-700)' }}>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}


