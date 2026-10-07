#!/usr/bin/env python3
"""Build the encrypted roster and the shared matching link from an attendee list.

    python tools/make_links.py private/attendees.csv [--min 2] [--base https://draperfellowship.github.io/match/]

Input CSV needs `name` and `email` columns (names must be unique). With --teams, a CSV with `members`
(attendee names separated by ";") and `open` (yes/no): closed teams are left out entirely; an open team becomes
one entry named "A & B" that submits one ranking and is ranked as a unit. Writes:
  docs/match/roster.enc   encrypted roster the page decrypts (safe to commit)
  private/roster.csv      id, name, email (keep private)
  private/link.txt        the one link everyone uses; visitors pick their name on the page
  private/test_link.txt   link straight to a hidden test user (id 0): can submit, never listed, never matched
Re-running keeps existing ids and the event secret, so the shared link stays valid.
"""
import argparse, base64, csv, hashlib, json, os, secrets
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ap = argparse.ArgumentParser()
ap.add_argument("attendees")
ap.add_argument("--min", type=int, default=2, help="fewest people each attendee must rank")
ap.add_argument("--teams", help="CSV of existing teams: members (names separated by ';'), open (yes/no)")
ap.add_argument("--base", default="https://draperfellowship.github.io/match/")
args = ap.parse_args()

os.makedirs("private", exist_ok=True)
# Short secret in the link; the AES key is its SHA-256. ~64 bits is ample for a list of names.
secret_path = "private/event_secret.txt"
if os.path.exists(secret_path):
    secret = open(secret_path).read().strip()
else:
    secret = secrets.token_urlsafe(8)
    open(secret_path, "w").write(secret)
key = hashlib.sha256(secret.encode()).digest()

known = {}
if os.path.exists("private/roster.csv"):
    known = {r["email"].lower(): int(r["id"]) for r in csv.DictReader(open("private/roster.csv"))}

entries = [(r["name"].strip(), r["email"].strip().lower()) for r in csv.DictReader(open(args.attendees))]
entries = [(n, e) for n, e in entries if n and e]
if args.teams:
    email_of = dict(entries)
    for t in csv.DictReader(open(args.teams)):
        members = [m.strip() for m in t["members"].split(";") if m.strip()]
        missing = [m for m in members if m not in email_of]
        if missing:
            raise SystemExit(f"team members not in {args.attendees}: {', '.join(missing)}")
        entries = [(n, e) for n, e in entries if n not in members]
        if t["open"].strip().lower() == "yes":
            name = " & ".join([", ".join(members[:-1]), members[-1]]) if len(members) > 1 else members[0]
            entries.append((name, ";".join(email_of[m] for m in members)))

people, next_id = [], 1 + max(known.values(), default=0)
for name, email in entries:
    if email in known:
        pid = known[email]
    else:
        pid, next_id = next_id, next_id + 1
    people.append({"id": pid, "name": name, "email": email})

names = [p["name"] for p in people]
dupes = sorted({n for n in names if names.count(n) > 1})
if dupes:
    raise SystemExit(f"names must be unique (the Sheet records names): {', '.join(dupes)}")

people.append({"id": 0, "name": "Test User", "email": "test-user"})
roster = {
    "min": args.min,
    "people": [{"id": p["id"], "name": p["name"], **({"hidden": True} if p["id"] == 0 else {})} for p in people],
}
iv = secrets.token_bytes(12)
blob = iv + AESGCM(key).encrypt(iv, json.dumps(roster).encode(), None)
open("docs/match/roster.enc", "w").write(base64.b64encode(blob).decode())

with open("private/roster.csv", "w", newline="") as f:
    w = csv.DictWriter(f, ["id", "name", "email"], lineterminator="\n"); w.writeheader(); w.writerows(people)
open("private/link.txt", "w").write(f"{args.base}#{secret}\n")
open("private/test_link.txt", "w").write(f"{args.base}#{secret}/0\n")

print(f"{len(people) - 1} attendees -> docs/match/roster.enc, private/roster.csv; shared link in private/link.txt")
