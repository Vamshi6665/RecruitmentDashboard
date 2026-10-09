import { useState } from 'react'
import { Drawer } from './Drawer.jsx'
import { connectionLabel } from './Sidebar.jsx'

const MODES = [
  { id: 'auto', label: 'Auto', hint: 'Use the API (Athena) when it answers, otherwise the exported JSON.' },
  { id: 'api', label: 'API only', hint: 'Always use the API. Shows an error if it is down.' },
  { id: 'json', label: 'Exported JSON', hint: 'Skip the API and compute reports in the browser.' },
]
const THEMES = [{ id: 'system', label: 'System' }, { id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }]

/** Data connection and appearance. Saved in this browser only. */
export function SettingsDrawer({ settings, onSave, connection, onClose }) {
  const [draft, setDraft] = useState(settings)
  const c = connectionLabel(connection)
  const set = patch => setDraft(d => ({ ...d, ...patch }))
  return (
    <Drawer title="Settings" eyebrow="This browser" onClose={onClose}>
      <section className="settings-block">
        <h4 className="drawer-sub">Connection</h4>
        <div className="status-card">
          <span className={`dot ${c.tone}`} />
          <div><b>{c.text}</b><small>{connection?.note}</small>
            {connection?.fallbackReason && <small className="warn-text">Athena error: {connection.fallbackReason}</small>}</div>
        </div>
      </section>
      <section className="settings-block">
        <h4 className="drawer-sub">Data source</h4>
        <div className="radio-list" role="radiogroup" aria-label="Data source">
          {MODES.map(m => (
            <label key={m.id} className="radio">
              <input type="radio" name="mode" value={m.id} checked={draft.mode === m.id} onChange={() => set({ mode: m.id })} />
              <span><b>{m.label}</b><small>{m.hint}</small></span>
            </label>
          ))}
        </div>
        <label className="field" htmlFor="api-base">
          <span>API URL <small>(leave blank when the site and API share a host)</small></span>
          <input id="api-base" type="url" placeholder="https://recruiting-api.example.com" value={draft.apiBase}
            onChange={e => set({ apiBase: e.target.value.trim() })} />
        </label>
      </section>
      <section className="settings-block">
        <h4 className="drawer-sub">Theme</h4>
        <div className="seg wide" role="group" aria-label="Theme">
          {THEMES.map(t => <button type="button" key={t.id} aria-pressed={draft.theme === t.id} onClick={() => set({ theme: t.id })}>{t.label}</button>)}
        </div>
      </section>
      <div className="drawer-actions">
        <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
        <button type="button" className="btn primary" onClick={() => { onSave(draft); onClose() }}>Save and reconnect</button>
      </div>
    </Drawer>
  )
}
