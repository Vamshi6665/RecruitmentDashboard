// Prints, as JSON, the SQL strings the API sends to Athena plus the JSON-mode reports for each
// validation scenario. Consumed by scripts/validate.py.
import { readFileSync } from 'node:fs'
import { computeReport, listApplications, positionsSummary } from '../shared/src/index.js'
import { SQL, appsCount, appsParams, filterParams } from '../server/src/services/sql.js'

const dir = new URL('../client/public/data/', import.meta.url)
const ev = JSON.parse(readFileSync(new URL('events.json', dir), 'utf8'))
const ap = JSON.parse(readFileSync(new URL('applications.json', dir), 'utf8'))
const jobs = JSON.parse(readFileSync(new URL('jobs.json', dir), 'utf8'))
const scenarios = JSON.parse(readFileSync(new URL('./scenarios.json', import.meta.url), 'utf8'))
console.log(JSON.stringify({
  sql: { byRecruiterType: SQL.byRecruiterType, monthly: SQL.monthly, hiresByPosition: SQL.hiresByPosition, positions: SQL.positions, appsCount },
  scenarios: scenarios.map(s => ({
    ...s, params: filterParams(s), appsParams: appsParams(s, ''),
    report: { ...computeReport(ev, s), positions: positionsSummary(jobs, s) }, appsTotal: listApplications(ap, ev, s, '', 1, 1).total,
  })),
}))
