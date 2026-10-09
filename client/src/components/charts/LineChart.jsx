import { useState } from 'react'
import { Tip, niceRange, useWidth } from './chartKit.jsx'
import { fmt, monthName } from '../../lib/format.js'

/**
 * Monthly counts, several series on one shared axis (all are counts of applications).
 * `partialLast` draws the final segment dashed for a month that is not complete.
 */
export function LineChart({ data, series, partialLast = false }) {
  const [ref, W] = useWidth()
  const [hover, setHover] = useState(null)
  if (!data.length) return <div className="empty">No months in this range.</div>

  const padL = 40, padR = 14, padT = 14, padB = 40, H = 280
  const iw = W - padL - padR, ih = H - padT - padB
  const [, max, tickStep] = niceRange(0, Math.max(1, ...data.flatMap(d => series.map(s => d[s.key]))))
  const step = data.length > 1 ? iw / (data.length - 1) : 0
  const x = i => padL + (data.length > 1 ? i * step : iw / 2)
  const y = v => padT + ih - (v / max) * ih
  const every = Math.ceil(data.length / Math.max(1, Math.floor(iw / 56)))
  const ticks = Array.from({ length: Math.round(max / tickStep) + 1 }, (_, i) => Math.round(i * tickStep))
  const solidEnd = partialLast && data.length > 1 ? data.length - 1 : data.length
  const path = (k, a, b) => data.slice(a, b).map((d, i) => `${i ? 'L' : 'M'}${x(a + i).toFixed(1)},${y(d[k]).toFixed(1)}`).join('')

  const onMove = e => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    setHover(Math.max(0, Math.min(data.length - 1, Math.round((px - padL) / (step || 1)))))
  }

  return (
    <div className="chart" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${series.map(s => s.label).join(' and ')} by month`}
        onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {ticks.map(t => (
          <g key={t}>
            <line className={t ? 'gl' : 'bl'} x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} />
            <text x={padL - 8} y={y(t) + 3.5} textAnchor="end">{t}</text>
          </g>
        ))}
        {data.map((d, i) => {
          if (i % every) return null
          const prev = data[i - every]?.month ?? ''
          const showYear = i === 0 || d.month.endsWith('-01') || prev.slice(0, 4) !== d.month.slice(0, 4)
          return (
            <g key={d.month}>
              <text x={x(i)} y={H - padB + 16} textAnchor="middle">{monthName(d.month, false)}</text>
              {showYear && <text x={x(i)} y={H - padB + 30} textAnchor="middle">{d.month.slice(0, 4)}</text>}
            </g>
          )
        })}
        {hover != null && <line className="cross" x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + ih} />}
        {series.map(s => (
          <g key={s.key}>
            <path d={path(s.key, 0, solidEnd)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {solidEnd < data.length && <path d={path(s.key, solidEnd - 1, data.length)} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray="4 4" />}
            {hover != null && <circle cx={x(hover)} cy={y(data[hover][s.key])} r={4.5} fill={s.color} stroke="var(--panel)" strokeWidth={2} />}
          </g>
        ))}
      </svg>
      {hover != null && (
        <Tip x={x(hover)} y={padT} width={W}>
          <div className="t-title">{monthName(data[hover].month)}{partialLast && hover === data.length - 1 ? ' (partial)' : ''}</div>
          {series.map(s => <div key={s.key}><span className="sw" style={{ background: s.color }} /> {s.label} <b>{fmt(data[hover][s.key])}</b></div>)}
        </Tip>
      )}
    </div>
  )
}
