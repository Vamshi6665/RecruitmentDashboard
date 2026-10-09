import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { computeReport, listApplications, monthsBetween, positionsFromStatusRows, positionsSummary } from '@hub/shared'

const dir = new URL('../../client/public/data/', import.meta.url)
const ev = JSON.parse(readFileSync(new URL('events.json', dir), 'utf8'))
const ap = JSON.parse(readFileSync(new URL('applications.json', dir), 'utf8'))
const jobs = JSON.parse(readFileSync(new URL('jobs.json', dir), 'utf8'))
const all = { from: '2024-01-01', to: '2026-10-05', recruiter: '', position: '', client: '' }

describe('shared metrics', () => {
  it('lists months across a year boundary', () => {
    expect(monthsBetween('2025-11-15', '2026-02-01')).toEqual(['2025-11', '2025-12', '2026-01', '2026-02'])
  })

  it('returns the six stages in display order', () => {
    const r = computeReport(ev, all)
    expect(r.stages.map(s => s.stage)).toEqual(['Reached', 'Screened', 'Submitted', 'Interviewed', 'Offered', 'Hired'])
  })

  it('recruiter rows add up to the totals', () => {
    const r = computeReport(ev, all)
    for (const k of ['reached', 'submissions', 'interviewed', 'hires']) {
      expect(r.recruiters.reduce((s, x) => s + x[k], 0)).toBe(r.kpis[k])
    }
  })

  it('positions: hires on Open/On Hold jobs leave the rest open, on closed jobs the rest is cancelled', () => {
    const p = positionsFromStatusRows([
      { status: 'Open', requirements: 2, openings: 10, hires: 3 },
      { status: 'On Hold', requirements: 1, openings: 4, hires: 1 },
      { status: 'Closed - Unfilled', requirements: 1, openings: 6, hires: 2 },
      { status: 'Filled', requirements: 1, openings: 5, hires: 5 },
    ])
    expect(p).toMatchObject({ requirements: 5, liveRequirements: 3, openings: 25, filled: 11, cancelled: 4, openNow: 10, onHold: 3 })
    expect(p.fillRate).toBeCloseTo(0.44)
  })

  it('positions are counted for requirements opened in the range', () => {
    expect(positionsSummary(jobs, { ...all, from: '2024-01-01', to: '2024-12-31' })).toMatchObject({ requirements: 130, openings: 1009 })
    expect(positionsSummary(jobs, { ...all, from: '2026-01-01', to: '2026-10-05' })).toMatchObject({ requirements: 90, openings: 684 })
    expect(positionsSummary(jobs, { ...all, from: '2030-01-01', to: '2030-12-31' }).openings).toBe(0)
  })

  it('counts outreach attempts, not applications', () => {
    const r = computeReport(ev, all)
    expect(r.kpis.outreachAttempts).toBeGreaterThan(r.kpis.reached)
  })

  it('selects applications active in the range', () => {
    const f = { ...all, from: '2026-10-05', to: '2026-10-05' }
    const p = listApplications(ap, ev, f, '', 1, 100)
    expect(p.total).toBeGreaterThan(0)
    expect(p.rows.every(r => r.sourced <= '2026-10-05' && r.lastActivity >= '2026-10-05')).toBe(true)
  })
})
