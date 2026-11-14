"""
golden_ext.py - golden cases 8 and 9 (called from make_golden.py).

  golden_08  monthly values -> yearly series: season construction, missing-month rules, period edges,
             and the min-length / coverage gate (METHODS s2, s3, s4).
  golden_09  Benjamini-Hochberg FDR across regions + the Mirror rule (METHODS s13, s14).
"""
import csv
import json
import os

import numpy as np
from scipy import stats

ALPHA = 0.05

# ============================================================================
# Golden 8: monthly -> yearly
# ============================================================================
SEASONS = {"ANN": list(range(1, 13)), "DJF": [12, 1, 2], "MAM": [3, 4, 5], "JJA": [6, 7, 8],
           "SON": [9, 10, 11], "NDJF": [11, 12, 1, 2], "JA": [7, 8]}
MISSING = [(2003, 6), (2005, 12), (2008, 7), (2010, 1), (2010, 2), (2010, 3), (2012, 11)]
DATA_FIRST, DATA_LAST = 2000, 2013          # data extend one year beyond the period on both sides
PERIOD = (2001, 2012)                       # inclusive; the engine must NOT use data outside it
MIN_VALID_YEARS, MIN_VALID_FRACTION = 10, 0.8


def make_monthly(seed=2026):
    rng = np.random.default_rng(seed)
    rows = []
    for yr in range(DATA_FIRST, DATA_LAST + 1):
        for m in range(1, 13):
            v = 10 + 8 * np.sin(2 * np.pi * (m - 4) / 12) + 0.03 * ((yr - DATA_FIRST) * 12 + m) / 12 + rng.normal(0, 0.5)
            rows.append((yr, m, None if (yr, m) in MISSING else round(float(v), 6)))
    return rows


def label_pairs(months, label_year):
    """(year, month) pairs of the season labelled `label_year`. A season whose month list wraps the
    new year (e.g. [12,1,2]) is labelled by the year of its LAST month; months before the wrap belong to year-1."""
    wrap_at = next((i + 1 for i in range(len(months) - 1) if months[i + 1] < months[i]), None)
    return [((label_year - 1) if (wrap_at is not None and i < wrap_at) else label_year, m)
            for i, m in enumerate(months)]


def aggregate(monthly, name, months, period):
    start, end = period
    inside = lambda yr: start <= yr <= end
    years, dropped = [], []
    for label in range(start, end + 2):
        pairs = label_pairs(months, label)
        n_inside = sum(inside(yr) for yr, _ in pairs)
        if n_inside == 0:
            continue                                   # label entirely outside the period: not reported
        if n_inside < len(pairs):
            dropped.append(label)                      # partly outside the period: season dropped (s4)
            continue
        vals = [monthly.get(p) for p in pairs]
        present = [v for v in vals if v is not None]
        need = 10 if name == "ANN" else len(months)    # annual: >=10 of 12; seasons/custom: all months (s3, Decision)
        ok = len(present) >= need
        years.append(dict(year=label, value=(float(np.mean(present)) if ok else None),
                          months_present=len(present), months_required=need,
                          status="valid" if ok else "insufficient_months"))
    n_valid = sum(1 for y in years if y["status"] == "valid")
    total = len(years)
    frac = n_valid / total if total else 0.0
    if n_valid < MIN_VALID_YEARS:
        gate = f"too_short: fewer than {MIN_VALID_YEARS} valid yearly values"
    elif frac < MIN_VALID_FRACTION:
        gate = f"too_short: fewer than {int(MIN_VALID_FRACTION * 100)}% of years valid"
    else:
        gate = "ok"
    return dict(months=months, label_rule=("year of the last month (wrapping seasons)" if label_pairs(months, 2000)[0][0] == 1999
                                           else "calendar year"),
                years_total=total, years=years, n_valid=n_valid, valid_fraction=frac,
                dropped_partly_outside_period=dropped, gate=gate)


def build_golden_08(out, here):
    rows = make_monthly()
    path = os.path.join(here, "golden_08_monthly.csv")
    with open(path, "w", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["date", "value"])
        for yr, m, v in rows:
            w.writerow([f"{yr}-{m:02d}", "" if v is None else f"{v:.6f}"])
    monthly = {}
    with open(path) as f:
        for r in csv.DictReader(f):
            yr, m = map(int, r["date"].split("-"))
            monthly[(yr, m)] = float(r["value"]) if r["value"] != "" else None
    seasons = {name: aggregate(monthly, name, months, PERIOD) for name, months in SEASONS.items()}

    # Independent sanity assertions of hand-derived expectations
    assert seasons["ANN"]["n_valid"] == 11 and seasons["ANN"]["gate"] == "ok"
    assert seasons["DJF"]["dropped_partly_outside_period"] == [2001, 2013]
    assert seasons["DJF"]["years_total"] == 11 and seasons["DJF"]["n_valid"] == 9 and seasons["DJF"]["gate"].startswith("too_short")
    assert seasons["JJA"]["n_valid"] == 10 and seasons["JJA"]["gate"] == "ok"
    assert seasons["MAM"]["n_valid"] == 11 and seasons["SON"]["n_valid"] == 11
    assert seasons["NDJF"]["n_valid"] == 9 and seasons["NDJF"]["gate"].startswith("too_short")
    assert seasons["JA"]["n_valid"] == 11

    out["cases"]["golden_08_monthly_to_yearly"] = dict(
        file="golden_08_monthly.csv",
        kind="monthly series 2000-01..2013-12 with 7 missing months; period 2001-2012",
        purpose=("Season construction and missing-data rules. Checks: DJF labelled by January's year; wrapping custom "
                 "season NDJF; seasons partly outside the period are dropped (data outside the period must NOT be "
                 "used even though the file contains it); seasons need ALL their months, annual needs >=10 of 12; "
                 "the gate (>=10 valid yearly values and >=80% valid) - DJF and NDJF fail on count (9 < 10) while "
                 "JJA passes with exactly 10."),
        generator=dict(seed=2026, model="10 + 8*sin(2*pi*(m-4)/12) + 0.03*t_years + N(0, 0.5)", missing=MISSING),
        expected=dict(period=dict(start_year=PERIOD[0], end_year=PERIOD[1]),
                      rules=dict(season_months_required="all", annual_months_required=10,
                                 value="mean of the present months", min_valid_years=MIN_VALID_YEARS,
                                 min_valid_fraction=MIN_VALID_FRACTION,
                                 denominator="seasons fully inside the period (dropped seasons are not counted)"),
                      seasons=seasons))
    print("golden_08_monthly_to_yearly: n_valid " + ", ".join(f"{k}={v['n_valid']}/{v['years_total']} ({v['gate']})" for k, v in seasons.items()))


# ============================================================================
# Golden 9: BH-FDR + Mirror
# ============================================================================
# (id, type, sign, raw p-value or None if the variable is invalid there)
REGIONS = [
    ("CTY-A", "country", +1, 0.0001), ("CTY-B", "country", -1, 0.0004), ("CTY-C", "country", +1, 0.0100),
    ("CTY-D", "country", -1, 0.0230), ("CTY-E", "country", -1, 0.0330), ("CTY-F", "country", -1, 0.0410),
    ("CTY-G", "country", +1, 0.0150), ("CTY-H", "country", -1, 0.3500), ("CTY-I", "country", +1, 0.0185),
    ("CTY-J", "country", +1, None),
    ("NR-1", "named", +1, 0.0009), ("NR-2", "named", -1, 0.0030), ("NR-3", "named", -1, 0.0270),
    ("NR-4", "named", -1, 0.0480), ("NR-5", "named", +1, 0.4500), ("NR-6", "named", -1, None),
    ("OCN-1", "ocean", +1, 0.6000), ("OCN-2", "ocean", -1, 0.8500),
]
CONTAINS = [("NR-1", "NR-3")]          # NR-1 contains NR-3 (same type: excluded from each other's mirrors)
Q = 0.05
SCENARIOS = ["CTY-B", "NR-1", "CTY-A", "OCN-1", "CTY-E", "NR-2"]


def bh(pvals, q):
    """Benjamini-Hochberg step-up. Returns (reject list, adjusted p list) in input order; None stays None."""
    idx = [i for i, p in enumerate(pvals) if p is not None]
    m = len(idx)
    order = sorted(idx, key=lambda i: pvals[i])
    k_max = 0
    for rank, i in enumerate(order, start=1):
        if pvals[i] <= rank / m * q:
            k_max = rank
    reject = [None] * len(pvals)
    adj = [None] * len(pvals)
    running = 1.0
    for rank in range(m, 0, -1):                       # monotone adjusted p-values
        i = order[rank - 1]
        running = min(running, pvals[i] * m / rank)
        adj[i] = running
        reject[i] = rank <= k_max
    return reject, adj, m, k_max


def mirrors(case_id, regions, contains, top=3):
    by_id = {r["id"]: r for r in regions}
    c = by_id[case_id]
    if c["p_verdict"] is None or not c["bh_significant"]:
        return dict(case_region=case_id, mirrors=[], none_found=True, reason="case_region_not_significant_after_BH")
    related = {b for a, b in contains if a == case_id} | {a for a, b in contains if b == case_id}
    cands = [r for r in regions
             if r["id"] != case_id and r["type"] == c["type"] and r["id"] not in related
             and r["p_verdict"] is not None and r["bh_significant"] and np.sign(r["slope_per_decade"]) == -np.sign(c["slope_per_decade"])]
    cands.sort(key=lambda r: -abs(r["z_mk"]))
    top_c = cands[:top]
    return dict(case_region=case_id,
                mirrors=[dict(region=r["id"], slope_per_decade=r["slope_per_decade"], p=r["p_verdict"], z=r["z_mk"]) for r in top_c],
                none_found=not top_c, reason=None if top_c else "no_qualifying_region",
                n_qualifying_before_top3=len(cands))


def build_golden_09(out, here):
    pvals = [r[3] for r in REGIONS]
    reject, adj, m, k_max = bh(pvals, Q)

    # independent check against statsmodels
    from statsmodels.stats.multitest import multipletests
    valid_idx = [i for i, p in enumerate(pvals) if p is not None]
    rej_sm, adj_sm, _, _ = multipletests([pvals[i] for i in valid_idx], alpha=Q, method="fdr_bh")
    for j, i in enumerate(valid_idx):
        assert reject[i] == bool(rej_sm[j]), f"BH reject mismatch at {REGIONS[i][0]}"
        assert np.isclose(adj[i], adj_sm[j], rtol=1e-12), f"BH adjusted p mismatch at {REGIONS[i][0]}"

    regions = []
    for (rid, typ, sign, p), rj, aj in zip(REGIONS, reject, adj):
        z = None if p is None else float(sign * stats.norm.isf(p / 2))
        regions.append(dict(id=rid, type=typ, p_verdict=p, z_mk=z,
                            slope_per_decade=None if p is None else round(sign * 0.02 * abs(z), 4),
                            raw_significant=None if p is None else bool(p < ALPHA)))
    inputs = dict(q=Q, contains=[list(c) for c in CONTAINS], regions=[dict(r) for r in regions])
    with open(os.path.join(here, "golden_09_regions.json"), "w") as f:
        json.dump(inputs, f, indent=2)

    for r, rj, aj in zip(regions, reject, adj):
        r["bh_significant"] = rj
        r["bh_adjusted_p"] = aj
    scen = [mirrors(cid, regions, CONTAINS) for cid in SCENARIOS]

    # Independent hand-derived expectations
    got = {s["case_region"]: [x["region"] for x in s["mirrors"]] for s in scen}
    assert m == 16 and k_max == 9
    assert got["CTY-B"] == ["CTY-A", "CTY-C", "CTY-G"]          # 4 qualify (A,C,G,I): top-3 truncation
    assert got["NR-1"] == ["NR-2"]                              # NR-3 excluded: contained in NR-1; NR-4 fails BH
    assert got["CTY-A"] == ["CTY-B", "CTY-D"]                   # CTY-E/F raw-significant but fail BH
    assert got["OCN-1"] == [] and got["CTY-E"] == [] and got["NR-2"] == ["NR-1"]
    by = {s["case_region"]: s for s in scen}
    assert by["CTY-B"]["n_qualifying_before_top3"] == 4
    assert by["OCN-1"]["reason"] == "case_region_not_significant_after_BH"
    assert by["CTY-E"]["reason"] == "case_region_not_significant_after_BH"

    out["cases"]["golden_09_fdr_mirror"] = dict(
        file="golden_09_regions.json",
        kind="18 regions (16 valid, 2 without data), 3 region types, one containment pair",
        purpose=("Benjamini-Hochberg FDR across all valid regions (q = 0.05) and the Mirror rule. Checks: invalid regions "
                 "excluded from m; regions with raw p < 0.05 that FAIL BH are not 'significant' (and cannot be a mirror, "
                 "nor have one); same-type only; a region contained in the case region is excluded; opposite sign; "
                 "ranked by |z|; top 3; 'none found' when the case region itself fails BH."),
        generator=dict(note="hand-designed table; p-values are verdict p-values (Option B)"),
        expected=dict(m_valid=m, k_max=k_max, bh_rejected=[r["id"] for r in regions if r["bh_significant"]],
                      raw_significant_but_not_bh=[r["id"] for r in regions if r["raw_significant"] and not r["bh_significant"]],
                      per_region={r["id"]: dict(bh_significant=r["bh_significant"], bh_adjusted_p=r["bh_adjusted_p"]) for r in regions},
                      mirror_scenarios=scen))
    print(f"golden_09_fdr_mirror: m={m} k_max={k_max} " + "; ".join(f"{k}->{v}" for k, v in got.items()))


def build(out, here):
    build_golden_08(out, here)
    build_golden_09(out, here)
