// Picks the data source lazily (so it also works in a serverless cold start) and wraps it with
// filter normalization and checks against the known recruiters/positions/clients.
// In auto mode a JSON fallback is temporary: Athena is tried again after ATHENA_RETRY_MINUTES,
// so fixing AWS (views, permissions) takes effect without a redeploy.
import { config } from '../config.js'
import { badRequest } from '../middleware/errors.js'
import { createCache } from './cache.js'
import { createAthenaRunner } from './athena.js'
import { createAthenaSource } from '../sources/athenaSource.js'
import { createJsonSource } from '../sources/jsonSource.js'

export const cache = createCache(config.cache)

export function createReports({ mode = config.dataSource, athenaFactory, jsonFactory, retryMs = config.athena.retryMs, now = () => Date.now() } = {}) {
  const makeJson = jsonFactory ?? (() => createJsonSource(config.jsonDataDir))
  const makeAthena = athenaFactory ?? (() => createAthenaSource(createAthenaRunner(config.athena, cache), config.athena))
  let chosen = null
  let fellBackAt = null
  let json = null
  const status = { source: null, note: '', fallbackReason: null }

  const source = () => {
    if (chosen && status.source === 'json' && mode === 'auto' && fellBackAt !== null && now() - fellBackAt > retryMs) chosen = null
    return (chosen ??= pick())
  }
  const pick = async () => {
    if (mode === 'json') {
      Object.assign(status, { source: 'json', note: 'DATA_SOURCE=json' })
      return (json ??= makeJson())
    }
    const athena = makeAthena()
    try {
      await athena.probe()
      Object.assign(status, { source: 'athena', note: `Amazon Athena · ${config.athena.database} · ${config.athena.region}`, fallbackReason: null })
      fellBackAt = null
      return athena
    } catch (e) {
      if (mode === 'athena') { chosen = null; throw Object.assign(e, { status: 503, code: e.code ?? 'athena_unavailable' }) }
      console.warn('[reports] Athena unavailable, using exported JSON:', e.message)
      Object.assign(status, { source: 'json', note: 'Athena unavailable; serving exported JSON', fallbackReason: e.message })
      fellBackAt = now()
      return (json ??= makeJson())
    }
  }

  /** Fill default dates and verify dimension values exist. */
  async function normalize(input) {
    const s = await source()
    const m = await s.meta()
    const f = {
      from: input.from ?? m.minDate, to: input.to ?? m.maxDate,
      recruiter: input.recruiter ?? '', position: input.position ?? '', client: input.client ?? '',
    }
    if (f.from > f.to) throw badRequest('from must be on or before to')
    if (f.recruiter && !m.recruiters.some(r => r.id === f.recruiter)) throw badRequest(`Unknown recruiter "${f.recruiter}"`)
    if (f.position && !m.positions.includes(f.position)) throw badRequest(`Unknown position "${f.position}"`)
    if (f.client && !m.clients.includes(f.client)) throw badRequest(`Unknown client "${f.client}"`)
    return f
  }

  return {
    status: async () => { await source().catch(() => {}); return { ...status } },
    meta: async () => (await source()).meta(),
    report: async q => (await source()).report(await normalize(q)),
    applications: async q => (await source()).applications(await normalize(q), q.q ?? '', q.page ?? 1, q.pageSize ?? 25),
    timeline: async id => (await source()).timeline(id),
    jobs: async () => (await source()).jobs(),
  }
}
