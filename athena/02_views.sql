-- Typed views the API reads. Run each CREATE VIEW separately.
-- Blank strings become NULL; ISO date strings become DATE.

CREATE OR REPLACE VIEW recruiting_history.v_events AS
SELECT
  EventID AS event_id,
  NULLIF(ApplicationID, '') AS application_id,
  NULLIF(JobID, '') AS job_id,
  RecruiterID AS recruiter_id,
  Recruiter AS recruiter,
  Job AS position,
  Client AS client,
  NULLIF(Source, '') AS source,
  EventType AS event_type,
  CAST(EventDate AS DATE) AS event_date,
  NULLIF(Channel, '') AS channel,
  NULLIF(Outcome, '') AS outcome
FROM recruiting_history.events;

CREATE OR REPLACE VIEW recruiting_history.v_applications AS
SELECT
  ApplicationID AS application_id,
  Candidate AS candidate,
  Job AS position,
  Recruiter AS recruiter,
  RecruiterID AS recruiter_id,
  JobID AS job_id,
  Client AS client,
  Source AS source,
  CurrentStage AS current_stage,
  CAST(NULLIF(SourcedDate, '') AS DATE)      AS sourced_date,
  CAST(NULLIF(ContactedDate, '') AS DATE)    AS contacted_date,
  CAST(NULLIF(ScreenedDate, '') AS DATE)     AS screened_date,
  CAST(NULLIF(SubmittedDate, '') AS DATE)    AS submitted_date,
  CAST(NULLIF(InterviewDate, '') AS DATE)    AS interview_date,
  CAST(NULLIF(OfferDate, '') AS DATE)        AS offer_date,
  CAST(NULLIF(HiredDate, '') AS DATE)        AS hired_date,
  CAST(NULLIF(RejectedDate, '') AS DATE)     AS rejected_date,
  CAST(NULLIF(WithdrawnDate, '') AS DATE)    AS withdrawn_date,
  CAST(NULLIF(LastActivityDate, '') AS DATE) AS last_activity_date,
  CAST(NULLIF(OutreachAttempts, '') AS INTEGER) AS outreach_attempts,
  CAST(NULLIF(InterviewRounds, '') AS INTEGER)  AS interview_rounds,
  NULLIF(RejectionReason, '') AS rejection_reason
FROM recruiting_history.applications;

CREATE OR REPLACE VIEW recruiting_history.v_recruiters AS
SELECT RecruiterID AS recruiter_id, Recruiter AS recruiter, RecruiterTitle AS title,
       Team AS team, Manager AS manager
FROM recruiting_history.recruiters;

CREATE OR REPLACE VIEW recruiting_history.v_jobs AS
SELECT JobID AS job_id, Job AS position, Client AS client, Department AS department,
       Location AS location, OwnerRecruiterID AS owner_recruiter_id,
       CAST(NULLIF(JobOpenDate, '') AS DATE) AS open_date,
       CAST(NULLIF(JobCloseDate, '') AS DATE) AS close_date,
       CAST(NULLIF(Openings, '') AS INTEGER) AS openings,
       CAST(NULLIF(Hires, '') AS INTEGER) AS hires,
       JobStatus AS status
FROM recruiting_history.jobs;
