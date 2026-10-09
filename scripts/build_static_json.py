"""
Build the compact JSON files the site uses in JSON mode (and the API uses when DATA_SOURCE=json).

    python3 scripts/build_static_json.py                 # reads data/raw/*.csv
    python3 scripts/build_static_json.py --in exports/   # your Athena/S3 exports

Inputs per table, first match wins: recruitment_events.csv | events.csv | events.json,
applications_20000.csv | applications.csv | applications.json, recruiters.csv | recruiters.json.
JSON can be an array of records or JSON Lines (Athena UNLOAD format). Column names are matched
case-insensitively and with or without underscores, so both the raw CSV headers (EventDate)
and the view columns (event_date) work.

Outputs: apps/web/public/data/events.json, applications.json
"""
import argparse, csv, json, os, re
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "client", "public", "data")

ALIASES = {  # canonical -> accepted normalized names
    "applicationid": ["applicationid"], "jobid": ["jobid"], "recruiterid": ["recruiterid"],
    "recruiter": ["recruiter", "recruitername"], "job": ["job", "position", "positiontitle"],
    "client": ["client", "clientname"], "eventtype": ["eventtype"], "eventdate": ["eventdate"],
    "channel": ["channel"], "outcome": ["outcome"], "source": ["source"],
    "currentstage": ["currentstage", "stage"], "rejectionreason": ["rejectionreason"],
    "sourceddate": ["sourceddate"], "contacteddate": ["contacteddate"], "screeneddate": ["screeneddate"],
    "submitteddate": ["submitteddate"], "interviewdate": ["interviewdate"], "offerdate": ["offerdate"],
    "hireddate": ["hireddate"], "rejecteddate": ["rejecteddate"], "withdrawndate": ["withdrawndate"],
    "lastactivitydate": ["lastactivitydate"], "outreachattempts": ["outreachattempts"],
    "interviewrounds": ["interviewrounds"], "team": ["team"], "recruitertitle": ["recruitertitle", "title"],
    "manager": ["manager"],
    "department": ["department"],
    "ownerrecruiterid": ["ownerrecruiterid"],
    "jobclosedate": ["jobclosedate", "closedate"],
    "jobopendate": ["jobopendate", "opendate"],
    "jobstatus": ["jobstatus", "status"],
    "hires": ["hires"],
    "openings": ["openings"],
    "location": ["location"],
}
norm = lambda s: re.sub(r"[^a-z]", "", s.lower())

def read_table(folder, names):
    for n in names:
        p = os.path.join(folder, n)
        if not os.path.exists(p):
            continue
        if p.endswith(".csv"):
            with open(p, newline="", encoding="utf-8-sig") as f:
                rows = list(csv.DictReader(f))
        else:
            txt = open(p, encoding="utf-8").read().strip()
            rows = json.loads(txt) if txt.startswith("[") else [json.loads(l) for l in txt.splitlines() if l.strip()]
        out = []
        for r in rows:
            nr = {norm(k): ("" if v is None else str(v)) for k, v in r.items()}
            out.append({canon: next((nr[a] for a in al if a in nr), "") for canon, al in ALIASES.items()})
        print(f"read {p}: {len(out)} rows")
        return out
    raise SystemExit(f"none of {names} found in {folder}")

ap = argparse.ArgumentParser(); ap.add_argument("--in", dest="src", default=os.path.join(ROOT, "data", "raw"))
ap.add_argument("--as-of", default=None)
a = ap.parse_args()

events = read_table(a.src, ["recruitment_events.csv", "events.csv", "events.json"])
apps = read_table(a.src, ["applications_20000.csv", "applications.csv", "applications.json"])
recs = read_table(a.src, ["recruiters.csv", "recruiters.json"])
jobs = read_table(a.src, ["jobs.csv", "jobs.json"])

base = min(e["eventdate"][:10] for e in events)
BASE = date.fromisoformat(base)
day = lambda s: (date.fromisoformat(s[:10]) - BASE).days if s else -1
as_of = a.as_of or max(e["eventdate"][:10] for e in events)

class Dict:
    def __init__(self, first=None): self.items, self.idx = ([first] if first is not None else []), {}
    def __call__(self, v):
        if v in self.idx: return self.idx[v]
        if self.items and v == self.items[0] and v == "": return 0
        self.idx[v] = len(self.items); self.items.append(v); return self.idx[v]

recruiters = sorted(recs, key=lambda r: r["recruiterid"])
r_index = {r["recruiterid"]: i for i, r in enumerate(recruiters)}
positions = sorted({e["job"] for e in events})
clients = sorted({e["client"] for e in events})
p_index = {p: i for i, p in enumerate(positions)}
c_index = {c: i for i, c in enumerate(clients)}
types, channels, outcomes = Dict(), Dict(""), Dict("")
num = lambda s: int(re.sub(r"\D", "", s)) if s else 0

events.sort(key=lambda e: (e["eventdate"], e["applicationid"]))
E = {k: [] for k in ["d", "t", "r", "p", "c", "a", "k", "ch", "o"]}
for e in events:
    E["d"].append(day(e["eventdate"])); E["t"].append(types(e["eventtype"]))
    E["r"].append(r_index[e["recruiterid"]]); E["p"].append(p_index[e["job"]]); E["c"].append(c_index[e["client"]])
    E["a"].append(num(e["applicationid"])); E["k"].append(num(e["jobid"]))
    E["ch"].append(channels(e["channel"])); E["o"].append(outcomes(e["outcome"]))

bundle = {
    "asOf": as_of, "base": base,
    "recruiters": [{"id": r["recruiterid"], "name": r["recruiter"], "team": r["team"],
                    "title": r["recruitertitle"], "manager": r["manager"]} for r in recruiters],
    "positions": positions, "clients": clients, "types": types.items,
    "channels": channels.items, "outcomes": outcomes.items, **E,
}

sources, stages, reasons = Dict(), Dict(), Dict("")
A = {k: [] for k in ["id", "r", "p", "c", "s", "st", "rr", "sourced", "contacted", "screened", "submitted",
                     "interview", "offer", "hired", "rejected", "withdrawn", "last", "oa", "ir"]}
for x in apps:
    A["id"].append(num(x["applicationid"])); A["r"].append(r_index[x["recruiterid"]])
    A["p"].append(p_index[x["job"]]); A["c"].append(c_index[x["client"]])
    A["s"].append(sources(x["source"])); A["st"].append(stages(x["currentstage"])); A["rr"].append(reasons(x["rejectionreason"]))
    for k, col in [("sourced", "sourceddate"), ("contacted", "contacteddate"), ("screened", "screeneddate"),
                   ("submitted", "submitteddate"), ("interview", "interviewdate"), ("offer", "offerdate"),
                   ("hired", "hireddate"), ("rejected", "rejecteddate"), ("withdrawn", "withdrawndate"),
                   ("last", "lastactivitydate")]:
        A[k].append(day(x[col]))
    A["oa"].append(int(x["outreachattempts"] or 0)); A["ir"].append(int(x["interviewrounds"] or 0))
apps_bundle = {"base": base, "sources": sources.items, "stages": stages.items, "reasons": reasons.items, **A}

jobs_out = [{"id": j["jobid"], "position": j["job"], "client": j["client"], "department": j["department"],
             "location": j["location"], "owner": j["ownerrecruiterid"], "opened": j["jobopendate"][:10] or None,
             "closed": j["jobclosedate"][:10] or None, "openings": int(j["openings"] or 0),
             "hires": int(j["hires"] or 0), "status": j["jobstatus"]} for j in jobs]
jobs_out.sort(key=lambda j: (j["opened"] or "", j["id"]), reverse=True)

os.makedirs(OUT, exist_ok=True)
for name, obj in [("events.json", bundle), ("applications.json", apps_bundle), ("jobs.json", jobs_out)]:
    p = os.path.join(OUT, name)
    json.dump(obj, open(p, "w"), separators=(",", ":"))
    print(f"wrote {p} ({os.path.getsize(p) // 1024} KB)")
