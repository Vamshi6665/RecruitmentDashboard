import { defaultFilters, presets } from '../lib/format.js'
import { Icon } from './Icon.jsx'

/** Date range, quick ranges, year, recruiter, position and client: one row above the report. */
export function FilterBar({ meta, filters: f, onChange }) {
  const set = patch => onChange({ ...f, ...patch })
  const ps = presets(meta)
  const active = ps.find(p => p.from === f.from && p.to === f.to)?.id
  const firstYear = +meta.minDate.slice(0, 4), lastYear = +meta.maxDate.slice(0, 4)
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => String(firstYear + i))
  const yearEnd = y => (`${y}-12-31` < meta.maxDate ? `${y}-12-31` : meta.maxDate)
  const year = years.find(y => f.from === `${y}-01-01` && f.to === yearEnd(y)) ?? ''
  const recruiter = meta.recruiters.find(r => r.id === f.recruiter)

  return (
    <section className="filters" aria-label="Report filters">
      <div className="f">
        <span className="lbl" id="lbl-range">Date range</span>
        <div className="range" role="group" aria-labelledby="lbl-range">
          <input id="f-from" type="date" aria-label="From date" value={f.from} min={meta.minDate} max={f.to}
            onChange={e => e.target.value && set({ from: e.target.value })} />
          <span aria-hidden="true">–</span>
          <input id="f-to" type="date" aria-label="To date" value={f.to} min={f.from} max={meta.maxDate}
            onChange={e => e.target.value && set({ to: e.target.value })} />
        </div>
      </div>
      <div className="presets" role="group" aria-label="Quick ranges">
        {ps.map(p => <button key={p.id} type="button" className="chip" aria-pressed={active === p.id} onClick={() => set({ from: p.from, to: p.to })}>{p.label}</button>)}
      </div>
      <div className="f">
        <label htmlFor="f-year">Year</label>
        <select id="f-year" className="narrow" value={year}
          onChange={e => (e.target.value ? set({ from: `${e.target.value}-01-01`, to: yearEnd(e.target.value) }) : set({ from: meta.minDate, to: meta.maxDate }))}>
          <option value="">All</option>
          {years.map(y => <option key={y} value={y}>{y}{meta.maxDate.startsWith(y) ? ' YTD' : ''}</option>)}
        </select>
      </div>
      <div className="f">
        <label htmlFor="f-recruiter">Recruiter</label>
        <select id="f-recruiter" value={f.recruiter} onChange={e => set({ recruiter: e.target.value })}>
          <option value="">All recruiters</option>
          {meta.recruiters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>
      <div className="f">
        <label htmlFor="f-position">Position</label>
        <select id="f-position" value={f.position} onChange={e => set({ position: e.target.value })}>
          <option value="">All positions</option>
          {meta.positions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="f">
        <label htmlFor="f-client">Client</label>
        <select id="f-client" value={f.client} onChange={e => set({ client: e.target.value })}>
          <option value="">All clients</option>
          {meta.clients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <button type="button" className="reset" onClick={() => onChange(defaultFilters(meta))}><Icon name="reset" size={14} />Reset</button>
      <div className="summary-line">
        <b>{f.from}</b> to <b>{f.to}</b> · {recruiter ? recruiter.name : 'all recruiters'} · {f.position || 'all positions'} · {f.client || 'all clients'}
      </div>
    </section>
  )
}
