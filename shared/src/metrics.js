// Report logic for exported-JSON mode. The browser uses it when the API is unreachable and the
// server uses it when DATA_SOURCE=json. It mirrors the Athena SQL in server/src/services/sql.js
// and the Power BI DAX in data/DATASET_README.md. Change all three together.
//
// Shapes (see docs/API.md):
//   Filters  { from, to, recruiter, position, client }   dates YYYY-MM-DD inclusive; '' = all
//   Report   { filters, kpis, monthly, hiresByPosition, stages, recruiters }

const DAY = 86400000
export const toDay = (base, iso) => Math.round((Date.parse(iso) - Date.parse(base)) / DAY)
export const fromDay = (base, n) => new Date(Date.parse(base) + n * DAY).toISOString().slice(0, 10)
export const appIdToNum = id => Number(String(id).replace(/\D/g, ''))
export const appNumToId = n => 'A' + String(n).padStart(6, '0')
export const candidateName = n => 'Sample Candidate ' + String(n).padStart(6, '0')

export const STAGES = [
  { key: 'reached', type: 'Contacted', label: 'Reached' },
  { key: 'screened', type: 'Screened', label: 'Screened' },
  { key: 'submissions', type: 'Submitted', label: 'Submitted' },
  { key: 'interviewed', type: 'Interview', label: 'Interviewed' },
  { key: 'offers', type: 'Offer', label: 'Offered' },
  { key: 'hires', type: 'Hired', label: 'Hired' },
]

export function monthsBetween(from, to) {
  const out = []
  let [y, m] = from.slice(0, 7).split('-').map(Number)
  const [ty, tm] = to.slice(0, 7).split('-').map(Number)
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    if (++m > 12) { m = 1; y++ }
  }
  return out
}

export function metaFromBundle(ev) {
  let max = 0
  for (const x of ev.d) if (x > max) max = x
  return {
    asOf: ev.asOf, minDate: ev.base, maxDate: fromDay(ev.base, max),
    recruiters: ev.recruiters, positions: [...ev.positions].sort(), clients: [...ev.clients].sort(),
    source: 'json',
  }
}

/** Distinct applications per stage, outreach attempts and new requirements for one filter set. */
export function computeReport(ev, f) {
  const from = toDay(ev.base, f.from), to = toDay(ev.base, f.to)
  const rIdx = f.recruiter ? ev.recruiters.findIndex(x => x.id === f.recruiter) : -1
  const pIdx = f.position ? ev.positions.indexOf(f.position) : -1
  const cIdx = f.client ? ev.clients.indexOf(f.client) : -1
  const T = Object.fromEntries(ev.types.map((t, i) => [t, i]))

  let maxA = 0
  for (const a of ev.a) if (a > maxA) maxA = a
  const seen = STAGES.map(() => new Uint8Array(maxA + 1))
  const stageCount = STAGES.map(() => 0)
  const stageOf = new Int8Array(ev.types.length).fill(-1)
  STAGES.forEach((s, i) => { if (T[s.type] != null) stageOf[T[s.type]] = i })
  const S_REACH = 0, S_SUB = 2, S_INT = 3, S_HIRE = 5

  const jobsOpened = new Set()
  let outreach = 0
  const months = monthsBetween(f.from, f.to)
  const mIndex = new Map(months.map((m, i) => [m, i]))
  const monthly = months.map(month => ({ month, submissions: 0, hires: 0 }))
  const hiresByPos = new Map()
  const rec = new Map()
  const recRow = r => {
    let x = rec.get(r)
    if (!x) rec.set(r, (x = { reached: 0, submissions: 0, interviewed: 0, hires: 0 }))
    return x
  }

  for (let i = 0, n = ev.d.length; i < n; i++) {
    const d = ev.d[i]
    if (d < from || d > to) continue
    if (rIdx >= 0 && ev.r[i] !== rIdx) continue
    if (pIdx >= 0 && ev.p[i] !== pIdx) continue
    if (cIdx >= 0 && ev.c[i] !== cIdx) continue
    const t = ev.t[i]
    if (t === T.Outreach) { outreach++; continue }
    if (t === T.JobOpened) { jobsOpened.add(ev.k[i]); continue }
    const s = stageOf[t]
    if (s < 0) continue
    const a = ev.a[i]
    if (seen[s][a]) continue
    seen[s][a] = 1
    stageCount[s]++
    const row = recRow(ev.r[i])
    if (s === S_REACH) row.reached++
    else if (s === S_INT) row.interviewed++
    else if (s === S_SUB || s === S_HIRE) {
      const mi = mIndex.get(fromDay(ev.base, d).slice(0, 7))
      if (s === S_SUB) { row.submissions++; monthly[mi].submissions++ }
      else { row.hires++; monthly[mi].hires++; hiresByPos.set(ev.p[i], (hiresByPos.get(ev.p[i]) ?? 0) + 1) }
    }
  }

  const k = Object.fromEntries(STAGES.map((s, i) => [s.key, stageCount[i]]))
  return {
    filters: f,
    kpis: { ...k, newRequirements: jobsOpened.size, outreachAttempts: outreach },
    monthly,
    hiresByPosition: [...hiresByPos.entries()]
      .map(([p, hires]) => ({ position: ev.positions[p], hires }))
      .sort((a, b) => b.hires - a.hires || a.position.localeCompare(b.position)),
    stages: STAGES.map((s, i) => ({ stage: s.label, count: stageCount[i] })),
    recruiters: [...rec.entries()]
      .map(([r, x]) => ({ id: ev.recruiters[r].id, name: ev.recruiters[r].name, team: ev.recruiters[r].team, ...x }))
      .sort((a, b) => b.hires - a.hires || a.name.localeCompare(b.name)),
  }
}

/**
 * Application detail. An application is in the selection when it was active during the range:
 * sourced on or before `to` and last activity on or after `from`. Newest activity first.
 */
export function listApplications(ap, ev, f, q = '', page = 1, pageSize = 25) {
  const from = toDay(ap.base, f.from), to = toDay(ap.base, f.to)
  const rIdx = f.recruiter ? ev.recruiters.findIndex(x => x.id === f.recruiter) : -1
  const pIdx = f.position ? ev.positions.indexOf(f.position) : -1
  const cIdx = f.client ? ev.clients.indexOf(f.client) : -1
  const qq = q.trim().toLowerCase()
  const hits = []
  for (let i = 0; i < ap.id.length; i++) {
    if (ap.sourced[i] > to || ap.last[i] < from) continue
    if (rIdx >= 0 && ap.r[i] !== rIdx) continue
    if (pIdx >= 0 && ap.p[i] !== pIdx) continue
    if (cIdx >= 0 && ap.c[i] !== cIdx) continue
    if (qq && !appNumToId(ap.id[i]).toLowerCase().includes(qq) && !candidateName(ap.id[i]).toLowerCase().includes(qq)) continue
    hits.push(i)
  }
  hits.sort((x, y) => ap.last[y] - ap.last[x] || ap.id[y] - ap.id[x])
  const start = (page - 1) * pageSize
  return { rows: hits.slice(start, start + pageSize).map(i => appRow(ap, ev, i)), total: hits.length, page, pageSize }
}

function appRow(ap, ev, i) {
  const dt = v => (v < 0 ? null : fromDay(ap.base, v))
  return {
    id: appNumToId(ap.id[i]), candidate: candidateName(ap.id[i]),
    recruiter: ev.recruiters[ap.r[i]].name, position: ev.positions[ap.p[i]], client: ev.clients[ap.c[i]],
    source: ap.sources[ap.s[i]], stage: ap.stages[ap.st[i]],
    sourced: dt(ap.sourced[i]), contacted: dt(ap.contacted[i]), screened: dt(ap.screened[i]),
    submitted: dt(ap.submitted[i]), interview: dt(ap.interview[i]), offer: dt(ap.offer[i]),
    hired: dt(ap.hired[i]), rejected: dt(ap.rejected[i]), withdrawn: dt(ap.withdrawn[i]),
    lastActivity: dt(ap.last[i]), outreachAttempts: ap.oa[i], interviewRounds: ap.ir[i],
    rejectionReason: ap.rr[i] ? ap.reasons[ap.rr[i]] : null,
  }
}

/** One application's dated actions, oldest first. */
export function timeline(ev, applicationId) {
  const a = appIdToNum(applicationId)
  const out = []
  for (let i = 0; i < ev.a.length; i++) {
    if (ev.a[i] !== a) continue
    out.push({
      date: fromDay(ev.base, ev.d[i]), type: ev.types[ev.t[i]],
      channel: ev.ch[i] ? ev.channels[ev.ch[i]] : null, outcome: ev.o[i] ? ev.outcomes[ev.o[i]] : null,
    })
  }
  return out
}

/**
 * Positions (openings) for requirements opened in the range. One requirement asks for several
 * positions. Each position ends up filled (a hire), cancelled (job closed before it was filled)
 * or still open (job is Open or On Hold). Recruiter filters on the job owner.
 * Input: rows of { status, requirements, openings, hires } (one per job status, from SQL or JSON).
 */
export const LIVE_STATUSES = ['Open', 'On Hold']

export function positionsFromStatusRows(rows) {
  const out = { requirements: 0, liveRequirements: 0, openings: 0, filled: 0, cancelled: 0, openNow: 0, onHold: 0 }
  for (const r of rows) {
    const reqs = Number(r.requirements ?? 0), open = Number(r.openings ?? 0), hires = Number(r.hires ?? 0)
    const left = Math.max(0, open - hires)
    out.requirements += reqs
    out.openings += open
    out.filled += hires
    if (LIVE_STATUSES.includes(r.status)) {
      out.liveRequirements += reqs
      out.openNow += left
      if (r.status === 'On Hold') out.onHold += left
    } else out.cancelled += left
  }
  out.fillRate = out.openings ? out.filled / out.openings : 0
  return out
}

/** Same as the Athena positions query, over the exported jobs list. */
export function positionsSummary(jobs, f) {
  const by = new Map()
  for (const j of jobs) {
    if (!j.opened || j.opened < f.from || j.opened > f.to) continue
    if (f.recruiter && j.owner !== f.recruiter) continue
    if (f.position && j.position !== f.position) continue
    if (f.client && j.client !== f.client) continue
    const r = by.get(j.status) ?? { status: j.status, requirements: 0, openings: 0, hires: 0 }
    r.requirements++
    r.openings += Number(j.openings ?? 0)
    r.hires += Number(j.hires ?? 0)
    by.set(j.status, r)
  }
  return positionsFromStatusRows([...by.values()])
}
