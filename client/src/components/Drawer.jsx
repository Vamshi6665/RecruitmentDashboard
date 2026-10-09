import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon.jsx'

/** Shared right-hand drawer shell: scrim, Escape to close, focus on open, portal to <body>. */
export function Drawer({ title, eyebrow, onClose, children, width = 420 }) {
  const ref = useRef(null)
  useEffect(() => {
    const prev = document.activeElement
    ref.current?.focus()
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); prev?.focus?.() }
  }, [onClose])
  return createPortal(
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} style={{ width: `min(${width}px, 100%)` }}>
        <header className="drawer-head">
          <div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h3>{title}</h3></div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </header>
        {children}
      </aside>
    </>,
    document.body,
  )
}
