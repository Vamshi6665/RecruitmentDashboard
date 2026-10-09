import { useEffect, useState } from 'react'
import { Drawer } from './Drawer.jsx'

const KEY_EVENTS = new Set(['Sourced', 'Submitted', 'Interview', 'Offer', 'Hired', 'Rejected', 'Withdrawn'])
export const STAGE_TONE = { Hired: 'good', Rejected: 'bad', Withdrawn: 'warn', Offer: 'info', Interview: 'info', Submitted: 'info' }

/** One candidate's dated actions: outreach attempts, screening, interview rounds, outcome. */
export function TimelineDrawer({ client, app, onClose }) {
  const [events, setEvents] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    let live = true
    client.timeline(app.id).then(e => live && setEvents(e)).catch(e => live && setError(e.message))
    return () => { live = false }
  }, [client, app.id])

  return (
    <Drawer title={app.candidate} eyebrow={app.id} onClose={onClose}>
      <dl className="facts">
        <dt>Position</dt><dd>{app.position}</dd>
        <dt>Client</dt><dd>{app.client}</dd>
        <dt>Recruiter</dt><dd>{app.recruiter}</dd>
        <dt>Source</dt><dd>{app.source}</dd>
        <dt>Stage now</dt><dd><span className={`pill ${STAGE_TONE[app.stage] ?? ''}`}>{app.stage}</span></dd>
        <dt>Activity</dt><dd>{app.outreachAttempts} outreach attempts · {app.interviewRounds} interview rounds</dd>
      </dl>
      <h4 className="drawer-sub">History</h4>
      {error && <div className="empty">Couldn't load history: {error}</div>}
      {!events && !error && <div className="empty">Loading history…</div>}
      {events && (
        <ol className="tl">
          {events.map((e, i) => (
            <li key={i}>
              <span className="when">{e.date}</span>
              <span className="node"><i className={KEY_EVENTS.has(e.type) ? 'key' : ''} /></span>
              <span className="what">{e.type}{e.channel ? ` · ${e.channel}` : ''}
                {e.outcome && e.outcome !== 'Completed' && <small>{e.outcome}</small>}</span>
            </li>
          ))}
        </ol>
      )}
    </Drawer>
  )
}
