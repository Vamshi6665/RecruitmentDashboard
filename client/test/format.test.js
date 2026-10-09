import { describe, it, expect } from 'vitest'
import { fmt, monthName, pct, presets } from '../src/lib/format.js'
import { load, save } from '../src/lib/storage.js'

describe('format', () => {
  it('formats numbers, percents and months', () => {
    expect(fmt(16730)).toBe('16,730')
    expect(pct(1892, 9622)).toBe('19.7%')
    expect(pct(1, 0)).toBe('—')
    expect(monthName('2026-10')).toBe('Oct 2026')
  })

  it('anchors presets to the data date, not today', () => {
    const p = presets({ minDate: '2024-01-01', maxDate: '2026-10-05' })
    expect(p.find(x => x.id === 'l3')).toMatchObject({ from: '2026-07-06', to: '2026-10-05' })
    expect(p.find(x => x.id === 'ytd')).toMatchObject({ from: '2026-01-01' })
  })
})

describe('storage', () => {
  it('round-trips values and survives broken storage', () => {
    save('t', { a: 1 })
    expect(load('t')).toEqual({ a: 1 })
    window.localStorage.setItem('hub:bad', '{not json')
    expect(load('bad', 'fallback')).toBe('fallback')
  })
})
