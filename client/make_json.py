#!/usr/bin/env python3
import csv
import json
import uuid
import os

# CONFIG: set these paths and toggles
INPUT_CSV = "src/data/postings.csv"        # path to your CSV
OUTPUT_NDJSON = "postings.ndjson" # path to write NDJSON
DELIMITER = ","                   # CSV delimiter
QUOTECHAR = '"'                   # CSV quote char
GENERATE_OID = True               # add _id: {"$oid": "..."} to each doc
COERCE_SALARY = True              # convert salaryMin/salaryMax to numbers if possible

# Aliases copied to match React normalizeJob
ALIASES = {
    "id": ["job_id", "id"],
    "title": ["job_title", "title", "position", "roleTitle", "role", "jobTitle"],
    "company": ["company_name", "company", "employer", "organization"],
    "location": ["location", "job_location", "city", "workplace", "place"],
    "employmentType": ["employment_type", "employment_status", "work_type", "job_type", "jobType"],
    "seniority": ["seniority_level", "seniority", "level"],
    "description": ["job_description", "description", "jd"],
    "skills": ["skills", "skill_tags", "keywords"],
    "salaryMin": ["salary_min", "min_salary", "minimum_salary"],
    "salaryMax": ["salary_max", "max_salary", "maximum_salary"],
    "currency": ["salary_currency", "currency"],
    "posted": ["date_posted", "posted_date", "listed_at", "posting_date", "date"],
    "url": ["job_url", "url", "posting_url", "application_url"],
}

def pick(row: dict, aliases):
    # Case-insensitive header search like React
    lower_map = {k.lower(): k for k in row.keys()}
    for a in aliases:
        key = lower_map.get(a.lower())
        if key is not None:
            val = row.get(key, "")
            if val is not None and str(val).strip() != "":
                return str(val)
    return ""

def to_oid(val: str):
    # Use val (deterministic) to derive a stable hex for $oid if not valid 24-hex
    h = uuid.uuid5(uuid.NAMESPACE_URL, val if val else uuid.uuid4().hex).hex
    return {"$oid": h[:24]}

def try_num(s: str):
    if s is None:
        return None
    s = s.strip()
    if s == "":
        return None
    # int
    if s.lstrip("-").isdigit():
        try:
            return int(s)
        except:
            pass
    # float
    try:
        return float(s)
    except:
        return None

def normalize_row(row: dict, idx: int):
    # Build normalized doc
    doc = {}
    doc["id"] = pick(row, ALIASES["id"]) or f"job-{idx}"
    doc["title"] = pick(row, ALIASES["title"])
    doc["company"] = pick(row, ALIASES["company"])
    doc["location"] = pick(row, ALIASES["location"])
    doc["employmentType"] = pick(row, ALIASES["employmentType"])
    doc["seniority"] = pick(row, ALIASES["seniority"])
    doc["description"] = pick(row, ALIASES["description"])
    doc["skills"] = pick(row, ALIASES["skills"])
    doc["salaryMin"] = pick(row, ALIASES["salaryMin"])
    doc["salaryMax"] = pick(row, ALIASES["salaryMax"])
    doc["currency"] = pick(row, ALIASES["currency"])
    doc["posted"] = pick(row, ALIASES["posted"])
    doc["url"] = pick(row, ALIASES["url"])
    doc["raw"] = row  # preserve original row

    # Optional numeric coercion for salary values
    if COERCE_SALARY:
        for k in ("salaryMin", "salaryMax"):
            n = try_num(doc.get(k))
            if n is not None:
                doc[k] = n

    # Produce a MongoDB-friendly _id if requested
    if GENERATE_OID:
        # If 'id' looks like a 24-hex, use as $oid; else derive a stable $oid
        val = doc["id"]
        if len(val) == 24 and all(c in "0123456789abcdefABCDEF" for c in val):
            doc["_id"] = {"$oid": val.lower()}
        else:
            doc["_id"] = to_oid(val)

    # Remove empty strings to keep documents clean
    for k in list(doc.keys()):
        if isinstance(doc[k], str) and doc[k].strip() == "":
            del doc[k]

    return doc

def main():
    if not os.path.exists(INPUT_CSV):
        raise FileNotFoundError(f"Input not found: {INPUT_CSV}")

    written = 0
    with open(INPUT_CSV, "r", newline="", encoding="utf-8") as fin, \
         open(OUTPUT_NDJSON, "w", encoding="utf-8") as fout:
        reader = csv.DictReader(fin, delimiter=DELIMITER, quotechar=QUOTECHAR)
        for idx, row in enumerate(reader):
            # Normalize keys/values
            cleaned = { (k or "").strip(): ("" if v is None else str(v)) for k, v in row.items() }
            doc = normalize_row(cleaned, idx)
            fout.write(json.dumps(doc, ensure_ascii=False) + "\n")
            written += 1

    print(f"Wrote {written} JSON documents to {OUTPUT_NDJSON}")

if __name__ == "__main__":
    main()
