import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { createReports } from '../src/services/reports.js'

const app = createApp({ reports: createReports({ mode: 'json' }) })

describe('GET /api/health', () => {
  it('reports the active source', async () => {
    const res = await request(app).get('/api/health').expect(200)
    expect(res.body).toMatchObject({ status: 'ok', source: 'json' })
  })
  it('sets security headers', async () => {
    const res = await request(app).get('/api/health')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['content-security-policy']).toContain("default-src 'self'")
  })
})

describe('GET /api/meta', () => {
  it('lists dimensions and date bounds', async () => {
    const { body } = await request(app).get('/api/meta').expect(200)
    expect(body.recruiters).toHaveLength(10)
    expect(body.positions).toHaveLength(10)
    expect(body.clients).toHaveLength(8)
    expect(body).toMatchObject({ minDate: '2024-01-01', maxDate: '2026-10-05' })
  })
})

describe('GET /api/report', () => {
  it('matches the dataset validation totals for all dates', async () => {
    const { body } = await request(app).get('/api/report').expect(200)
    expect(body.kpis).toEqual({
      reached: 16730, screened: 12929, submissions: 9622, interviewed: 5456,
      offers: 2277, hires: 1892, newRequirements: 340, outreachAttempts: 41086,
    })
  })

  it('splits all positions into filled, cancelled and still open', async () => {
    const { body } = await request(app).get('/api/report').expect(200)
    expect(body.positions).toMatchObject({
      requirements: 340, liveRequirements: 32, openings: 2598, filled: 1892, cancelled: 524, openNow: 182, onHold: 43,
    })
    const p = body.positions
    expect(p.filled + p.cancelled + p.openNow).toBe(p.openings)
  })

  it('filters positions by job open date and owner', async () => {
    const { body } = await request(app).get('/api/report?from=2025-01-01&to=2025-12-31').expect(200)
    expect(body.positions).toMatchObject({ requirements: 120, openings: 905 })
    const { body: r } = await request(app).get('/api/report?recruiter=R05').expect(200)
    expect(r.positions.requirements).toBe(34)
  })

  it('matches the Power BI recruiter row for Alex', async () => {
    const { body } = await request(app).get('/api/report').expect(200)
    expect(body.recruiters.find(r => r.name === 'Alex')).toMatchObject({ reached: 1658, submissions: 976, interviewed: 598, hires: 205 })
    expect(body.hiresByPosition[0]).toEqual({ position: 'QA Engineer', hires: 207 })
  })

  it('matches the 2025 yearly totals', async () => {
    const { body } = await request(app).get('/api/report?from=2025-01-01&to=2025-12-31').expect(200)
    expect(body.kpis.submissions).toBe(3517)
    expect(body.kpis.hires).toBe(685)
    expect(body.monthly).toHaveLength(12)
    expect(body.monthly.reduce((s, m) => s + m.hires, 0)).toBe(685)
  })

  it('applies recruiter, position and client filters together', async () => {
    const { body } = await request(app).get('/api/report?recruiter=R05&position=QA%20Engineer&from=2025-01-01&to=2025-12-31').expect(200)
    expect(body.recruiters.map(r => r.id)).toEqual(['R05'])
    expect(body.hiresByPosition.every(p => p.position === 'QA Engineer')).toBe(true)
  })

  it.each([
    ['from=2026-02-01&to=2026-01-01', 'invalid_request'],
    ['from=01-01-2026', 'invalid_request'],
    ['recruiter=R99', 'bad_request'],
    ['position=Astronaut', 'bad_request'],
    ['client=Nobody', 'bad_request'],
  ])('rejects %s', async (query, code) => {
    const res = await request(app).get(`/api/report?${query}`).expect(400)
    expect(res.body.error.code).toBe(code)
  })
})

describe('GET /api/applications', () => {
  it('pages and counts applications active in the range', async () => {
    const { body } = await request(app).get('/api/applications?pageSize=10').expect(200)
    expect(body.total).toBe(20000)
    expect(body.rows).toHaveLength(10)
    expect(body.rows[0].lastActivity >= body.rows[9].lastActivity).toBe(true)
  })
  it('searches by application id', async () => {
    const { body } = await request(app).get('/api/applications?q=A000004').expect(200)
    expect(body.rows.map(r => r.id)).toContain('A000004')
  })
  it('limits page size', async () => {
    await request(app).get('/api/applications?pageSize=500').expect(400)
  })
})

describe('other routes', () => {
  it('returns one candidate history in date order', async () => {
    const { body } = await request(app).get('/api/applications/A000004/events').expect(200)
    expect(body[0].type).toBe('Sourced')
    expect(body.at(-1)).toMatchObject({ type: 'Rejected', outcome: 'Skills mismatch' })
  })
  it('rejects malformed ids', async () => {
    await request(app).get('/api/applications/bad%20id!/events').expect(400)
  })
  it('lists 340 jobs', async () => {
    const { body } = await request(app).get('/api/jobs').expect(200)
    expect(body).toHaveLength(340)
  })
  it('returns uniform 404s', async () => {
    const { body } = await request(app).get('/api/nope').expect(404)
    expect(body.error).toEqual({ code: 'not_found', message: 'No route for GET /api/nope' })
  })
})
