// Reports from the exported JSON bundles (scripts/build_static_json.py). Same shape as athenaSource.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { computeReport, listApplications, metaFromBundle, positionsSummary, timeline } from '@hub/shared'

export function createJsonSource(dir) {
  const read = f => JSON.parse(readFileSync(path.join(dir, f), 'utf8'))
  const ev = read('events.json')
  let ap = null, jobs = null
  const meta = metaFromBundle(ev)
  return {
    name: 'json',
    probe: async () => meta,
    meta: async () => meta,
    report: async f => ({ ...computeReport(ev, f), positions: positionsSummary((jobs ??= read('jobs.json')), f) }),
    applications: async (f, q, page, size) => listApplications((ap ??= read('applications.json')), ev, f, q, page, size),
    timeline: async id => timeline(ev, id),
    jobs: async () => (jobs ??= read('jobs.json')),
  }
}
