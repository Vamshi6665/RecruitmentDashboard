import { describe, it, expect, vi, afterEach } from 'vitest'
import { connect } from '../src/lib/api.js'

afterEach(() => vi.unstubAllGlobals())
const json = (body, ok = true, status = 200) => Promise.resolve({ ok, status, statusText: 'x', json: () => Promise.resolve(body) })

describe('connect', () => {
  it('uses the API when /api/health answers', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json({ status: 'ok', source: 'athena', note: 'Athena' })))
    const c = await connect({ mode: 'auto' })
    expect(c.connection).toMatchObject({ kind: 'api', source: 'athena' })
  })

  it('falls back to exported JSON when the API is down', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    const c = await connect({ mode: 'auto' })
    expect(c.connection.kind).toBe('static')
  })

  it('falls back when the host answers with something that is not the API', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json(null)))
    expect((await connect()).connection.kind).toBe('static')
  })

  it('throws in API-only mode when the API is down', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    await expect(connect({ mode: 'api' })).rejects.toThrow(/API not reachable/)
  })

  it('skips the API in JSON mode', async () => {
    const f = vi.fn()
    vi.stubGlobal('fetch', f)
    const c = await connect({ mode: 'json' })
    expect(c.connection.kind).toBe('static')
    expect(f).not.toHaveBeenCalled()
  })

  it('sends filters as query parameters and surfaces API errors', async () => {
    const f = vi.fn()
      .mockImplementationOnce(() => json({ source: 'json', note: '' }))
      .mockImplementationOnce(() => json({ error: { code: 'bad_request', message: 'Unknown recruiter "R99"' } }, false, 400))
    vi.stubGlobal('fetch', f)
    const c = await connect({ apiBase: 'https://api.example.com/' })
    await expect(c.report({ from: '2025-01-01', to: '2025-12-31', recruiter: 'R99', position: '', client: '' })).rejects.toThrow('Unknown recruiter')
    expect(f.mock.calls[1][0]).toBe('https://api.example.com/api/report?from=2025-01-01&to=2025-12-31&recruiter=R99')
  })
})
