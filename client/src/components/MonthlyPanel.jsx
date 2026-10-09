import { useState } from 'react'
import { Legend, Panel, ViewSwitch } from './Panel.jsx'
import { LineChart } from './charts/LineChart.jsx'
import { fmt, lastDayOfMonth, monthName } from '../lib/format.js'

const SERIES = [
  { key: 'submissions', label: 'Submissions', color: 'var(--series-sub)' },
  { key: 'hires', label: 'Hires', color: 'var(--series-hire)' },
]

export function MonthlyPanel({ report, asOf, className }) {
  const [view, setView] = useState('chart')
  const last = report.monthly[report.monthly.length - 1]
  const end = report.filters.to < asOf ? report.filters.to : asOf
  const partial = !!last && report.monthly.length > 1 && lastDayOfMonth(last.month) > end
  return (
    <Panel className={className} title="Monthly Submissions and Hires"
      sub={partial ? `${monthName(last.month)} is partial (through ${monthName(last.month, false)} ${+end.slice(8)}), shown dashed` : 'Counted in the month each event happened'}
      actions={<div className="toolbar"><Legend items={SERIES} /><ViewSwitch view={view} onChange={setView} /></div>}>
      {view === 'chart' ? <LineChart data={report.monthly} series={SERIES} partialLast={partial} /> : (
        <div className="tscroll" style={{ maxHeight: 300 }}><table>
          <thead><tr><th>Month</th><th className="r">Submissions</th><th className="r">Hires</th></tr></thead>
          <tbody>{report.monthly.map(m => (
            <tr key={m.month}><td>{monthName(m.month)}</td><td className="num r">{fmt(m.submissions)}</td><td className="num r">{fmt(m.hires)}</td></tr>
          ))}</tbody>
        </table></div>
      )}
    </Panel>
  )
}
