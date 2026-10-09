"""
Three-way reconciliation, written to docs/VALIDATION.md:

  1. The API's Athena SQL (server/src/services/sql.js), executed verbatim in DuckDB
     over data/raw CSVs through the same views as athena/02_views.sql.
  2. The JSON source (packages/shared metrics) that the site uses when the API is down.
  3. Fixed references: validation_summary.json from the dataset, and the values visible in
     the Power BI Recruitment Overview screenshots.

Run: npm run validate   (needs: pip install duckdb)
"""
import json, os, re, subprocess, sys
import duckdb

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "raw")
dump = json.loads(subprocess.check_output(["node", "scripts/report_scenarios.mjs"], cwd=ROOT))

con = duckdb.connect()
con.execute("CREATE SCHEMA recruiting_history")
for table, f in [("events", "recruitment_events.csv"), ("applications", "applications_20000.csv"),
                 ("jobs", "jobs.csv"), ("recruiters", "recruiters.csv")]:
    con.execute(f"CREATE TABLE recruiting_history.{table} AS SELECT * FROM read_csv('{RAW}/{f}', all_varchar=true)")
    con.execute(f"UPDATE recruiting_history.{table} SET " + ", ".join(
        f'"{c}" = coalesce("{c}", \'\')' for c in [r[0] for r in con.execute(f"DESCRIBE recruiting_history.{table}").fetchall()]))
views = "\n".join(l for l in open(os.path.join(ROOT, "athena", "02_views.sql")) if not l.lstrip().startswith("--"))
for stmt in [s for s in re.split(r";\s*\n", views) if "CREATE" in s]:
    con.execute(stmt[stmt.index("CREATE"):])

sql = {k: v.replace("{db}", "recruiting_history") for k, v in dump["sql"].items()}
lines, failures = [], 0

def check(sc, metric, sql_v, json_v, ref=None):
    global failures
    ok = sql_v == json_v and (ref is None or ref == sql_v)
    failures += 0 if ok else 1
    lines.append(f"| {sc} | {metric} | {sql_v} | {json_v} | {'' if ref is None else ref} | {'yes' if ok else '**NO**'} |")

summary = json.load(open(os.path.join(ROOT, "data", "validation_summary.json")))
POWER_BI = {  # read off the Recruitment Overview screenshot (all dates, no filters)
    "Alex": (1658, 976, 598, 205), "Maya": (1675, 1047, 657, 203), "Daniel": (1692, 1105, 577, 199),
    "Arjun": (1689, 986, 607, 197), "Neha": (1653, 856, 483, 196), "Sarah": (1699, 952, 512, 183),
    "James": (1654, 911, 494, 182), "Olivia": (1656, 930, 548, 182), "Rahul": (1668, 945, 511, 182),
    "Priya": (1686, 914, 469, 163),
}
PBI_POS = {"QA Engineer": 207, "Cloud Engineer": 198, "Machine Learning Engineer": 197, "Full Stack Developer": 196,
           "DevOps Engineer": 189, "Business Analyst": 184, "Data Analyst": 181, "Java Developer": 181,
           "Python Developer": 180, "Data Engineer": 179}

for s in dump["scenarios"]:
    p, r = s["params"], s["report"]
    tag = f'{s["id"]}. {s["name"]}'
    rt = con.execute(sql["byRecruiterType"], p).fetchall()  # recruiter_id, type, apps, events, jobs
    tot = lambda t, i=2: sum(x[i] for x in rt if x[1] == t)
    is_all = s["id"] == "A"
    ev = summary["event_counts"]
    for name, t, key, i, ref in [
        ("Candidates reached", "Contacted", "reached", 2, summary["contacted"] if is_all else None),
        ("Submissions", "Submitted", "submissions", 2, ev["Submitted"] if is_all else None),
        ("Candidates interviewed", "Interview", "interviewed", 2, summary["interviewed"] if is_all else None),
        ("Hires", "Hired", "hires", 2, ev["Hired"] if is_all else None),
        ("New requirements", "JobOpened", "newRequirements", 4, ev["JobOpened"] if is_all else None),
        ("Outreach attempts", "Outreach", "outreachAttempts", 3, ev["Outreach"] if is_all else None),
        ("Screened", "Screened", "screened", 2, None), ("Offers", "Offer", "offers", 2, None),
    ]:
        check(tag, name, tot(t, i), r["kpis"][key], ref)
    if s["id"] == "B":
        y = summary["by_year"]["2025"]
        check(tag, "Submissions vs dataset by_year", tot("Submitted"), r["kpis"]["submissions"], y["submitted"])
        check(tag, "Hires vs dataset by_year", tot("Hired"), r["kpis"]["hires"], y["hired"])

    mon = {(m, t): n for m, t, n in con.execute(sql["monthly"], p).fetchall()}
    m_ok = all(mon.get((x["month"], "Submitted"), 0) == x["submissions"] and mon.get((x["month"], "Hired"), 0) == x["hires"] for x in r["monthly"])
    check(tag, f"Monthly points ({len(r['monthly'])} months x 2)", "same" if m_ok else "differs", "same")

    pos = dict(con.execute(sql["hiresByPosition"], p).fetchall())
    jpos = {x["position"]: x["hires"] for x in r["hiresByPosition"]}
    check(tag, f"Hires by position ({len(pos)} bars)", "same" if pos == jpos else "differs", "same",
          "same" if (not is_all or pos == PBI_POS) else "differs")

    names = {x["id"]: x["name"] for x in r["recruiters"]}
    sql_rec = {}
    for rid, t, apps, _, _ in rt:
        k = {"Contacted": 0, "Submitted": 1, "Interview": 2, "Hired": 3}.get(t)
        if k is None: continue
        sql_rec.setdefault(rid, [0, 0, 0, 0])[k] = apps
    j_rec = {x["id"]: [x["reached"], x["submissions"], x["interviewed"], x["hires"]] for x in r["recruiters"]}
    rec_ok = sql_rec == j_rec
    pbi_ok = None
    if is_all:
        pbi_ok = "same" if all(tuple(j_rec[i]) == POWER_BI[n] for i, n in names.items()) else "differs"
    check(tag, f"Recruiter table ({len(sql_rec)} rows x 4)", "same" if rec_ok else "differs", "same", pbi_ok)

    # positions: SQL rows per job status, folded the same way as shared positionsFromStatusRows
    pr = con.execute(sql["positions"], p).fetchall()  # status, requirements, openings, hires
    live = ("Open", "On Hold")
    sp = {"requirements": sum(x[1] for x in pr), "openings": sum(x[2] for x in pr), "filled": sum(x[3] for x in pr),
          "cancelled": sum(x[2] - x[3] for x in pr if x[0] not in live), "openNow": sum(x[2] - x[3] for x in pr if x[0] in live)}
    jp = r["positions"]
    check(tag, "Requirements / positions / filled / cancelled / open",
          "/".join(str(sp[k]) for k in sp), "/".join(str(jp[k]) for k in sp),
          None if not is_all else "/".join(map(str, (340, 2598, 1892, 524, 182))))

    total_apps = con.execute(sql["appsCount"], s["appsParams"]).fetchone()[0]
    check(tag, "Application detail rows", total_apps, s["appsTotal"])

os.makedirs(os.path.join(ROOT, "docs"), exist_ok=True)
with open(os.path.join(ROOT, "docs", "VALIDATION.md"), "w") as f:
    f.write("# Validation\n\n")
    f.write("Columns: **Athena SQL** = the API's queries run verbatim (DuckDB over the same CSVs and views); "
            "**JSON source** = what the site computes from exported JSON; **Reference** = dataset "
            "`validation_summary.json` or the Power BI screenshot, where one exists.\n\n")
    f.write(f"Result: **{'PASS' if failures == 0 else f'{failures} mismatches'}** across {len(lines)} checks.\n\n")
    f.write("| Scenario | Metric | Athena SQL | JSON source | Reference | Match |\n|---|---|---|---|---|---|\n")
    f.write("\n".join(lines) + "\n")
print(f"{len(lines)} checks, {failures} failures -> docs/VALIDATION.md")
sys.exit(1 if failures else 0)
