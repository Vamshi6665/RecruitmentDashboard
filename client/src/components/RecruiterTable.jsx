import { useMemo, useState } from 'react'
import { Legend, Panel } from './Panel.jsx'
import { fmt, pct } from '../lib/format.js'

const COLS = [
  { key: 'name', label: 'Recruiter', text: true },
  { key: 'reached', label: 'Reached' },
  { key: 'submissions', label: 'Submissions' },
  { key: 'interviewed', label: 'Interviewed' },
  { key: 'hires', label: 'Hires' },
  { key: 'rate', label: 'Hire / sub' },
]

export function RecruiterTable({ report, className, onPick }) {
  const [sort, setSort] = useState({ key: 'hires', dir: -1 })
  const rows = useMemo(() => {
    const val = x => (sort.key === 'rate' ? (x.submissions ? x.hires / x.submissions : -1) : x[sort.key])
    return [...report.recruiters].sort((a, b) => {
      const va = val(a), vb = val(b)
      return (typeof va === 'string' ? va.localeCompare(vb) : va - vb) * sort.dir
    })
  }, [report, sort])
  const max = k => Math.max(1, ...report.recruiters.map(x => x[k]))
  const toggle = key => setSort(s => ({ key, dir: s.key === key ? -s.dir : key === 'name' ? 1 : -1 }))

  return (
    <Panel className={className} title="Recruiter Performance" sub={onPick ? 'Select a recruiter to open their analysis' : 'Select a column to sort'}
      actions={<Legend items={[{ label: 'Submissions', color: 'var(--series-sub)' }, { label: 'Hires', color: 'var(--series-hire)' }]} />}>
      {rows.length === 0 ? <div className="empty">No recruiter activity in this selection.</div> : (
        <div className="tscroll"><table>
          <thead><tr>{COLS.map(c => (
            <th key={c.key} className={c.text ? '' : 'r'} aria-sort={sort.key === c.key ? (sort.dir > 0 ? 'ascending' : 'descending') : undefined}>
              <button type="button" onClick={() => toggle(c.key)}>{c.label}{sort.key === c.key ? (sort.dir > 0 ? ' ↑' : ' ↓') : ''}</button>
            </th>
          ))}</tr></thead>
          <tbody>{rows.map(x => (
            <tr key={x.id} className={onPick ? 'clickable' : ''} tabIndex={onPick ? 0 : undefined}
              onClick={() => onPick?.(x.id)} onKeyDown={e => onPick && e.key === 'Enter' && onPick(x.id)}>
              <td><div className="who">{x.name}<small>{x.team}</small></div></td>
              <td className="num r">{fmt(x.reached)}</td>
              <BarCell v={x.submissions} max={max('submissions')} color="var(--series-sub)" />
              <td className="num r">{fmt(x.interviewed)}</td>
              <BarCell v={x.hires} max={max('hires')} color="var(--series-hire)" />
              <td className="num r">{pct(x.hires, x.submissions)}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </Panel>
  )
}

function BarCell({ v, max, color }) {
  return (
    <td className="r"><div className="inbar"><span className="num">{fmt(v)}</span>
      <span className="track"><span className="fill" style={{ width: `${(v / max) * 100}%`, background: color }} /></span></div></td>
  )
}
