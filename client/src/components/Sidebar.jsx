import { Icon } from './Icon.jsx'

export const NAV = [
  { group: 'Workspace', items: [
    { id: 'jobs', label: 'Jobs', icon: 'briefcase' },
    { id: 'recruiters', label: 'Recruiters', icon: 'people' },
  ] },
  { group: 'Reports', items: [
    { id: 'overview', label: 'Recruitment Overview', icon: 'chart' },
    { id: 'recruiter-analysis', label: 'Recruiter Analysis', icon: 'user' },
    { id: 'pipeline', label: 'Pipeline', icon: 'funnel', soon: true },
  ] },
]

export function connectionLabel(conn) {
  if (!conn) return { text: 'Connecting…', tone: 'idle' }
  if (conn.kind === 'api' && conn.source === 'athena') return { text: 'Live · Amazon Athena', tone: 'live' }
  if (conn.kind === 'api') return { text: 'API · exported JSON', tone: 'fallback' }
  return { text: 'Offline · exported JSON', tone: 'fallback' }
}

export function Sidebar({ route, connection, asOf, onOpenSettings, onOpenPalette }) {
  const c = connectionLabel(connection)
  return (
    <aside className="rail">
      <div className="brand">
        <span className="brand-mark"><Icon name="logo" /></span>
        <div>Recruitment Hub<small>Talent operations</small></div>
      </div>
      <button type="button" className="rail-search" onClick={onOpenPalette}>
        <Icon name="search" size={14} />Jump to…<kbd>⌘K</kbd>
      </button>
      <nav aria-label="Main">
        {NAV.map(g => (
          <div key={g.group}>
            <div className="rail-label">{g.group}</div>
            {g.items.map(i => i.soon
              ? <span key={i.id} className="rail-link disabled" aria-disabled="true"><Icon name={i.icon} />{i.label}<span className="next">Next</span></span>
              : <a key={i.id} className="rail-link" href={`#${i.id}`} aria-current={route === i.id ? 'page' : undefined}><Icon name={i.icon} />{i.label}</a>)}
          </div>
        ))}
      </nav>
      <div className="rail-foot">
        <button type="button" className="conn" onClick={onOpenSettings} title={connection?.note}>
          <span className={`dot ${c.tone}`} />
          <span><b>{c.text}</b>{asOf && <small>Data through {asOf}</small>}</span>
          <Icon name="settings" />
        </button>
      </div>
    </aside>
  )
}
