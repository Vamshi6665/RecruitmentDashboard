import { Panel } from '../components/Panel.jsx'
import { fmt, pct } from '../lib/format.js'

export function RecruitersPage({ meta, allTime, onOpen }) {
  const stats = new Map(allTime?.recruiters.map(x => [x.id, x]))
  return (
    <Panel title="Recruiters" sub="Team, manager and all-time activity. Select a recruiter to open their analysis.">
      <div className="tscroll"><table>
        <thead><tr><th>Recruiter</th><th>Title</th><th>Team</th><th>Manager</th><th className="r">Reached</th><th className="r">Submissions</th><th className="r">Hires</th><th className="r">Hire / sub</th></tr></thead>
        <tbody>{meta.recruiters.map(x => {
          const s = stats.get(x.id)
          return (
            <tr key={x.id} className="clickable" tabIndex={0} onClick={() => onOpen(x.id)} onKeyDown={e => e.key === 'Enter' && onOpen(x.id)}>
              <td><div className="who">{x.name}<small className="mono">{x.id}</small></div></td>
              <td>{x.title}</td><td>{x.team}</td><td>{x.manager}</td>
              <td className="num r">{s ? fmt(s.reached) : '—'}</td><td className="num r">{s ? fmt(s.submissions) : '—'}</td>
              <td className="num r">{s ? fmt(s.hires) : '—'}</td><td className="num r">{s ? pct(s.hires, s.submissions) : '—'}</td>
            </tr>
          )
        })}</tbody>
      </table></div>
    </Panel>
  )
}
