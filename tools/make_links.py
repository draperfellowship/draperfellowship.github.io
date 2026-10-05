#!/usr/bin/env python3
"""Build personal matching links from an attendee list.

    python tools/make_links.py private/attendees.csv [--min 5] [--base https://draperfellowship.github.io/match/]

Input CSV needs `name` and `email` columns. Writes:
  docs/match/roster.enc   encrypted roster the page decrypts (safe to commit)
  private/roster.csv      id, name, email, token (keep private)
  private/links.csv       name, email, link (for the mail merge)
  private/test_link.txt   link for a hidden test user (id 0): can submit, never listed, never matched
Re-running keeps existing tokens and the event secret, so links already sent stay valid.
"""
import argparse, base64, csv, hashlib, json, os, secrets
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ap = argparse.ArgumentParser()
ap.add_argument("attendees")
ap.add_argument("--min", type=int, default=5, help="fewest people each attendee must rank")
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
    known = {r["email"].lower(): r for r in csv.DictReader(open("private/roster.csv"))}

TEST = "test-user"
test_token = known[TEST]["token"] if TEST in known else secrets.token_urlsafe(6)
people, next_id = [], 1 + max([int(r["id"]) for r in known.values()], default=0)
for row in csv.DictReader(open(args.attendees)):
    name, email = row["name"].strip(), row["email"].strip().lower()
    if not name or not email:
        continue
    if email in known:
        pid, token = int(known[email]["id"]), known[email]["token"]
    else:
        pid, token, next_id = next_id, secrets.token_urlsafe(6), next_id + 1
    people.append({"id": pid, "name": name, "email": email, "token": token})

people.append({"id": 0, "name": "Test User", "email": TEST, "token": test_token})
roster = {
    "min": args.min,
    "people": [{"id": p["id"], "name": p["name"], **({"hidden": True} if p["id"] == 0 else {})} for p in people],
    "who": {hashlib.sha256(p["token"].encode()).hexdigest(): p["id"] for p in people},
}
iv = secrets.token_bytes(12)
blob = iv + AESGCM(key).encrypt(iv, json.dumps(roster).encode(), None)
open("docs/match/roster.enc", "w").write(base64.b64encode(blob).decode())

with open("private/roster.csv", "w", newline="") as f:
    w = csv.DictWriter(f, ["id", "name", "email", "token"], lineterminator="\n"); w.writeheader(); w.writerows(people)
with open("private/links.csv", "w", newline="") as f:
    w = csv.writer(f, lineterminator="\n"); w.writerow(["name", "email", "link"])
    for p in people:
        if p["id"]:
            w.writerow([p["name"], p["email"], f"{args.base}#{secret}.{p['token']}"])
open("private/test_link.txt", "w").write(f"{args.base}#{secret}.{test_token}\n")

print(f"{len(people) - 1} attendees -> docs/match/roster.enc, private/roster.csv, private/links.csv")
