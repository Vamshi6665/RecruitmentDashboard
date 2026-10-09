import { useState } from 'react'
import { Panel, ViewSwitch } from './Panel.jsx'
import { HBarChart } from './charts/HBarChart.jsx'
import { fmt, pct } from '../lib/format.js'

export function PositionPanel({ report, className }) {
  const [view, setView] = useState('chart')
  const total = report.kpis.hires
  return (
    <Panel className={className} title="Hires by Position" sub={`${fmt(total)} hires in range`} actions={<ViewSwitch view={view} onChange={setView} />}>
      {view === 'chart'
        ? <HBarChart rows={report.hiresByPosition.map(p => ({ label: p.position, value: p.hires }))} color="var(--series-hire)" unit="hires" />
        : (
          <div className="tscroll"><table>
            <thead><tr><th>Position</th><th className="r">Hires</th><th className="r">Share</th></tr></thead>
            <tbody>{report.hiresByPosition.map(p => (
              <tr key={p.position}><td>{p.position}</td><td className="num r">{fmt(p.hires)}</td><td className="num r">{pct(p.hires, total)}</td></tr>
            ))}</tbody>
          </table></div>
        )}
    </Panel>
  )
}
