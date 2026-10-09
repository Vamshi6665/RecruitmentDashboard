import { useEffect, useMemo, useState } from 'react'
import { Panel } from '../components/Panel.jsx'
import { Icon } from '../components/Icon.jsx'
import { fmt } from '../lib/format.js'
import { LIVE_STATUSES } from '@hub/shared'

const TONE = { Filled: 'good', 'Closed - Unfilled': 'bad', 'On Hold': 'warn', Open: 'info' }
const STATUSES = ['Open', 'On Hold', 'Filled', 'Closed - Unfilled', '']

export function JobsPage({ client, meta }) {
  const [jobs, setJobs] = useState(null)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('Open')
  const [q, setQ] = useState('')
  useEffect(() => { client.jobs().then(setJobs).catch(e => setError(e.message)) }, [client])
  const owner = id => meta.recruiters.find(r => r.id === id)?.name ?? id
  const counts = useMemo(() => {
    const c = {}
    jobs?.forEach(j => { c[j.status] = (c[j.status] ?? 0) + 1 })
    return c
  }, [jobs])
  const positions = useMemo(() => {
    let total = 0, open = 0
    jobs?.forEach(j => { total += j.openings; if (LIVE_STATUSES.includes(j.status)) open += Math.max(0, j.openings - j.hires) })
    return { total, open }
  }, [jobs])
  const rows = (jobs ?? []).filter(j => (!status || j.status === status) &&
    (!q || `${j.id} ${j.position} ${j.client} ${j.location}`.toLowerCase().includes(q.toLowerCase())))

  return (
    <Panel title="Requirements" sub={jobs ? `${fmt(jobs.length)} requirements · ${fmt(positions.total)} positions · ${fmt(positions.open)} open now · status as of ${meta.asOf}` : 'Loading requirements…'}
      actions={<label className="search"><Icon name="search" size={14} />
        <input type="search" id="job-search" placeholder="Search job, client, location" aria-label="Search jobs" value={q} onChange={e => setQ(e.target.value)} /></label>}>
      <div className="presets" role="group" aria-label="Status">
        {STATUSES.map(s => (
          <button type="button" key={s || 'all'} className="chip" aria-pressed={status === s} onClick={() => setStatus(s)}>
            {s || 'All'} <span className="mono muted">{s ? counts[s] ?? 0 : jobs?.length ?? 0}</span>
          </button>
        ))}
      </div>
      {error && <div className="empty">Couldn't load jobs: {error}</div>}
      <div className="tscroll"><table>
        <thead><tr><th>Job</th><th>Position</th><th>Client</th><th>Location</th><th>Owner</th><th>Opened</th><th className="r">Openings</th><th className="r">Hires</th><th className="r">Open</th><th>Status</th></tr></thead>
        <tbody>
          {rows.slice(0, 100).map(j => (
            <tr key={j.id}>
              <td className="mono">{j.id}</td><td>{j.position}</td><td>{j.client}</td><td>{j.location}</td><td>{owner(j.owner)}</td>
              <td className="num">{j.opened ?? '—'}</td><td className="num r">{j.openings}</td><td className="num r">{j.hires}</td>
              <td className="num r">{LIVE_STATUSES.includes(j.status) ? Math.max(0, j.openings - j.hires) : '—'}</td>
              <td><span className={`pill ${TONE[j.status] ?? ''}`}>{j.status}</span></td>
            </tr>
          ))}
          {jobs && rows.length === 0 && <tr><td colSpan={10} className="empty">No requisitions match.</td></tr>}
        </tbody>
      </table></div>
      {rows.length > 100 && <div className="panel-sub">Showing the 100 most recently opened of {fmt(rows.length)}.</div>}
    </Panel>
  )
}
