import { fmt, pct } from '../lib/format.js'

/** The six headline measures from the Power BI Recruitment Overview. */
export function KpiRow({ kpis: k }) {
  const items = [
    { label: 'Candidates Reached', value: k.reached, note: 'first contacted' },
    { label: 'Submissions', value: k.submissions, note: 'sent to clients', sw: 'var(--series-sub)' },
    { label: 'Candidates Interviewed', value: k.interviewed, note: 'at least one round' },
    { label: 'Hires', value: k.hires, note: `${pct(k.hires, k.submissions)} of submissions`, sw: 'var(--series-hire)' },
    { label: 'New Requirements', value: k.newRequirements, note: 'jobs opened' },
    { label: 'Outreach Attempts', value: k.outreachAttempts, note: 'calls, emails, LinkedIn' },
  ]
  return (
    <section className="kpis" aria-label="Key measures">
      {items.map(x => (
        <div className="kpi" key={x.label}>
          <div className="kpi-label">{x.sw && <span className="sw" style={{ background: x.sw }} />}{x.label}</div>
          <div className="kpi-value" data-testid={`kpi-${x.label}`}>{fmt(x.value)}</div>
          <div className="kpi-note">{x.note}</div>
        </div>
      ))}
    </section>
  )
}
