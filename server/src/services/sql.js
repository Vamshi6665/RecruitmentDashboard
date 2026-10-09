// Athena (Trino) SQL used by the API. Written in the subset DuckDB also runs, so
// scripts/validate.py executes these exact strings locally against the same CSVs.
// `{db}` is replaced with ATHENA_DATABASE. `?` are Athena execution parameters.
//
// Metric rules (same as shared/src/metrics.js and the Power BI DAX):
//   distinct ApplicationID per EventType, filtered by EventDate in range;
//   Outreach Attempts = all Outreach events; New Requirements = distinct JobID with JobOpened.

export const FILTER = `
  event_date BETWEEN CAST(? AS DATE) AND CAST(? AS DATE)
  AND (? = '' OR recruiter_id = ?)
  AND (? = '' OR position = ?)
  AND (? = '' OR client = ?)`

/** Order of parameters for FILTER. */
export const filterParams = f =>
  [f.from, f.to, f.recruiter, f.recruiter, f.position, f.position, f.client, f.client]

export const SQL = {
  // per recruiter x event type; totals are sums because each application and job has one owner
  byRecruiterType: `
SELECT recruiter_id, event_type,
       COUNT(DISTINCT application_id) AS apps,
       COUNT(*) AS events,
       COUNT(DISTINCT job_id) AS jobs
FROM {db}.v_events
WHERE ${FILTER}
GROUP BY recruiter_id, event_type`,

  monthly: `
SELECT substr(CAST(event_date AS VARCHAR), 1, 7) AS month, event_type,
       COUNT(DISTINCT application_id) AS apps
FROM {db}.v_events
WHERE ${FILTER} AND event_type IN ('Submitted', 'Hired')
GROUP BY 1, 2`,

  hiresByPosition: `
SELECT position, COUNT(DISTINCT application_id) AS hires
FROM {db}.v_events
WHERE ${FILTER} AND event_type = 'Hired'
GROUP BY position`,

  recruiters: `SELECT recruiter_id, recruiter, team, title, manager FROM {db}.v_recruiters ORDER BY recruiter_id`,

  dims: `
SELECT 'position' AS kind, position AS value FROM {db}.v_events GROUP BY position
UNION ALL
SELECT 'client', client FROM {db}.v_events GROUP BY client
UNION ALL
SELECT 'min', CAST(MIN(event_date) AS VARCHAR) FROM {db}.v_events
UNION ALL
SELECT 'max', CAST(MAX(event_date) AS VARCHAR) FROM {db}.v_events`,

  // applications active during the range: sourced on/before `to`, last activity on/after `from`
  appsWhere: `
  sourced_date <= CAST(? AS DATE) AND last_activity_date >= CAST(? AS DATE)
  AND (? = '' OR recruiter_id = ?)
  AND (? = '' OR position = ?)
  AND (? = '' OR client = ?)
  AND (? = '' OR lower(application_id) LIKE ? OR lower(candidate) LIKE ?)`,

  jobs: `
SELECT job_id, position, client, department, location, owner_recruiter_id,
       CAST(open_date AS VARCHAR) AS opened, CAST(close_date AS VARCHAR) AS closed,
       openings, hires, status
FROM {db}.v_jobs
ORDER BY open_date DESC, job_id DESC`,

  // positions on requirements opened in the range; recruiter = job owner (folded in shared positionsFromStatusRows)
  positions: `
SELECT status, COUNT(*) AS requirements, SUM(openings) AS openings, SUM(hires) AS hires
FROM {db}.v_jobs
WHERE open_date BETWEEN CAST(? AS DATE) AND CAST(? AS DATE)
  AND (? = '' OR owner_recruiter_id = ?)
  AND (? = '' OR position = ?)
  AND (? = '' OR client = ?)
GROUP BY status`,

  timeline: `
SELECT CAST(event_date AS VARCHAR) AS date, event_type, channel, outcome
FROM {db}.v_events
WHERE application_id = ?
ORDER BY event_date, event_id`,
}

export const appsCount = `SELECT COUNT(*) AS total FROM {db}.v_applications WHERE ${SQL.appsWhere}`

export const appsPage = (offset, limit) => `
SELECT application_id, candidate, recruiter, position, client, source, current_stage,
       CAST(sourced_date AS VARCHAR) AS sourced, CAST(contacted_date AS VARCHAR) AS contacted,
       CAST(screened_date AS VARCHAR) AS screened, CAST(submitted_date AS VARCHAR) AS submitted,
       CAST(interview_date AS VARCHAR) AS interview, CAST(offer_date AS VARCHAR) AS offer,
       CAST(hired_date AS VARCHAR) AS hired, CAST(rejected_date AS VARCHAR) AS rejected,
       CAST(withdrawn_date AS VARCHAR) AS withdrawn, CAST(last_activity_date AS VARCHAR) AS last_activity,
       outreach_attempts, interview_rounds, rejection_reason
FROM {db}.v_applications
WHERE ${SQL.appsWhere}
ORDER BY last_activity_date DESC, application_id DESC
OFFSET ${Math.max(0, Math.floor(offset))} LIMIT ${Math.max(1, Math.min(200, Math.floor(limit)))}`

export const appsParams = (f, q) => {
  const like = `%${q.toLowerCase()}%`
  return [f.to, f.from, f.recruiter, f.recruiter, f.position, f.position, f.client, f.client, q, like, like]
}
