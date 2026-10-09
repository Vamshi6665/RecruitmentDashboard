/** Card shell used by every report visual. */
export function Panel({ title, sub, actions, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-head">
        <div><h2>{title}</h2>{sub && <div className="panel-sub">{sub}</div>}</div>
        {actions}
      </div>
      {children}
    </section>
  )
}

/** Chart / Table toggle: every chart has a table view for exact values and accessibility. */
export function ViewSwitch({ view, onChange }) {
  return (
    <div className="seg" role="group" aria-label="View as">
      <button type="button" aria-pressed={view === 'chart'} onClick={() => onChange('chart')}>Chart</button>
      <button type="button" aria-pressed={view === 'table'} onClick={() => onChange('table')}>Table</button>
    </div>
  )
}

export function Legend({ items }) {
  return (
    <div className="legend">
      {items.map(i => <span key={i.label}><span className="sw" style={{ background: i.color }} />{i.label}</span>)}
    </div>
  )
}
