#!/usr/bin/env python3
"""Build personal matching links from an attendee list.

    python tools/make_links.py private/attendees.csv [--k 5] [--base https://draperfellowship.github.io/match/]

Input CSV needs `name` and `email` columns. Writes:
  docs/match/roster.enc   encrypted roster the page decrypts (safe to commit)
  private/roster.csv      id, name, email, token (keep private)
  private/links.csv       name, email, link (for the mail merge)
Re-running keeps existing tokens and the event key, so links already sent stay valid.
"""
import argparse, base64, csv, hashlib, json, os, secrets
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ap = argparse.ArgumentParser()
ap.add_argument("attendees")
ap.add_argument("--k", type=int, default=5)
ap.add_argument("--base", default="https://draperfellowship.github.io/match/")
args = ap.parse_args()

b64 = lambda b: base64.urlsafe_b64encode(b).decode().rstrip("=")

os.makedirs("private", exist_ok=True)
key_path = "private/event_key.txt"
if os.path.exists(key_path):
    key = base64.urlsafe_b64decode(open(key_path).read().strip() + "==")
else:
    key = secrets.token_bytes(32)
    open(key_path, "w").write(b64(key))

known = {}
if os.path.exists("private/roster.csv"):
    known = {r["email"].lower(): r for r in csv.DictReader(open("private/roster.csv"))}

people, next_id = [], 1 + max([int(r["id"]) for r in known.values()], default=0)
for row in csv.DictReader(open(args.attendees)):
    name, email = row["name"].strip(), row["email"].strip().lower()
    if not name or not email:
        continue
    if email in known:
        pid, token = int(known[email]["id"]), known[email]["token"]
    else:
        pid, token, next_id = next_id, secrets.token_urlsafe(12), next_id + 1
    people.append({"id": pid, "name": name, "email": email, "token": token})

roster = {
    "k": args.k,
    "people": [{"id": p["id"], "name": p["name"]} for p in people],
    "who": {hashlib.sha256(p["token"].encode()).hexdigest(): p["id"] for p in people},
}
iv = secrets.token_bytes(12)
blob = iv + AESGCM(key).encrypt(iv, json.dumps(roster).encode(), None)
open("docs/match/roster.enc", "w").write(base64.b64encode(blob).decode())

with open("private/roster.csv", "w", newline="") as f:
    w = csv.DictWriter(f, ["id", "name", "email", "token"]); w.writeheader(); w.writerows(people)
with open("private/links.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["name", "email", "link"])
    for p in people:
        w.writerow([p["name"], p["email"], f"{args.base}#{b64(key)}.{p['token']}"])

print(f"{len(people)} attendees -> docs/match/roster.enc, private/roster.csv, private/links.csv")
