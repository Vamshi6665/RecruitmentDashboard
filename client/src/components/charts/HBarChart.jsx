import { useState } from 'react'
import { Tip, hbarPath, useWidth } from './chartKit.jsx'
import { fmt } from '../../lib/format.js'

/** One-series horizontal bars with value labels; `note(row, i)` adds a muted suffix. */
export function HBarChart({ rows, color, unit, note }) {
  const [ref, W] = useWidth()
  const [hover, setHover] = useState(null)
  if (!rows.length) return <div className="empty">Nothing in this selection.</div>

  const labelW = note ? Math.min(120, W * 0.3) : Math.min(190, W * 0.42)
  const padR = note ? 150 : 56, rowH = 28, bh = 15
  const H = rows.length * rowH
  const max = Math.max(...rows.map(r => r.value), 1)
  const sx = v => (v / max) * (W - labelW - padR)

  return (
    <div className="chart" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${unit} by category`}>
        {rows.map((r, i) => {
          const y = i * rowH + (rowH - bh) / 2
          const extra = note?.(r, i)
          return (
            <g key={r.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect className="hit row-hit" x={0} y={i * rowH} width={W} height={rowH} rx={4} />
              <text className="lab" x={labelW - 10} y={y + bh / 2 + 4} textAnchor="end">{r.label}</text>
              <path d={hbarPath(labelW, y, sx(r.value), bh)} fill={color} opacity={hover == null || hover === i ? 1 : 0.5} />
              <text className="v" x={labelW + sx(r.value) + 6} y={y + bh / 2 + 4}>
                {fmt(r.value)}{extra && <tspan className="v-note">{'  ' + extra}</tspan>}
              </text>
            </g>
          )
        })}
        <line className="bl" x1={labelW} x2={labelW} y1={0} y2={H} />
      </svg>
      {hover != null && (
        <Tip x={labelW + sx(rows[hover].value) / 2} y={hover * rowH + 4} width={W}>
          {rows[hover].label} · <b>{fmt(rows[hover].value)}</b> {unit}
        </Tip>
      )}
    </div>
  )
}
