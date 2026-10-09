// Data client for the whole app.
//   mode 'auto' (default): try the API (/api/health). If it answers, every report comes from the API,
//                          which reads Athena or its own JSON fallback. If not, load the exported JSON
//                          from /data and compute the same reports in the browser.
//   mode 'api':  API only (shows an error if it is down).
//   mode 'json': exported JSON in the browser, no API calls.
// Mode and API URL come from Settings, then VITE_DATA_MODE / VITE_API_BASE.
import { computeReport, listApplications, metaFromBundle, positionsSummary, timeline } from '@hub/shared'

export class ApiError extends Error {
  constructor(message, status, code) { super(message); this.status = status; this.code = code }
}

async function getJson(url, { timeoutMs = 60000 } = {}) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } })
    const body = await res.json().catch(() => null)
    if (!res.ok) throw new ApiError(body?.error?.message ?? `${res.status} ${res.statusText}`, res.status, body?.error?.code)
    if (body == null) throw new ApiError('Response was not JSON', res.status, 'not_json')
    return body
  } catch (e) {
    if (e.name === 'AbortError') throw new ApiError('Request timed out', 0, 'timeout')
    throw e
  } finally {
    clearTimeout(t)
  }
}

const qs = obj => new URLSearchParams(Object.entries(obj).filter(([, v]) => v !== '' && v != null).map(([k, v]) => [k, String(v)])).toString()

export function createApiClient(base, health) {
  const b = base.replace(/\/$/, '')
  return {
    connection: { kind: 'api', source: health.source, note: health.note, fallbackReason: health.fallbackReason ?? null },
    meta: () => getJson(`${b}/api/meta`),
    report: f => getJson(`${b}/api/report?${qs(f)}`),
    applications: (f, q, page, pageSize) => getJson(`${b}/api/applications?${qs({ ...f, q, page, pageSize })}`),
    timeline: id => getJson(`${b}/api/applications/${encodeURIComponent(id)}/events`),
    jobs: () => getJson(`${b}/api/jobs`),
  }
}

export function createStaticClient(note, base = import.meta.env.BASE_URL ?? './') {
  let ev = null, ap = null, jb = null
  const events = () => (ev ??= getJson(`${base}data/events.json`))
  const apps = () => (ap ??= getJson(`${base}data/applications.json`))
  const jobs = () => (jb ??= getJson(`${base}data/jobs.json`))
  return {
    connection: { kind: 'static', source: 'json', note },
    meta: async () => metaFromBundle(await events()),
    report: async f => {
      const [e, j] = await Promise.all([events(), jobs().catch(() => null)])
      return { ...computeReport(e, f), positions: j ? positionsSummary(j, f) : null }
    },
    applications: async (f, q, page, size) => listApplications(await apps(), await events(), f, q, page, size),
    timeline: async id => timeline(await events(), id),
    jobs,
  }
}

export async function connect({ mode = 'auto', apiBase = '' } = {}) {
  if (mode === 'json') return createStaticClient('Exported JSON (set in Settings)')
  try {
    const health = await getJson(`${apiBase.replace(/\/$/, '')}/api/health`, { timeoutMs: 5000 })
    if (!health?.source) throw new ApiError('Not a Recruitment Hub API', 0, 'bad_api')
    return createApiClient(apiBase, health)
  } catch (e) {
    if (mode === 'api') throw new ApiError(`API not reachable: ${e.message}`, 0, 'api_unreachable')
    return createStaticClient('API not reachable; using exported JSON in the browser')
  }
}
