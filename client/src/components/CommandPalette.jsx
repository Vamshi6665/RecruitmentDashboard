import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon.jsx'

/** Keyboard command menu (⌘K / Ctrl+K): pages, quick ranges, recruiters, settings. */
export function CommandPalette({ commands, onClose }) {
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const input = useRef(null)
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return t ? commands.filter(c => `${c.group} ${c.label}`.toLowerCase().includes(t)) : commands
  }, [q, commands])
  useEffect(() => { input.current?.focus() }, [])
  useEffect(() => { setIdx(0) }, [q])

  const run = c => { onClose(); c.run() }
  const onKey = e => {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(list.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(0, i - 1)) }
    else if (e.key === 'Enter' && list[idx]) run(list[idx])
  }

  return createPortal(
    <>
      <div className="scrim" onClick={onClose} />
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command menu" onKeyDown={onKey}>
        <div className="palette-input"><Icon name="search" />
          <input ref={input} id="palette-q" placeholder="Go to a page, filter a recruiter, change range…" value={q}
            onChange={e => setQ(e.target.value)} aria-controls="palette-list" aria-activedescendant={list[idx] ? `cmd-${idx}` : undefined} />
        </div>
        <ul className="palette-list" id="palette-list" role="listbox">
          {list.map((c, i) => (
            <li key={c.id} id={`cmd-${i}`} role="option" aria-selected={i === idx}
              onMouseEnter={() => setIdx(i)} onClick={() => run(c)}>
              <Icon name={c.icon} /><span>{c.label}</span><small>{c.group}</small>
            </li>
          ))}
          {list.length === 0 && <li className="palette-empty">No matches</li>}
        </ul>
      </div>
    </>,
    document.body,
  )
}
