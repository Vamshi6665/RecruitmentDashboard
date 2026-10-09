import { useCallback, useEffect, useState } from 'react'
import { Panel } from './Panel.jsx'
import { Icon } from './Icon.jsx'
import { STAGE_TONE, TimelineDrawer } from './TimelineDrawer.jsx'
import { fmt } from '../lib/format.js'

const PAGE_SIZE = 15
const d = v => v ?? <span className="dash-cell">—</span>

/** Application-level table (like the Power BI detail table) with search, paging and history drawer. */
export function ApplicationsPanel({ client, filters }) {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(null)
  const close = useCallback(() => setOpen(null), [])

  useEffect(() => { setPage(1) }, [filters, q])
  useEffect(() => {
    let live = true
    const t = setTimeout(() => {
      client.applications(filters, q, page, PAGE_SIZE)
        .then(p => { if (live) { setData(p); setError(null) } })
        .catch(e => live && setError(e.message))
    }, q ? 250 : 0)
    return () => { live = false; clearTimeout(t) }
  }, [client, filters, q, page])

  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
  return (
    <Panel className="span-12" title="Application Detail"
      sub="Applications active in the range: sourced by the end date, last activity on or after the start. Select a row for its full history."
      actions={<label className="search"><Icon name="search" size={14} />
        <input type="search" id="app-search" placeholder="Search ID or candidate" aria-label="Search applications" value={q} onChange={e => setQ(e.target.value)} /></label>}>
      {error && <div className="empty">Couldn't load applications: {error}</div>}
      {!data && !error && <div className="empty">Loading applications…</div>}
      {data && (
        <>
          <div className="tscroll"><table>
            <thead><tr>
              <th>Application</th><th>Recruiter</th><th>Position</th><th>Client</th><th>Stage</th>
              <th>Contacted</th><th>Screened</th><th>Submitted</th><th>Interview</th><th>Hired</th><th>Rejected</th><th>Rejection reason</th>
            </tr></thead>
            <tbody>
              {data.rows.map(a => (
                <tr key={a.id} className="clickable" tabIndex={0} onClick={() => setOpen(a)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(a) } }}>
                  <td><div className="who"><span className="mono">{a.id}</span><small>{a.candidate}</small></div></td>
                  <td>{a.recruiter}</td><td>{a.position}</td><td>{a.client}</td>
                  <td><span className={`pill ${STAGE_TONE[a.stage] ?? ''}`}>{a.stage}</span></td>
                  <td className="num">{d(a.contacted)}</td><td className="num">{d(a.screened)}</td><td className="num">{d(a.submitted)}</td>
                  <td className="num">{d(a.interview)}</td><td className="num">{d(a.hired)}</td><td className="num">{d(a.rejected)}</td>
                  <td>{d(a.rejectionReason)}</td>
                </tr>
              ))}
              {data.rows.length === 0 && <tr><td colSpan={12} className="empty">No applications match.</td></tr>}
            </tbody>
          </table></div>
          <div className="pager">
            <span>{fmt(data.total)} applications · page {fmt(page)} of {fmt(pages)}</span>
            <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <button type="button" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </>
      )}
      {open && <TimelineDrawer client={client} app={open} onClose={close} />}
    </Panel>
  )
}
