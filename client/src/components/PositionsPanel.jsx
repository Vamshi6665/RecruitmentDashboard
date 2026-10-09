import { Panel } from './Panel.jsx'
import { fmt, pct } from '../lib/format.js'

const SEGMENTS = [
  { key: 'filled', label: 'Filled', color: 'var(--good)' },
  { key: 'cancelled', label: 'Cancelled at closure', color: 'var(--ink-3)' },
  { key: 'openNow', label: 'Still open', color: 'var(--iris)' },
]

/**
 * Requirements vs positions: one requirement asks for several positions (openings).
 * Every position ends up filled, cancelled when the job closed, or still open on a live job.
 */
export function PositionsPanel({ positions: p, className }) {
  if (!p) return null
  const stats = [
    { label: 'Requirements', value: p.requirements, note: `${fmt(p.liveRequirements)} still live` },
    { label: 'Positions requested', value: p.openings, note: p.requirements ? `${(p.openings / p.requirements).toFixed(1)} per requirement` : '—' },
    { label: 'Filled', value: p.filled, note: `${pct(p.filled, p.openings)} fill rate`, sw: 'var(--good)' },
    { label: 'Cancelled', value: p.cancelled, note: 'job closed before filling', sw: 'var(--ink-3)' },
    { label: 'Open positions', value: p.openNow, note: p.onHold ? `incl. ${fmt(p.onHold)} on hold` : 'on live requirements', sw: 'var(--iris)' },
  ]
  const label = SEGMENTS.map(s => `${s.label} ${fmt(p[s.key])}`).join(', ')
  return (
    <Panel className={className} title="Positions"
      sub="Requirements opened in the range and the positions they asked for. Status as of the latest snapshot; recruiter = job owner.">
      <div className="pos-stats">
        {stats.map(s => (
          <div className="pos-stat" key={s.label}>
            <div className="kpi-label">{s.sw && <span className="sw" style={{ background: s.sw }} />}{s.label}</div>
            <div className="pos-value num" data-testid={`pos-${s.label}`}>{fmt(s.value)}</div>
            <div className="kpi-note">{s.note}</div>
          </div>
        ))}
      </div>
      {p.openings > 0 ? (
        <div className="pos-bar" role="img" aria-label={`${fmt(p.openings)} positions: ${label}`}>
          {SEGMENTS.filter(s => p[s.key] > 0).map(s => (
            <span key={s.key} style={{ flexGrow: p[s.key], background: s.color }} title={`${s.label}: ${fmt(p[s.key])} (${pct(p[s.key], p.openings)})`} />
          ))}
        </div>
      ) : <div className="empty">No requirements opened in this range.</div>}
    </Panel>
  )
}
