import { useState } from 'react'
import { Tip, niceRange, useWidth } from './chartKit.jsx'
import { fmt } from '../../lib/format.js'

/** Labeled dots. Labels go right of the dot, else left, else appear only on hover. */
export function ScatterChart({ points, xLabel, yLabel, color, highlight }) {
  const [ref, W] = useWidth()
  const [hover, setHover] = useState(null)
  if (!points.length) return <div className="empty">No recruiter activity in this selection.</div>

  const padL = 48, padR = 18, padT = 14, padB = 44, H = 280
  const iw = W - padL - padR, ih = H - padT - padB
  const [x0, x1, xs] = niceRange(Math.min(...points.map(p => p.x)), Math.max(...points.map(p => p.x)))
  const [y0, y1, ys] = niceRange(Math.min(...points.map(p => p.y)), Math.max(...points.map(p => p.y)))
  const sx = v => padL + ((v - x0) / (x1 - x0)) * iw
  const sy = v => padT + ih - ((v - y0) / (y1 - y0)) * ih
  const ticks = (lo, hi, st) => { const o = []; for (let v = lo; v <= hi + 1e-9; v += st) o.push(Math.round(v * 100) / 100); return o }

  const boxes = []
  const labelX = {}
  ;[...points.keys()].sort((a, b) => points[b].y - points[a].y).forEach(i => {
    const p = points[i], w = p.label.length * 6.6 + 4, cx = sx(p.x), cy = sy(p.y)
    const free = x => x >= padL && x + w <= W - 2 &&
      boxes.every(b => Math.abs(b.y - cy) > 13 || x + w < b.x || x > b.x + b.w) &&
      points.every((q, j) => j === i || Math.abs(sy(q.y) - cy) > 8 || sx(q.x) < x - 6 || sx(q.x) > x + w + 6)
    const x = free(cx + 9) ? cx + 9 : free(cx - 9 - w) ? cx - 9 - w : null
    if (x != null) boxes.push({ x, y: cy, w })
    labelX[i] = x
  })

  return (
    <div className="chart" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${yLabel} versus ${xLabel}`}>
        {ticks(y0, y1, ys).map(t => (
          <g key={'y' + t}>
            <line className="gl" x1={padL} x2={W - padR} y1={sy(t)} y2={sy(t)} />
            <text x={padL - 8} y={sy(t) + 3.5} textAnchor="end">{fmt(t)}</text>
          </g>
        ))}
        {ticks(x0, x1, xs).map(t => <text key={'x' + t} x={sx(t)} y={H - padB + 16} textAnchor="middle">{fmt(t)}</text>)}
        <line className="bl" x1={padL} x2={W - padR} y1={padT + ih} y2={padT + ih} />
        <text x={padL + iw / 2} y={H - 6} textAnchor="middle">{xLabel} →</text>
        <text x={12} y={padT + ih / 2} textAnchor="middle" transform={`rotate(-90 12 ${padT + ih / 2})`}>{yLabel} →</text>
        {points.map((p, i) => (
          <g key={p.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <circle className="hit" cx={sx(p.x)} cy={sy(p.y)} r={14} />
            <circle cx={sx(p.x)} cy={sy(p.y)} r={hover === i || p.id === highlight ? 7 : 5.5} fill={color} stroke="var(--panel)" strokeWidth={2}
              opacity={highlight && p.id !== highlight ? 0.35 : 1} />
            {(labelX[i] != null || hover === i || p.id === highlight) &&
              <text className={p.id === highlight ? 'lab strong' : 'lab'} x={labelX[i] ?? sx(p.x) + 9} y={sy(p.y) + 4}>{p.label}</text>}
          </g>
        ))}
      </svg>
      {hover != null && (
        <Tip x={sx(points[hover].x)} y={sy(points[hover].y) - 6} width={W}>
          <div className="t-title">{points[hover].label}</div>
          <div>{xLabel} <b>{fmt(points[hover].x)}</b> · {yLabel} <b>{fmt(points[hover].y)}</b></div>
          {points[hover].sub && <div>{points[hover].sub}</div>}
        </Tip>
      )}
    </div>
  )
}
