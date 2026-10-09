-- Athena tables over your bucket layout:
--   s3://vamshi-recruiting-dashboard-demo-20261004/raw/recruiting_history/<folder>/
-- Run each statement separately in the Athena query editor (it runs one at a time).
-- If a Glue crawler already created tables, skip this file and point 02_views.sql at them.
-- OpenCSVSerde reads every column as string; 02_views.sql converts types.

CREATE DATABASE IF NOT EXISTS recruiting_history;

CREATE EXTERNAL TABLE IF NOT EXISTS recruiting_history.events (
  EventID string, ApplicationID string, CandidateID string, JobID string, RecruiterID string,
  Recruiter string, Job string, Client string, Source string, EventType string,
  EventDate string, Channel string, Outcome string)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES ('separatorChar' = ',', 'quoteChar' = '"')
LOCATION 's3://vamshi-recruiting-dashboard-demo-20261004/raw/recruiting_history/events/'
TBLPROPERTIES ('skip.header.line.count' = '1');

CREATE EXTERNAL TABLE IF NOT EXISTS recruiting_history.applications (
  ApplicationID string, Candidate string, Job string, Recruiter string, Source string,
  SourcedDate string, ContactedDate string, SubmittedDate string, InterviewDate string,
  HiredDate string, CurrentStage string, CandidateID string, RecruiterID string, JobID string,
  Client string, ScreenedDate string, OfferDate string, RejectedDate string, WithdrawnDate string,
  ResponseDate string, LastActivityDate string, OutreachAttempts string, InterviewRounds string,
  RejectionReason string, AsOfDate string, IsSynthetic string)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES ('separatorChar' = ',', 'quoteChar' = '"')
LOCATION 's3://vamshi-recruiting-dashboard-demo-20261004/raw/recruiting_history/applications/'
TBLPROPERTIES ('skip.header.line.count' = '1');

CREATE EXTERNAL TABLE IF NOT EXISTS recruiting_history.jobs (
  JobID string, Job string, Client string, Department string, Location string,
  EmploymentType string, Seniority string, OwnerRecruiterID string, JobOpenDate string,
  TargetCloseDate string, Openings string, JobStatus string, JobCloseDate string,
  ClosureReason string, Hires string, RemainingOpenings string,
  UnfilledOpeningsAtClosure string, AsOfDate string, EverOnHold string)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES ('separatorChar' = ',', 'quoteChar' = '"')
LOCATION 's3://vamshi-recruiting-dashboard-demo-20261004/raw/recruiting_history/jobs/'
TBLPROPERTIES ('skip.header.line.count' = '1');

CREATE EXTERNAL TABLE IF NOT EXISTS recruiting_history.recruiters (
  RecruiterID string, Recruiter string, RecruiterTitle string, Team string,
  Manager string, StartDate string)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES ('separatorChar' = ',', 'quoteChar' = '"')
LOCATION 's3://vamshi-recruiting-dashboard-demo-20261004/raw/recruiting_history/recruiters/'
TBLPROPERTIES ('skip.header.line.count' = '1');

-- calendar/, status_history/ and monthly_snapshots/ are not needed by the Overview and
-- Recruiter Analysis pages. They get tables when the Requirements & Pipeline page is built.
