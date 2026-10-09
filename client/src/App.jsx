// Root: holds all state, connects to the data, wires the sidebar, filters, pages and drawers together.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { connect } from './lib/api.js'
import { defaultFilters, presets } from './lib/format.js'
import { useLocalState } from './hooks/useLocalState.js'
import { Sidebar } from './components/Sidebar.jsx'
import { FilterBar } from './components/FilterBar.jsx'
import { SettingsDrawer } from './components/SettingsDrawer.jsx'
import { CommandPalette } from './components/CommandPalette.jsx'
import { OverviewPage } from './pages/OverviewPage.jsx'
import { RecruiterAnalysisPage } from './pages/RecruiterAnalysisPage.jsx'
import { JobsPage } from './pages/JobsPage.jsx'
import { RecruitersPage } from './pages/RecruitersPage.jsx'

const ROUTES = {
  overview: { title: 'Recruitment Overview', group: 'Reports', report: true },
  'recruiter-analysis': { title: 'Recruiter Analysis', group: 'Reports', report: true },
  jobs: { title: 'Jobs', group: 'Workspace' },
  recruiters: { title: 'Recruiters', group: 'Workspace' },
}
const readRoute = () => (ROUTES[location.hash.slice(1)] ? location.hash.slice(1) : 'overview')
const go = route => { location.hash = route }

const DEFAULT_SETTINGS = {
  mode: import.meta.env.VITE_DATA_MODE ?? 'auto',
  apiBase: import.meta.env.VITE_API_BASE ?? '',
  theme: 'system',
}

const validFilters = (f, m) => f && f.from >= m.minDate && f.to <= m.maxDate && f.from <= f.to &&
  (!f.recruiter || m.recruiters.some(r => r.id === f.recruiter)) &&
  (!f.position || m.positions.includes(f.position)) && (!f.client || m.clients.includes(f.client))

export default function App() {
  const [settings, setSettings] = useLocalState('settings', DEFAULT_SETTINGS)
  const [savedFilters, setSavedFilters] = useLocalState('filters', null)
  const [client, setClient] = useState(null)
  const [meta, setMeta] = useState(null)
  const [filters, setFilters] = useState(null)
  const [report, setReport] = useState(null)
  const [allTime, setAllTime] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [route, setRoute] = useState(readRoute)
  const [drawer, setDrawer] = useState(null) // 'settings' | 'palette' | null

  // routing
  useEffect(() => {
    const onHash = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // theme
  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'system') delete root.dataset.theme
    else root.dataset.theme = settings.theme
  }, [settings.theme])

  // ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setDrawer(d => (d === 'palette' ? null : 'palette')) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // connect (again whenever the data settings change)
  useEffect(() => {
    let live = true
    setClient(null); setMeta(null); setReport(null); setAllTime(null); setError(null)
    connect({ mode: settings.mode, apiBase: settings.apiBase })
      .then(async c => {
        const m = await c.meta()
        if (!live) return
        setClient(c); setMeta(m)
        setFilters(f => (validFilters(f, m) ? f : validFilters(savedFilters, m) ? savedFilters : defaultFilters(m)))
      })
      .catch(e => live && setError(e.message))
    return () => { live = false }
    // savedFilters is read once per connection on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.mode, settings.apiBase])

  // report for the current filters
  useEffect(() => {
    if (!client || !filters) return
    let live = true
    setBusy(true)
    setSavedFilters(filters)
    client.report(filters)
      .then(r => { if (live) { setReport(r); setError(null) } })
      .catch(e => live && setError(e.message))
      .finally(() => live && setBusy(false))
    return () => { live = false }
  }, [client, filters, setSavedFilters])

  useEffect(() => {
    if (route === 'recruiters' && client && meta && !allTime) client.report(defaultFilters(meta)).then(setAllTime).catch(() => {})
  }, [route, client, meta, allTime])

  const openRecruiter = useCallback(id => { setFilters(f => ({ ...f, recruiter: id })); go('recruiter-analysis') }, [])
  const closeDrawer = useCallback(() => setDrawer(null), [])

  const commands = useMemo(() => {
    const list = Object.entries(ROUTES).map(([id, r]) => ({ id: `go-${id}`, group: 'Go to', label: r.title, icon: 'arrow', run: () => go(id) }))
    if (meta) {
      presets(meta).forEach(p => list.push({ id: `range-${p.id}`, group: 'Date range', label: p.label, icon: 'calendar',
        run: () => { setFilters(f => ({ ...f, from: p.from, to: p.to })); if (!ROUTES[route].report) go('overview') } }))
      meta.recruiters.forEach(r => list.push({ id: `rec-${r.id}`, group: 'Recruiter', label: `Analyze ${r.name}`, icon: 'user', run: () => openRecruiter(r.id) }))
      list.push({ id: 'reset', group: 'Filters', label: 'Reset filters', icon: 'reset', run: () => setFilters(defaultFilters(meta)) })
    }
    list.push({ id: 'settings', group: 'Settings', label: 'Data source and theme', icon: 'settings', run: () => setTimeout(() => setDrawer('settings'), 0) })
    list.push({ id: 'theme', group: 'Settings', label: `Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} theme`, icon: settings.theme === 'dark' ? 'sun' : 'moon',
      run: () => setSettings(s => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' })) })
    return list
  }, [meta, route, settings.theme, openRecruiter, setSettings])

  const page = ROUTES[route]
  return (
    <div className="shell">
      <Sidebar route={route} connection={client?.connection} asOf={meta?.maxDate}
        onOpenSettings={() => setDrawer('settings')} onOpenPalette={() => setDrawer('palette')} />

      <main className="main">
        <header className="head">
          <div><div className="eyebrow">{page.group}</div><h1>{page.title}</h1></div>
          {page.report && (
            <nav className="tabs" aria-label="Report pages">
              <a href="#overview" aria-current={route === 'overview' ? 'page' : undefined}>Recruitment Overview</a>
              <a href="#recruiter-analysis" aria-current={route === 'recruiter-analysis' ? 'page' : undefined}>Recruiter Analysis</a>
            </nav>
          )}
        </header>

        {error && (
          <div className="banner" role="alert">
            <b>Couldn't load data.</b> {error}
            <button type="button" className="btn ghost" onClick={() => setDrawer('settings')}>Open settings</button>
          </div>
        )}
        {!meta && !error && <div className="empty">Connecting to recruiting data…</div>}

        {meta && filters && page.report && <FilterBar meta={meta} filters={filters} onChange={setFilters} />}
        {meta && report && client && page.report && (
          <div className={busy ? 'stack loading' : 'stack'}>
            {route === 'overview' && <OverviewPage report={report} meta={meta} onPickRecruiter={openRecruiter} />}
            {route === 'recruiter-analysis' && <RecruiterAnalysisPage report={report} meta={meta} client={client} filters={filters} />}
          </div>
        )}
        {meta && client && route === 'jobs' && <JobsPage client={client} meta={meta} />}
        {meta && route === 'recruiters' && <RecruitersPage meta={meta} allTime={allTime} onOpen={openRecruiter} />}
      </main>

      {drawer === 'settings' && <SettingsDrawer settings={settings} onSave={setSettings} connection={client?.connection} onClose={closeDrawer} />}
      {drawer === 'palette' && <CommandPalette commands={commands} onClose={closeDrawer} />}
    </div>
  )
}
