# Recruitment Hub

A recruiting website with the Power BI reports built in. Managers open **Recruitment Overview** and **Recruiter Analysis** inside the same app as **Jobs** and **Recruiters**, with live numbers from Amazon Athena.

📊 6 KPIs, positions summary, 5 report visuals, candidate history drill-down · ☁️ Athena with automatic exported-JSON fallback · ✅ 57 automated tests + 80-check data validation against Power BI

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, plain CSS, custom inline SVG icons and charts |
| Backend | Node.js 20+, Express 5 |
| Validation and security | Zod (request schemas), Helmet (HTTP headers + CSP), express-rate-limit, CORS, compression |
| Data | Amazon Athena via AWS SDK v3 (parameterized queries) · exported JSON fallback |
| Storage | No database: Athena is the source of truth · in-memory LRU cache (server) · localStorage for settings and filters (client) |
| Testing | Vitest, Supertest, React Testing Library, jsdom · 57 tests · DuckDB validation of the Athena SQL |
| DevOps | GitHub Actions CI (Node 20 and 22), Docker multi-stage on Node 22 Alpine, Vercel serverless |
| Repo layout | npm workspaces: `client/`, `server/`, `shared/`, plus `api/` (Vercel entry) |

## Quick start

```bash
npm install
npm run dev          # server on :8787 + client on http://localhost:5173
npm test             # 57 tests
npm run validate     # Athena SQL vs JSON mode vs Power BI references (pip install duckdb)
```

With no AWS credentials the app runs on the exported JSON. The bottom of the sidebar shows the active source: **Live · Amazon Athena**, **API · exported JSON**, or **Offline · exported JSON**. Click it for details and the Athena error, if any.

## Connect your Athena data

Bucket layout used: `s3://vamshi-recruiting-dashboard-demo-20261004/raw/recruiting_history/{applications,events,jobs,recruiters,…}/`

1. Make sure each folder holds only its own CSV (no README, JSON or ZIP).
2. In the Athena console run each statement in `athena/01_tables.sql`, then `athena/02_views.sql`. (Skip 01 if a Glue crawler made the tables; point the views at those names.)
3. Check: `SELECT event_type, COUNT(*) FROM recruiting_history.v_events GROUP BY 1` → Outreach 41,086 · Hired 1,892.
4. `cp .env.example .env` and set `AWS_REGION`, `ATHENA_DATABASE`, `ATHENA_WORKGROUP`, `ATHENA_OUTPUT_LOCATION`. Credentials come from `aws configure`, `AWS_PROFILE` or an IAM role.
5. `npm run dev`. The sidebar should read **Live · Amazon Athena**.

IAM for the server: `athena:StartQueryExecution`, `athena:GetQueryExecution`, `athena:GetQueryResults` · `glue:GetDatabase`, `glue:GetTable` · `s3:GetObject`, `s3:ListBucket` on `raw/recruiting_history/*` · `s3:GetObject`, `s3:PutObject` on the results folder.

**API first, JSON second.** `DATA_SOURCE=auto` (default) probes Athena at first request and falls back to `client/public/data/*.json` if it fails. `athena` fails loudly instead; `json` skips Athena. In the browser, Settings offers the same choice, and if the API itself is unreachable the client computes the reports from the JSON files.

**Your own export.** `python3 scripts/build_static_json.py --in <folder>` accepts `events`, `applications`, `recruiters`, `jobs` as CSV, JSON arrays or JSON Lines (Athena UNLOAD), with raw headers (`EventDate`) or view names (`event_date`).

## How a report request flows

1. Filters change in the browser (date range, year, recruiter, position, client) and save to localStorage.
2. The client calls `GET /api/report?from&to&recruiter&position&client`.
3. The server validates the query with Zod, checks values against `/api/meta`, and applies the rate limit.
4. Four Athena queries run in parallel through the LRU cache (15-minute TTL): three over `v_events`, one over `v_jobs` for positions. A repeat selection returns from memory without touching Athena.
5. Rows are shaped into one report: KPIs, positions, monthly series, hires by position, stage activity, recruiter rows.
6. The same shape comes from `shared/src/metrics.js` in JSON mode, so the UI never knows which source answered.

## Project layout

```
client/src/
  App.jsx                 root: state, data connection, routing, drawers
  components/
    Sidebar, FilterBar, KpiRow, Panel           shell and report chrome
    MonthlyPanel, PositionPanel, StagePanel     Power BI visuals
    RecruiterTable, ApplicationsPanel           tables (sortable / paged + search)
    TimelineDrawer, SettingsDrawer, Drawer      drawers (shared shell)
    CommandPalette, Icon                        ⌘K menu, SVG icon set
    charts/  LineChart, HBarChart, ScatterChart, chartKit
  pages/    OverviewPage, RecruiterAnalysisPage, JobsPage, RecruitersPage
  lib/      api.js (API-first client), storage.js (safe localStorage), format.js
  hooks/    useLocalState.js
server/src/
  index.js  app.js  config.js  schemas.js
  middleware/errors.js     uniform { error: { code, message } } responses
  services/  reports.js (source choice + checks), athena.js, sql.js, cache.js
  sources/   athenaSource.js, jsonSource.js
shared/src/metrics.js      report logic for JSON mode (browser + server)
api/index.js               Vercel wrapper around the same Express app
athena/                    DDL and views for your bucket
scripts/                   JSON builder, validation
```

## API

| Route | Returns |
|---|---|
| `GET /api/health` | active source, note, fallback reason |
| `GET /api/meta` | recruiters, positions, clients, date bounds |
| `GET /api/report` | KPIs, positions, monthly, hires by position, stages, recruiter rows |
| `GET /api/applications` | application detail page (`q`, `page`, `pageSize`) |
| `GET /api/applications/:id/events` | one candidate's dated history |
| `GET /api/jobs` | requisitions with status |
| `GET /api/stats` | cache size, hits, misses |

## Metric definitions

Counted on recruitment events by **EventDate** in the range; recruiter, position and client filter the events. Same rules in Athena SQL, `shared/src/metrics.js` and the Power BI DAX.

| Measure | Rule |
|---|---|
| Candidates Reached | distinct applications with `Contacted` |
| Submissions | distinct applications with `Submitted` |
| Candidates Interviewed | distinct applications with `Interview` |
| Hires | distinct applications with `Hired` |
| New Requirements | distinct jobs with `JobOpened` |
| Outreach Attempts | all `Outreach` events |

**Positions** come from the jobs table, not events: requirements whose open date is in the range, filtered by job owner, position and client. Status is as of the latest snapshot.

| Measure | Rule |
|---|---|
| Requirements | jobs opened in the range |
| Positions requested | sum of `Openings` |
| Filled | sum of `Hires` on those jobs |
| Cancelled | `Openings − Hires` on Filled / Closed-Unfilled jobs |
| Open positions | `Openings − Hires` on Open / On Hold jobs |

All dates: 340 requirements · 2,598 positions · 1,892 filled · 524 cancelled · 182 open (43 on hold).

Stage activity is period activity, not a cohort funnel. Application Detail lists applications active in the range: sourced by the end date and last activity on or after the start.

## Deploy

- **Docker:** `docker build -t recruitment-hub . && docker run -p 8787:8787 --env-file .env recruitment-hub` serves the site and API from one container. Use an IAM role on ECS/App Runner instead of keys.
- **Vercel:** import the repo as a new project (root directory = repo root); `vercel.json` builds the client to the CDN and runs the Express app as one function at `api/index.js`. In Settings → Environment Variables add `ATHENA_REGION`, `ATHENA_ACCESS_KEY_ID`, `ATHENA_SECRET_ACCESS_KEY`, `ATHENA_DATABASE`, `ATHENA_WORKGROUP`, `ATHENA_OUTPUT_LOCATION`, `DATA_SOURCE=auto`, then redeploy. Use a dedicated IAM user limited to Athena, Glue and this bucket. The cache and rate limit are per instance there.

## Validation

`npm run validate` runs the server's Athena SQL verbatim in DuckDB over the same CSVs and views, compares it with JSON mode, and checks against the dataset's `validation_summary.json` and the Power BI screenshot values (e.g. Alex 1,658 / 976 / 598 / 205). Latest: 80 of 80 checks match (`docs/VALIDATION.md`).

## Next

- Pipeline page (requirement status history and monthly snapshots)
- Login with roles: managers see everyone, recruiters see their own data
- Scheduled refresh: S3 upload → Athena views stay current; cache TTL controls staleness
