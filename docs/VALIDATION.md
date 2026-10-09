# Validation

Columns: **Athena SQL** = the API's queries run verbatim (DuckDB over the same CSVs and views); **JSON source** = what the site computes from exported JSON; **Reference** = dataset `validation_summary.json` or the Power BI screenshot, where one exists.

Result: **PASS** across 80 checks.

| Scenario | Metric | Athena SQL | JSON source | Reference | Match |
|---|---|---|---|---|---|
| A. All data (Power BI default view) | Candidates reached | 16730 | 16730 | 16730 | yes |
| A. All data (Power BI default view) | Submissions | 9622 | 9622 | 9622 | yes |
| A. All data (Power BI default view) | Candidates interviewed | 5456 | 5456 | 5456 | yes |
| A. All data (Power BI default view) | Hires | 1892 | 1892 | 1892 | yes |
| A. All data (Power BI default view) | New requirements | 340 | 340 | 340 | yes |
| A. All data (Power BI default view) | Outreach attempts | 41086 | 41086 | 41086 | yes |
| A. All data (Power BI default view) | Screened | 12929 | 12929 |  | yes |
| A. All data (Power BI default view) | Offers | 2277 | 2277 |  | yes |
| A. All data (Power BI default view) | Monthly points (34 months x 2) | same | same |  | yes |
| A. All data (Power BI default view) | Hires by position (10 bars) | same | same | same | yes |
| A. All data (Power BI default view) | Recruiter table (10 rows x 4) | same | same | same | yes |
| A. All data (Power BI default view) | Requirements / positions / filled / cancelled / open | 340/2598/1892/524/182 | 340/2598/1892/524/182 | 340/2598/1892/524/182 | yes |
| A. All data (Power BI default view) | Application detail rows | 20000 | 20000 |  | yes |
| B. Calendar 2025 | Candidates reached | 5937 | 5937 |  | yes |
| B. Calendar 2025 | Submissions | 3517 | 3517 |  | yes |
| B. Calendar 2025 | Candidates interviewed | 2045 | 2045 |  | yes |
| B. Calendar 2025 | Hires | 685 | 685 |  | yes |
| B. Calendar 2025 | New requirements | 120 | 120 |  | yes |
| B. Calendar 2025 | Outreach attempts | 14804 | 14804 |  | yes |
| B. Calendar 2025 | Screened | 4704 | 4704 |  | yes |
| B. Calendar 2025 | Offers | 817 | 817 |  | yes |
| B. Calendar 2025 | Submissions vs dataset by_year | 3517 | 3517 | 3517 | yes |
| B. Calendar 2025 | Hires vs dataset by_year | 685 | 685 | 685 | yes |
| B. Calendar 2025 | Monthly points (12 months x 2) | same | same |  | yes |
| B. Calendar 2025 | Hires by position (10 bars) | same | same | same | yes |
| B. Calendar 2025 | Recruiter table (10 rows x 4) | same | same |  | yes |
| B. Calendar 2025 | Requirements / positions / filled / cancelled / open | 120/905/695/210/0 | 120/905/695/210/0 |  | yes |
| B. Calendar 2025 | Application detail rows | 8001 | 8001 |  | yes |
| C. 2026 YTD, Alex | Candidates reached | 490 | 490 |  | yes |
| C. 2026 YTD, Alex | Submissions | 279 | 279 |  | yes |
| C. 2026 YTD, Alex | Candidates interviewed | 167 | 167 |  | yes |
| C. 2026 YTD, Alex | Hires | 60 | 60 |  | yes |
| C. 2026 YTD, Alex | New requirements | 9 | 9 |  | yes |
| C. 2026 YTD, Alex | Outreach attempts | 1184 | 1184 |  | yes |
| C. 2026 YTD, Alex | Screened | 371 | 371 |  | yes |
| C. 2026 YTD, Alex | Offers | 75 | 75 |  | yes |
| C. 2026 YTD, Alex | Monthly points (10 months x 2) | same | same |  | yes |
| C. 2026 YTD, Alex | Hires by position (10 bars) | same | same | same | yes |
| C. 2026 YTD, Alex | Recruiter table (1 rows x 4) | same | same |  | yes |
| C. 2026 YTD, Alex | Requirements / positions / filled / cancelled / open | 9/66/46/0/20 | 9/66/46/0/20 |  | yes |
| C. 2026 YTD, Alex | Application detail rows | 669 | 669 |  | yes |
| D. Last 3 months, Data Engineer | Candidates reached | 181 | 181 |  | yes |
| D. Last 3 months, Data Engineer | Submissions | 88 | 88 |  | yes |
| D. Last 3 months, Data Engineer | Candidates interviewed | 57 | 57 |  | yes |
| D. Last 3 months, Data Engineer | Hires | 18 | 18 |  | yes |
| D. Last 3 months, Data Engineer | New requirements | 3 | 3 |  | yes |
| D. Last 3 months, Data Engineer | Outreach attempts | 411 | 411 |  | yes |
| D. Last 3 months, Data Engineer | Screened | 129 | 129 |  | yes |
| D. Last 3 months, Data Engineer | Offers | 16 | 16 |  | yes |
| D. Last 3 months, Data Engineer | Monthly points (4 months x 2) | same | same |  | yes |
| D. Last 3 months, Data Engineer | Hires by position (1 bars) | same | same | same | yes |
| D. Last 3 months, Data Engineer | Recruiter table (5 rows x 4) | same | same |  | yes |
| D. Last 3 months, Data Engineer | Requirements / positions / filled / cancelled / open | 3/18/7/0/11 | 3/18/7/0/11 |  | yes |
| D. Last 3 months, Data Engineer | Application detail rows | 315 | 315 |  | yes |
| E. Q2 2024, Demo Client 03 | Candidates reached | 139 | 139 |  | yes |
| E. Q2 2024, Demo Client 03 | Submissions | 85 | 85 |  | yes |
| E. Q2 2024, Demo Client 03 | Candidates interviewed | 51 | 51 |  | yes |
| E. Q2 2024, Demo Client 03 | Hires | 19 | 19 |  | yes |
| E. Q2 2024, Demo Client 03 | New requirements | 3 | 3 |  | yes |
| E. Q2 2024, Demo Client 03 | Outreach attempts | 359 | 359 |  | yes |
| E. Q2 2024, Demo Client 03 | Screened | 112 | 112 |  | yes |
| E. Q2 2024, Demo Client 03 | Offers | 25 | 25 |  | yes |
| E. Q2 2024, Demo Client 03 | Monthly points (3 months x 2) | same | same |  | yes |
| E. Q2 2024, Demo Client 03 | Hires by position (2 bars) | same | same | same | yes |
| E. Q2 2024, Demo Client 03 | Recruiter table (6 rows x 4) | same | same |  | yes |
| E. Q2 2024, Demo Client 03 | Requirements / positions / filled / cancelled / open | 3/25/21/4/0 | 3/25/21/4/0 |  | yes |
| E. Q2 2024, Demo Client 03 | Application detail rows | 382 | 382 |  | yes |
| F. 2025, Maya, QA Engineer | Candidates reached | 49 | 49 |  | yes |
| F. 2025, Maya, QA Engineer | Submissions | 26 | 26 |  | yes |
| F. 2025, Maya, QA Engineer | Candidates interviewed | 18 | 18 |  | yes |
| F. 2025, Maya, QA Engineer | Hires | 5 | 5 |  | yes |
| F. 2025, Maya, QA Engineer | New requirements | 2 | 2 |  | yes |
| F. 2025, Maya, QA Engineer | Outreach attempts | 131 | 131 |  | yes |
| F. 2025, Maya, QA Engineer | Screened | 38 | 38 |  | yes |
| F. 2025, Maya, QA Engineer | Offers | 7 | 7 |  | yes |
| F. 2025, Maya, QA Engineer | Monthly points (12 months x 2) | same | same |  | yes |
| F. 2025, Maya, QA Engineer | Hires by position (1 bars) | same | same | same | yes |
| F. 2025, Maya, QA Engineer | Recruiter table (1 rows x 4) | same | same |  | yes |
| F. 2025, Maya, QA Engineer | Requirements / positions / filled / cancelled / open | 2/19/14/5/0 | 2/19/14/5/0 |  | yes |
| F. 2025, Maya, QA Engineer | Application detail rows | 59 | 59 |  | yes |
