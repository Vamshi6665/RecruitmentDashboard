import { useEffect, useState } from 'react'
import { Panel } from '../components/Panel.jsx'
import { ScatterChart } from '../components/charts/ScatterChart.jsx'
import { MonthlyPanel } from '../components/MonthlyPanel.jsx'
import { PositionPanel } from '../components/PositionPanel.jsx'
import { StagePanel } from '../components/StagePanel.jsx'
import { ApplicationsPanel } from '../components/ApplicationsPanel.jsx'
import { pct } from '../lib/format.js'

export function RecruiterAnalysisPage({ report, meta, client, filters }) {
  // The comparison always shows every recruiter; a recruiter filter highlights that one.
  const [peers, setPeers] = useState(null)
  useEffect(() => {
    if (!filters.recruiter) { setPeers(null); return }
    let live = true
    client.report({ ...filters, recruiter: '' }).then(r => live && setPeers(r)).catch(() => live && setPeers(null))
    return () => { live = false }
  }, [client, filters])
  const source = filters.recruiter ? peers : report
  const points = (source?.recruiters ?? []).map(x => ({
    id: x.id, label: x.name, x: x.submissions, y: x.hires, sub: `${pct(x.hires, x.submissions)} of submissions hired`,
  }))
  const picked = meta.recruiters.find(r => r.id === filters.recruiter)
  return (
    <div className="grid">
      <Panel className="span-5" title="Recruiter Outcomes Comparison"
        sub={picked ? `${picked.name} against every recruiter, same dates, position and client` : 'Each dot is a recruiter: submissions sent vs hires made in the range'}>
        {source ? <ScatterChart points={points} xLabel="Submissions" yLabel="Hires" color="var(--series-sub)" highlight={filters.recruiter} />
          : <div className="empty">Loading comparison…</div>}
      </Panel>
      <MonthlyPanel report={report} asOf={meta.maxDate} className="span-7" />
      <PositionPanel report={report} className="span-6" />
      <StagePanel report={report} className="span-6" />
      <ApplicationsPanel client={client} filters={filters} />
    </div>
  )
}
