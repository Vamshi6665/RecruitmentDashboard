// Reports from Amazon Athena (views in athena/02_views.sql). Same output shape as jsonSource.
import { monthsBetween, positionsFromStatusRows, STAGES } from '@hub/shared'
import { SQL, appsCount, appsPage, appsParams, filterParams } from '../services/sql.js'

export function createAthenaSource(runner, { probeTimeoutMs } = {}) {
  let metaPromise = null
  const meta = (opts) => (metaPromise ??= (async () => {
    const [recs, dims] = await Promise.all([runner.run(SQL.recruiters, [], opts), runner.run(SQL.dims, [], opts)])
    const pick = k => dims.filter(d => d.kind === k).map(d => d.value).sort()
    const max = pick('max')[0]
    return {
      asOf: max, minDate: pick('min')[0], maxDate: max,
      recruiters: recs.map(r => ({ id: r.recruiter_id, name: r.recruiter, team: r.team ?? '', title: r.title ?? '', manager: r.manager ?? '' })),
      positions: pick('position'), clients: pick('client'), source: 'athena',
    }
  })().catch(e => { metaPromise = null; throw e }))

  async function report(f) {
    const p = filterParams(f)
    const [m, byRT, monthly, pos, positions] = await Promise.all([
      meta(), runner.run(SQL.byRecruiterType, p), runner.run(SQL.monthly, p), runner.run(SQL.hiresByPosition, p),
      // optional: if v_jobs lacks a column the rest of the report still loads and the panel hides
      runner.run(SQL.positions, p).then(positionsFromStatusRows, e => { console.warn('[athena] positions:', e.message); return null }),
    ])
    const info = new Map(m.recruiters.map(r => [r.id, r]))
    const total = (type, field = 'apps') => byRT.filter(r => r.event_type === type).reduce((s, r) => s + Number(r[field]), 0)
    const kpis = {
      reached: total('Contacted'), screened: total('Screened'), submissions: total('Submitted'),
      interviewed: total('Interview'), offers: total('Offer'), hires: total('Hired'),
      newRequirements: total('JobOpened', 'jobs'), outreachAttempts: total('Outreach', 'events'),
    }
    const FIELD = { Contacted: 'reached', Submitted: 'submissions', Interview: 'interviewed', Hired: 'hires' }
    const recs = new Map()
    for (const r of byRT) {
      const field = FIELD[r.event_type]
      if (!field) continue
      const id = r.recruiter_id
      const row = recs.get(id) ?? { id, name: info.get(id)?.name ?? id, team: info.get(id)?.team ?? '', reached: 0, submissions: 0, interviewed: 0, hires: 0 }
      row[field] = Number(r.apps)
      recs.set(id, row)
    }
    const months = monthsBetween(f.from, f.to).map(month => ({ month, submissions: 0, hires: 0 }))
    const mi = new Map(months.map((x, i) => [x.month, i]))
    for (const r of monthly) {
      const i = mi.get(r.month)
      if (i == null) continue
      months[i][r.event_type === 'Submitted' ? 'submissions' : 'hires'] = Number(r.apps)
    }
    return {
      filters: f, kpis, positions, monthly: months,
      hiresByPosition: pos.map(r => ({ position: r.position, hires: Number(r.hires) }))
        .sort((a, b) => b.hires - a.hires || a.position.localeCompare(b.position)),
      stages: STAGES.map(s => ({ stage: s.label, count: kpis[s.key] })),
      recruiters: [...recs.values()].sort((a, b) => b.hires - a.hires || a.name.localeCompare(b.name)),
    }
  }

  return {
    name: 'athena',
    /** Quick connectivity check used when choosing the source. */
    probe: () => meta({ deadlineMs: probeTimeoutMs }),
    meta,
    report,
    async applications(f, q, page, pageSize) {
      const params = appsParams(f, q)
      const [cnt, rows] = await Promise.all([runner.run(appsCount, params), runner.run(appsPage((page - 1) * pageSize, pageSize), params)])
      return {
        total: Number(cnt[0]?.total ?? 0), page, pageSize,
        rows: rows.map(r => ({
          id: r.application_id, candidate: r.candidate, recruiter: r.recruiter, position: r.position,
          client: r.client, source: r.source ?? '', stage: r.current_stage ?? '',
          sourced: r.sourced, contacted: r.contacted, screened: r.screened, submitted: r.submitted,
          interview: r.interview, offer: r.offer, hired: r.hired, rejected: r.rejected, withdrawn: r.withdrawn,
          lastActivity: r.last_activity, outreachAttempts: Number(r.outreach_attempts ?? 0),
          interviewRounds: Number(r.interview_rounds ?? 0), rejectionReason: r.rejection_reason,
        })),
      }
    },
    async timeline(id) {
      const rows = await runner.run(SQL.timeline, [id])
      return rows.map(r => ({ date: r.date, type: r.event_type, channel: r.channel, outcome: r.outcome }))
    },
    async jobs() {
      const rows = await runner.run(SQL.jobs)
      return rows.map(r => ({
        id: r.job_id, position: r.position, client: r.client, department: r.department ?? '',
        location: r.location ?? '', owner: r.owner_recruiter_id ?? '', opened: r.opened, closed: r.closed,
        openings: Number(r.openings ?? 0), hires: Number(r.hires ?? 0), status: r.status ?? '',
      }))
    },
  }
}
