# Recruiting dashboard demo dataset

All records are fictional. Snapshot date: 2026-10-05. Activity coverage: 2024-01-01 through 2026-10-05. The calendar extends through 2026-12-31; dates after the snapshot have no events.

## Files and grains

- applications_20000.csv: 20,000 rows, one candidate application for one job. Exactly 2,000 applications per recruiter. Original dashboard's 11 columns are retained first, followed by IDs and extra fields. Candidates are unique in this demo, although the application ID should remain the counting key in a real system.
- recruitment_events.csv: dated actions and milestones. Repeated Outreach events represent calls, emails, or LinkedIn contact attempts. Contacted is recorded once on first outreach. Interview repeats for interview rounds. JobClosed events have blank ApplicationID and CandidateID because they refer to jobs, not candidates.
- jobs.csv: 340 requisitions, each with a stable JobID, job title, client, owner, opening date, requested openings, and closure outcome. Filled means all requested openings were hired. Closed - Unfilled means remaining openings were cancelled; these jobs can still have some hires. Open jobs remain active at the snapshot.
- recruiters.csv: ten recruiters, two teams, manager labels and recruiter roles. Ownership is fixed throughout this demo; event actor and owner are the same. No transfer history is simulated.
- calendar.csv: one row per date with Year, Quarter, YearMonth, month number, week start and snapshot flag.
- monthly_recruiter_summary.csv: 340 recruiter-month summary rows for convenient independent checks. Do not sum its distinct application counts to obtain multi-month distinct counts; repeated outreach and interview rounds can span months. Use the event table for those metrics.
- data_dictionary.csv: fields, meanings and import types.
- validation_summary.json: verified totals for reconciliation.

## Requirement status history and snapshots

- requirement_status_history.csv: contiguous status intervals per job. EffectiveFrom is inclusive; EffectiveTo is exclusive. Blank EffectiveTo means the current interval. Open includes reopened requirements. JobStatus in jobs.csv is the snapshot status, including On Hold.
- requirement_monthly_snapshots.csv: one row per existing job at each month end, plus October 5, 2026 as the latest partial-month snapshot. Use this for open/on-hold counts and requirements without submissions at a selected snapshot. Do not sum stock counts across months; select one SnapshotDate.
- JobOpened, JobOnHold and JobReopened are now recorded in recruitment_events.csv. JobOpened counts new requirements; Submitted distinct JobID counts requirements with submissions; JobOnHold distinct JobID counts requirements entering hold. These are different from snapshot stock counts.
- Historical initial holds occur before sourcing begins. Some current pauses begin after the last application activity on that day. Date-only history resolves statuses at end of day; same-day activity can precede a hold transition. Timestamp precision would be needed for intraday analysis.

## Distribution and limits

Every recruiter has 59 sourced applications per month for January 2024-April 2026 and 58 for May-October 2026: exactly 2,000 each. October 2026 covers only October 1-5. Activity dates and conversion outcomes vary. Each recruiter works across ten position titles and different clients. Applications progress through sourcing, outreach, response, screening, submission, interview, offer and hire. Rejected/withdrawn paths and incomplete recent applications are included. Files contain no future event dates.

This is a balanced synthetic demonstration, not evidence of actual recruiter performance. October is incomplete and 2026 is year-to-date. Compare January 1-October 5, 2026 against January 1-October 5, 2025 for fair YTD comparisons. Define last 3/6 months explicitly as rolling dates or complete calendar months.

## Power BI model for activity reporting

Import dates as Date, IDs as Text, counts as Whole Number. Keep blanks null. Create one-to-many, single-direction relationships:

- Calendar[Date] -> Events[EventDate]
- Recruiters[RecruiterID] -> Events[RecruiterID]
- Recruiters[RecruiterID] -> Applications[RecruiterID]
- Jobs[JobID] -> Events[JobID]
- Jobs[JobID] -> Applications[JobID]

Rename imported queries Events, Applications, Jobs, Recruiters, Calendar. Do not also connect Applications to Events in this initial model, or Recruiters to Jobs: duplicate paths can cause ambiguity. Use shared dimensions for filters. The detailed applications table is a current snapshot and will not automatically become historically correct through an event-date slicer. Historical stage-as-of views require reconstructing the latest event for each application at the selected cutoff.

Calendar filters Events by the date the action occurred. Use Jobs fields to filter positions and clients. Source is present in both fact tables; if a source slicer is needed for both, create a distinct Sources dimension and link it one-to-many to both. Job ownership may be used to build a separate job-workload view.

Suggested DAX measures:

```DAX
Candidates Sourced =
CALCULATE(DISTINCTCOUNT(Events[ApplicationID]), Events[EventType] = "Sourced")

Candidates First Contacted =
CALCULATE(DISTINCTCOUNT(Events[ApplicationID]), Events[EventType] = "Contacted")

Applications With Outreach =
CALCULATE(DISTINCTCOUNT(Events[ApplicationID]), Events[EventType] = "Outreach")

Outreach Attempts =
CALCULATE(COUNTROWS(Events), Events[EventType] = "Outreach")

Submissions =
CALCULATE(DISTINCTCOUNT(Events[ApplicationID]), Events[EventType] = "Submitted")

Candidates Interviewed =
CALCULATE(DISTINCTCOUNT(Events[ApplicationID]), Events[EventType] = "Interview")

Interview Rounds =
CALCULATE(COUNTROWS(Events), Events[EventType] = "Interview")

Hires =
CALCULATE(DISTINCTCOUNT(Events[ApplicationID]), Events[EventType] = "Hired")

Filled Positions =
CALCULATE(DISTINCTCOUNT(Events[JobID]),
    Events[EventType] = "JobClosed", Events[Outcome] = "Filled")
```

Mark Calendar as the date table. Sort YearMonth by YearMonthSort, and MonthName by MonthNumber. Add date-range, year, month, recruiter, job title and client slicers. For snapshot-relative last 3/6 months anchor filters to 2026-10-05; relative-date slicers tied to the real current date will eventually move beyond this static dataset.

Activity-period counts are not a cohort funnel. A September submission can belong to an August-sourced application. Use activity measures for monthly throughput; use Applications[SourcedDate] with eventual stage dates for cohort conversion. Do not divide this month's hires by this month's sourced count and call that a cohort conversion rate. The snapshot columns hold first stage dates; repeated attempts and rounds are in Events.

## AWS upload and schema compatibility

Keep files with different schemas in different S3 prefixes:

- raw/recruiting_history/applications/
- raw/recruiting_history/events/
- raw/recruiting_history/jobs/
- raw/recruiting_history/recruiters/
- raw/recruiting_history/calendar/
- raw/recruiting_history/monthly_summary/

Only upload the matching CSV into each prefix. Do not upload README, JSON, the dictionary, or the ZIP into Athena data prefixes. A Glue crawler can create the separate tables, or define Athena tables with explicit headers/order. Use OpenCSVSerde for these UTF-8 CSVs, skip one header line, and convert ISO dates and blank strings in SQL views.

The earlier 11-column Lambda validator rejects the expanded application header. Its supported stages also omit Screened and Offer. The earlier Athena applications table has only 11 columns. Update both schemas before routing this package through that validator, or use the new prefixes with a dedicated crawler/schema for this exercise. Do not mix the 12-row/1,000-row files with this package unless intentionally combining datasets.

## Demo presentation

1. Explain that the data is synthetic and show the coverage and snapshot date.
2. Compare equivalent YTD periods across years; show last 3/6-month activity.
3. Filter one recruiter and one job title.
4. Distinguish first contacted applications from repeated outreach attempts.
5. Drill into a candidate's dated actions.
6. Show filled versus closed-unfilled requisitions and time to fill.
7. Explain the production path: recruiting API/export -> S3 -> validation/curation -> Athena -> embedded analytics.

## Additional requirement measures

```DAX
New Requirements =
CALCULATE(DISTINCTCOUNT(Events[JobID]), Events[EventType] = "JobOpened")

Requirements With Submissions =
CALCULATE(DISTINCTCOUNT(Events[JobID]), Events[EventType] = "Submitted")

Requirements Entered Hold =
CALCULATE(DISTINCTCOUNT(Events[JobID]), Events[EventType] = "JobOnHold")
```

For arbitrary-date pipeline status, use a disconnected AsOfDate selector and filter StatusHistory to EffectiveFrom <= cutoff and (EffectiveTo blank or EffectiveTo > cutoff). Do not connect Calendar actively to EffectiveFrom and expect that to count all statuses active at cutoff. Recruiters and Jobs can filter StatusHistory by their keys, with single-direction relationships. For the simpler monthly snapshot page use a separate SnapshotDate selector, with Jobs and Recruiters filtering the snapshot table. Compare stock counts at a single end date, not across an interval.

Recommended pages: Management Overview (period activity); Pipeline Health (snapshot status); Recruiter Detail (activity and candidate history).

Additional S3 prefixes: raw/recruiting_history/status_history/ and raw/recruiting_history/monthly_snapshots/. Upload only the corresponding CSV into each.
