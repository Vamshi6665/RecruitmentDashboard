import { useEffect, useRef, useState } from 'react'

/** Width of the chart container; charts draw in pixel units so text stays crisp. */
export function useWidth(min = 280) {
  const ref = useRef(null)
  const [w, setW] = useState(640)
  useEffect(() => {
    if (!ref.current || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setW(Math.max(min, Math.round(e.contentRect.width))))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [min])
  return [ref, w]
}

export function niceMax(v) {
  if (v <= 0) return 4
  const p = 10 ** Math.floor(Math.log10(v))
  return [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(s => s * p >= v) * p
}

/** Round axis bounds and a step that covers [lo, hi] in about four intervals. */
export function niceRange(lo, hi) {
  const raw = Math.max(1, (hi - lo) / 4, hi * 0.04)
  const p = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].find(s => s * p >= raw) * p
  const a = Math.max(0, Math.floor(lo / step) * step)
  const b = Math.ceil(hi / step) * step
  return [a, b === a ? a + step : b, step]
}

/** Horizontal bar with a rounded data end and a square baseline end. */
export function hbarPath(x, y, w, h, r = 4) {
  if (w <= 0) return ''
  r = Math.min(r, h / 2, w)
  return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`
}

/** Tooltip kept inside the chart horizontally. */
export function Tip({ x, y, width, children }) {
  const left = Math.min(Math.max(x, 90), width - 90)
  return <div className="tip" style={{ left, top: y, transform: 'translate(-50%, calc(-100% - 10px))' }}>{children}</div>
}
