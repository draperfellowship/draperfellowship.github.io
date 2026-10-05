#!/usr/bin/env python3
"""Pair founders from their rankings.

    python tools/match.py private/responses.csv

responses.csv is the Google Sheet export (Timestamp, Response). Each Response is JSON {"t": token, "c": [ids]}.
Needs private/roster.csv from make_links.py. Writes private/pairs.csv and prints a report.

Method: a pair's cost is rankA(B)^2 + rankB(A)^2, symmetric. Lists can be any length; someone left off
a list counts as rank N (the group size), which is worse than any ranked position.
Mutual first choices are locked. The rest are paired to minimise total cost (minimum-weight matching).
With an odd count, the person left over joins the pair where they add the least cost.
"""
import argparse, csv, json, sys
import networkx as nx

ap = argparse.ArgumentParser()
ap.add_argument("responses")
args = ap.parse_args()

roster = list(csv.DictReader(open("private/roster.csv")))
name = {int(r["id"]): r["name"] for r in roster}
by_token = {r["token"]: int(r["id"]) for r in roster}
ids = sorted(name)

# latest valid submission per person; rows are in time order
prefs, bad = {}, 0
for row in csv.reader(open(args.responses)):
    try:
        d = json.loads(row[-1]); me = by_token[d["t"]]
    except (ValueError, KeyError, IndexError, TypeError):
        bad += 1; continue
    seen, clean = set(), []
    for c in d.get("c", []):
        if isinstance(c, int) and c in name and c != me and c not in seen:
            seen.add(c); clean.append(c)
    prefs[me] = clean

UNRANKED = len(ids)
rank = lambda a, b: prefs.get(a, []).index(b) + 1 if b in prefs.get(a, []) else UNRANKED
cost = lambda a, b: rank(a, b) ** 2 + rank(b, a) ** 2

locked = [(a, b) for a in ids for b in ids if a < b and rank(a, b) == 1 and rank(b, a) == 1]
taken = {p for pair in locked for p in pair}
rest = [p for p in ids if p not in taken]

G = nx.Graph()
G.add_weighted_edges_from((a, b, cost(a, b)) for i, a in enumerate(rest) for b in rest[i + 1:])
groups = [list(p) for p in locked] + [sorted(p) for p in nx.min_weight_matching(G)]

left = [p for p in ids if p not in {q for g in groups for q in g}]
for p in left:  # at most one, when the count is odd
    best = min((g for g in groups if len(g) == 2), key=lambda g: sum(cost(p, q) for q in g))
    best.append(p)

partner = {p: [q for q in g if q != p] for g in groups for p in g}
worst = lambda p: max(rank(p, q) for q in partner[p])
blocking = [(a, b) for i, a in enumerate(ids) for b in ids[i + 1:]
            if b not in partner[a] and rank(a, b) < worst(a) and rank(b, a) < worst(b)]

label = lambda r: "unranked" if r == UNRANKED else f"#{r}"
groups.sort(key=lambda g: sum(cost(a, b) for i, a in enumerate(g) for b in g[i + 1:]))
with open("private/pairs.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["members", "detail", "cost"])
    for g in groups:
        detail = "; ".join(f"{name[a]} ranked {name[b]} {label(rank(a, b))}" for a in g for b in g if a != b)
        total = sum(cost(a, b) for i, a in enumerate(g) for b in g[i + 1:])
        w.writerow([" + ".join(name[p] for p in g), detail, total])
        print(f"{' + '.join(name[p] for p in g):45s} cost {total:3d}   {detail}")

got_top3 = sum(1 for p in ids if p in prefs and min(rank(p, q) for q in partner[p]) <= 3)
print(f"\n{len(ids)} people, {len(prefs)} submitted, {bad} unreadable rows, {len(locked)} mutual-first pairs locked")
print(f"{got_top3} of {len(prefs)} submitters are with one of their top 3")
print("no submission:", ", ".join(name[p] for p in ids if p not in prefs) or "none")
print("pairs who would both rather be together (review by hand):",
      "; ".join(f"{name[a]} & {name[b]}" for a, b in blocking) or "none")
