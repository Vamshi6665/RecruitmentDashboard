import { Panel } from './Panel.jsx'
import { HBarChart } from './charts/HBarChart.jsx'

/** Distinct applications reaching each stage in the range, with step-to-step rates. */
export function StagePanel({ report, className }) {
  const rows = report.stages.map(s => ({ label: s.stage, value: s.count }))
  const note = (_, i) => (i > 0 && rows[i - 1].value ? `${Math.round((rows[i].value / rows[i - 1].value) * 100)}% of ${rows[i - 1].label.toLowerCase()}` : null)
  return (
    <Panel className={className} title="Recruitment Stage Activity"
      sub="Distinct applications reaching each stage within the range. Activity, not a cohort funnel.">
      <HBarChart rows={rows} color="var(--stage)" unit="applications" note={note} />
    </Panel>
  )
}
