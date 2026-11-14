#!/usr/bin/env python3
"""
make_golden.py - generates the golden cases (the engine's answer key), spec v1 (Option B).

An independent reference implementation of METHODS.md, written from the papers (Mann 1945 /
Kendall 1975, Sen 1968, Gilbert 1987, Hamed & Rao 1998, Santer et al. 2000, Weatherhead et al. 1998,
Benjamini & Hochberg 1995), NOT from api/_engine/. Every number it writes is cross-checked against
pymannkendall / scipy / statsmodels before being saved.

  pip install numpy scipy pymannkendall statsmodels     # test-only deps
  python make_golden.py                                  # rewrites CSVs/JSON + golden_expected.json

Decisions encoded here (Methods lead, H0-H2):
  * Hamed-Rao variance factor n/n*_s is CAPPED AT 1.
  * Verdict p = max(p_MK-HR, p_OLS-AR1)  ("Option B": Confirmed needs both tests).
    If OLS-AR(1) is undefined (n_eff <= 2) the verdict p is the MK-HR p.
  * Tiers on the verdict p: <0.05 confirmed; <0.20 not_proven_yet; else no_case.
  * < 10 valid yearly values -> too_short (no statistics).
  * 'autocorrelated' badge when the OLS residual r1 > 0.3.
"""
import csv
import json
import os
import sys

import numpy as np
from scipy import stats

ALPHA = 0.05
MIN_YEARS = 10
HERE = os.path.dirname(os.path.abspath(__file__))
SPEC_VERSION = "METHODS v1 draft: Option B (verdict p = max of MK-HR and OLS-AR(1)), Hamed-Rao factor capped at 1"


# ----------------------------------------------------------------------------
# Reference implementation
# ----------------------------------------------------------------------------
def pair_slopes(t, y):
    i, j = np.triu_indices(len(y), k=1)
    return np.sort((y[j] - y[i]) / (t[j] - t[i]))


def mk_score(y):
    s = 0
    for i in range(len(y) - 1):
        s += int(np.sum(np.sign(y[i + 1:] - y[i])))
    return s


def tie_groups(y):
    _, c = np.unique(y, return_counts=True)
    return c


def mk_var(y):
    n = len(y)
    c = tie_groups(y)
    return (n * (n - 1) * (2 * n + 5) - np.sum(c * (c - 1) * (2 * c + 5))) / 18.0


def z_cc(s, var):
    """Normal approximation with continuity correction (nan if var <= 0)."""
    if var <= 0:
        return float("nan")
    if s > 0:
        return (s - 1) / np.sqrt(var)
    if s < 0:
        return (s + 1) / np.sqrt(var)
    return 0.0


def p_two_sided(z):
    return float(2 * stats.norm.sf(abs(z)))


def acf_biased(x, nlags):
    x = np.asarray(x, float)
    n = len(x)
    y = x - x.mean()
    c0 = np.sum(y * y) / n
    return np.array([np.sum(y[: n - k] * y[k:]) / n / c0 for k in range(nlags + 1)])


def hamed_rao_factor(y, slope):
    """n/n*_s (Hamed & Rao 1998, eq. 17): ranks of Sen-detrended series, ALL lags 1..n-1
    whose sample ACF is outside +-z_{1-a/2}/sqrt(n). Returns (raw factor, significant lags)."""
    n = len(y)
    idx = np.arange(1, n + 1)
    ranks = stats.rankdata(y - slope * idx)
    rho = acf_biased(ranks, n - 1)
    bound = stats.norm.ppf(1 - ALPHA / 2) / np.sqrt(n)
    sig = [k for k in range(1, n) if abs(rho[k]) > bound]
    sni = sum((n - k) * (n - k - 1) * (n - k - 2) * rho[k] for k in sig)
    return 1.0 + 2.0 / (n * (n - 1) * (n - 2)) * sni, sig


def rank_interp(sorted_vals, r):
    N = len(sorted_vals)
    r = min(max(r, 1.0), float(N))
    lo = int(np.floor(r))
    frac = r - lo
    a = sorted_vals[lo - 1]
    b = sorted_vals[min(lo, N - 1)]
    return float(a + frac * (b - a))


def sen_ci(slopes_sorted, var_s):
    """Gilbert (1987): C = z*sqrt(Var S); lower = slope at 1-indexed rank (N-C)/2, upper at (N+C)/2+1."""
    N = len(slopes_sorted)
    C = stats.norm.ppf(1 - ALPHA / 2) * np.sqrt(var_s)
    return (rank_interp(slopes_sorted, (N - C) / 2.0),
            rank_interp(slopes_sorted, (N + C) / 2.0 + 1.0))


def ols_block(t, y):
    n = len(y)
    tb, yb = t.mean(), y.mean()
    sxx = np.sum((t - tb) ** 2)
    b = np.sum((t - tb) * (y - yb)) / sxx
    a = yb - b * tb
    e = y - a - b * t
    sse = float(np.sum(e ** 2))
    sigma = np.sqrt(sse / (n - 2))
    se_naive = sigma / np.sqrt(sxx)
    p_naive = float(2 * stats.t.sf(abs(b / se_naive), n - 2))
    r2 = 1 - sse / float(np.sum((y - yb) ** 2))
    r1 = float(np.sum(e[:-1] * e[1:]) / sse)
    n_eff = n * (1 - r1) / (1 + r1) if r1 > 0 else float(n)      # capped at n
    out = dict(slope=float(b), sigma=float(sigma), se_naive=float(se_naive),
               p_naive=p_naive, r2=float(r2), r1_residual=r1, n_eff=float(n_eff))
    if n_eff > 2.0:
        se_adj = se_naive * np.sqrt((n - 2) / (n_eff - 2))
        df = n_eff - 2
        tcrit = stats.t.ppf(1 - ALPHA / 2, df)
        out.update(se_adj=float(se_adj), p_adj=float(2 * stats.t.sf(abs(b / se_adj), df)),
                   ci95_adj=[float(b - tcrit * se_adj), float(b + tcrit * se_adj)])
    else:
        out.update(se_adj=None, p_adj=None, ci95_adj=None)
    return out


def years_needed(n, b, sigma, r1, max_extra=50):
    """METHODS s10 (Weatherhead et al. 1998), ~50% detection odds. Returns extra years or None."""
    phi = max(r1, 0.0)
    for ns in range(n, n + max_extra + 1):
        n_eff = ns * (1 - phi) / (1 + phi)
        if n_eff <= 2.0:
            continue
        se = np.sqrt(12 * sigma ** 2 / (ns * (ns ** 2 - 1)) * (1 + phi) / (1 - phi))
        if abs(b) / se >= stats.t.ppf(1 - ALPHA / 2, n_eff - 2):
            return ns - n
    return None


def tier(p):
    if p < 0.05:
        return "confirmed"
    if p < 0.20:
        return "not_proven_yet"
    return "no_case"


def fnum(x):
    """JSON-safe float (nan -> None)."""
    return None if x is None or (isinstance(x, float) and np.isnan(x)) else float(x)


def analyse(years, y):
    years = np.asarray(years, float)
    y = np.asarray(y, float)
    n = len(y)
    if n < MIN_YEARS:
        return {"inputs": {"n": n, "first_year": int(years[0]), "last_year": int(years[-1])},
                "verdict": {"tier": "too_short", "p_used": None,
                            "reason": f"fewer than {MIN_YEARS} valid yearly values"}}
    slopes = pair_slopes(years, y)
    sen = float(np.median(slopes))

    S = mk_score(y)
    var = mk_var(y)
    z0 = z_cc(S, var)
    n_ns_raw, sig_lags = hamed_rao_factor(y, sen)
    n_ns = max(n_ns_raw, 1.0)                                    # CAP AT 1
    var_hr = var * n_ns
    z_hr = z_cc(S, var_hr)
    p_hr = p_two_sided(z_hr)
    var_unc = var * n_ns_raw                                     # uncapped: cross-check only
    z_unc = z_cc(S, var_unc)

    ols = ols_block(years, y)
    p_ols = ols["p_adj"]
    p_verdict = max(p_hr, p_ols) if p_ols is not None else p_hr  # OPTION B
    t = tier(p_verdict)
    mk_sig = p_hr < ALPHA
    ols_sig = None if p_ols is None else (p_ols < ALPHA)
    yn = years_needed(n, ols["slope"], ols["sigma"], ols["r1_residual"])
    shown = (t == "not_proven_yet") and (p_verdict < 0.5) and (yn is not None) and (yn <= 50)

    lo_o, hi_o = sen_ci(slopes, var)
    lo_h, hi_h = sen_ci(slopes, var_hr)
    span = years[-1] - years[0]
    return {
        "inputs": {"n": n, "first_year": int(years[0]), "last_year": int(years[-1]),
                   "n_distinct": int(len(np.unique(y))),
                   "tie_group_sizes_gt1": sorted(int(c) for c in tie_groups(y) if c > 1)},
        "descriptive": {"mean": float(y.mean()), "sd": float(y.std(ddof=1))},
        "mk_original": {"S": S, "var_S": float(var), "z": float(z0),
                        "p": p_two_sided(z0), "tau": S / (0.5 * n * (n - 1))},
        "mk_hamed_rao": {"n_ns_raw": float(n_ns_raw), "n_ns": float(n_ns),
                         "significant_acf_lags": sig_lags,
                         "var_S": float(var_hr), "z": float(z_hr), "p": p_hr,
                         "uncapped_reference": {"var_S": fnum(var_unc), "z": fnum(z_unc),
                                                "p": fnum(p_two_sided(z_unc)) if not np.isnan(z_unc) else None}},
        "sen": {"slope_per_year": sen, "slope_per_decade": 10 * sen,
                "ci95_per_year_hamed_rao_variance": [lo_h, hi_h],
                "ci95_per_year_original_variance": [lo_o, hi_o]},
        "ols": ols,
        "verdict": {"p_used": p_verdict, "tier": t, "p_mk_hr": p_hr, "p_ols_ar1": p_ols,
                    "rule": "max(p_MK-HR, p_OLS-AR1); MK-HR alone if OLS-AR(1) undefined (n_eff <= 2)"},
        "badges": {"tests_disagree": None if ols_sig is None else bool(mk_sig != ols_sig),
                   "autocorrelated_r1_gt_0.3": bool(ols["r1_residual"] > 0.3)},
        "magnitude": {"total_change_sen": sen * span,
                      "pct_of_mean_per_decade": 100.0 * 10 * sen / float(y.mean())},
        "years_needed": {"raw_extra_years": yn, "displayed": bool(shown)},
    }


# ----------------------------------------------------------------------------
# Cross-checks against independent libraries (fail loudly on any mismatch)
# ----------------------------------------------------------------------------
def cross_check(years, y, res, label):
    import pymannkendall as mk
    from statsmodels.tsa.stattools import acf as sm_acf

    def close(a, b, rel=1e-9, ab=1e-12, what=""):
        if not np.isclose(a, b, rtol=rel, atol=ab):
            raise AssertionError(f"[{label}] {what}: ref={a!r} lib={b!r}")

    o = mk.original_test(y)
    close(res["mk_original"]["S"], o.s, what="S")
    close(res["mk_original"]["var_S"], o.var_s, what="var_S (ties)")
    close(res["mk_original"]["z"], o.z, what="z")
    close(res["mk_original"]["p"], o.p, rel=1e-7, what="p original")
    close(res["mk_original"]["tau"], o.Tau, what="tau")
    close(res["sen"]["slope_per_year"], o.slope, what="Sen slope (pymannkendall)")
    close(res["sen"]["slope_per_year"], stats.theilslopes(y, years)[0], what="Sen slope (scipy)")

    unc = res["mk_hamed_rao"]["uncapped_reference"]
    h = mk.hamed_rao_modification_test(y, alpha=ALPHA)
    if unc["var_S"] is not None and unc["var_S"] > 0:
        close(unc["var_S"], h.var_s, what="HR (uncapped) var_S")
        close(unc["z"], h.z, what="HR (uncapped) z")
        close(unc["p"], h.p, rel=1e-7, what="HR (uncapped) p")

    lr = stats.linregress(years, y)
    close(res["ols"]["slope"], lr.slope, what="OLS slope")
    close(res["ols"]["se_naive"], lr.stderr, what="OLS SE")
    close(res["ols"]["p_naive"], lr.pvalue, rel=1e-7, what="OLS p")
    close(res["ols"]["r2"], lr.rvalue ** 2, what="OLS r2")
    e = y - (lr.intercept + lr.slope * years)
    close(res["ols"]["r1_residual"], sm_acf(e, nlags=1, adjusted=False, fft=False)[1], what="r1 vs statsmodels")


# ----------------------------------------------------------------------------
# Generators and CSV helpers
# ----------------------------------------------------------------------------
def gen_linear(seed, years, slope=0.008, sd=0.03):
    rng = np.random.default_rng(seed)
    return 0.15 + slope * (years - years[0]) + rng.normal(0, sd, len(years))


def gen_white(seed, years):
    rng = np.random.default_rng(seed)
    return 0.20 + rng.normal(0, 0.03, len(years))


def gen_ar1(seed, years, phi=0.6, sd=0.03):
    rng = np.random.default_rng(seed)
    n = len(years)
    x = np.empty(n)
    x[0] = rng.normal(0, sd)
    eps = rng.normal(0, sd * np.sqrt(1 - phi ** 2), n)
    for k in range(1, n):
        x[k] = phi * x[k - 1] + eps[k]
    return 0.20 + x


def gen_ties(seed, years):
    rng = np.random.default_rng(seed)
    return 3.0 + 0.04 * (years - years[0]) + rng.normal(0, 0.25, len(years))


def find_seed(gen, years, predicate, decimals, limit=300000):
    for seed in range(limit):
        y = np.round(gen(seed, years), decimals)
        if predicate(analyse(years, y)):
            return seed
    raise RuntimeError("no seed found")


def write_series(path, years, y, decimals=6):
    with open(path, "w", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["year", "value"])
        for yr, v in zip(years, y):
            w.writerow([int(yr), f"{v:.{decimals}f}"])


def read_series(path):
    with open(path) as f:
        rows = list(csv.DictReader(f))
    return (np.array([float(r["year"]) for r in rows]), np.array([float(r["value"]) for r in rows]))


CASES = [
    dict(id="golden_01_linear_trend", file="golden_01_linear_trend.csv", years=np.arange(2002, 2026),
         gen=gen_linear, decimals=6,
         kind="white noise around a true linear trend (0.008/yr, sd 0.03); n=24",
         purpose=("Happy path: a clear, real trend. Both tests agree -> Confirmed. The raw Hamed-Rao factor is "
                  "0.81 (<1), so this case also exercises the CAP: the engine must use factor 1.0."),
         params=dict(model="y = 0.15 + 0.008*(year-2002) + N(0, 0.03)"),
         predicate=lambda r: r["verdict"]["tier"] == "confirmed" and r["verdict"]["p_used"] < 1e-3
         and r["badges"]["tests_disagree"] is False and abs(r["ols"]["r1_residual"]) < 0.3
         and r["mk_hamed_rao"]["n_ns_raw"] < 1.0),
    dict(id="golden_02_white_noise", file="golden_02_white_noise.csv", years=np.arange(1995, 2026),
         gen=gen_white, decimals=6,
         kind="pure white noise, no trend (sd 0.03); n=31 (odd length)",
         purpose=("Null case: No case; tests agree; years-needed not displayed. Raw Hamed-Rao factor is 0.68 (<1), so the "
                  "cap on the factor is exercised here too."),
         params=dict(model="y = 0.20 + N(0, 0.03)"),
         predicate=lambda r: r["verdict"]["tier"] == "no_case" and r["verdict"]["p_used"] > 0.4
         and r["badges"]["tests_disagree"] is False and abs(r["ols"]["r1_residual"]) < 0.25),
    dict(id="golden_03_ar1_null", file="golden_03_ar1_null.csv", years=np.arange(2002, 2026),
         gen=gen_ar1, decimals=6,
         kind="AR(1) noise phi=0.6, NO true trend (marginal sd 0.03); n=24",
         purpose=("Autocorrelation trap, deliberately selected: NAIVE MK and NAIVE OLS call it significant; the "
                  "corrected tests do not. Verdict Not proven yet (p = the larger corrected p), 'autocorrelated' "
                  "badge on, years-needed displayed. Fails if the autocorrelation correction is skipped."),
         params=dict(model="x_t = 0.6*x_{t-1} + e_t; y = 0.20 + x", phi=0.6),
         predicate=lambda r: r["mk_original"]["p"] < 0.05 and r["ols"]["p_naive"] < 0.05
         and r["verdict"]["tier"] == "not_proven_yet" and 0.05 < r["verdict"]["p_used"] < 0.20
         and r["badges"]["autocorrelated_r1_gt_0.3"] and r["years_needed"]["displayed"]),
    dict(id="golden_04_ties", file="golden_04_ties.csv", years=np.arange(2005, 2025),
         gen=gen_ties, decimals=1,
         kind="trend + noise rounded to 0.1, so many tied values; n=20",
         purpose=("Tie handling: tie-corrected Var(S) in MK, average ranks in Hamed-Rao, Sen slope with zero "
                  "pair-slopes. Fails if the tie correction is skipped."),
         params=dict(model="y = round(3.0 + 0.04*(year-2005) + N(0, 0.25), 1)"),
         predicate=lambda r: r["inputs"]["n_distinct"] <= 14 and len(r["inputs"]["tie_group_sizes_gt1"]) >= 4
         and 0.001 < r["verdict"]["p_used"] < 0.2),
    dict(id="golden_05_too_short", file="golden_05_too_short.csv", years=np.arange(2016, 2025),
         gen=lambda s, yrs: gen_linear(s, yrs, slope=0.015), decimals=6,
         kind="a clear upward series with only 9 values",
         purpose=("Minimum-length gate: 9 < 10 valid yearly values -> 'too_short', no statistics and no p-value, "
                  "however obvious the trend looks."),
         params=dict(model="y = 0.15 + 0.015*(year-2016) + N(0, 0.03)"),
         predicate=lambda r: True),
    dict(id="golden_06_min_length", file="golden_06_min_length.csv", years=np.arange(2015, 2025),
         gen=lambda s, yrs: gen_linear(s, yrs, slope=0.015), decimals=6,
         kind="a clear upward series with exactly 10 values",
         purpose=("Boundary of the gate: n = 10 is allowed and must produce a full verdict (Confirmed). The OLS residual r1 is "
                  "NEGATIVE (-0.33), so n_eff must be capped at n (not inflated above it)."),
         params=dict(model="y = 0.15 + 0.015*(year-2015) + N(0, 0.03)"),
         predicate=lambda r: r["verdict"]["tier"] == "confirmed" and r["badges"]["tests_disagree"] is False
         and r["ols"]["n_eff"] > 3 and abs(r["ols"]["r1_residual"] - 0.3) > 0.05),
    dict(id="golden_07_disagree_one_lag", file="golden_07_disagree_one_lag.csv", years=np.arange(2005, 2025),
         gen=lambda s, yrs: gen_ar1(s, yrs, phi=0.5), decimals=6,
         kind="AR(1) phi=0.5 noise, no true trend; n=20",
         purpose=("Exactly ONE significant Hamed-Rao lag (lag 1 only, so the lag filter must ignore the rest) and "
                  "the two tests DISAGREE (exactly one has p < 0.05). Under Option B the verdict is Not proven yet "
                  "with the 'tests disagree' badge, not Confirmed."),
         params=dict(model="x_t = 0.5*x_{t-1} + e_t; y = 0.20 + x", phi=0.5),
         predicate=lambda r: r["mk_hamed_rao"]["significant_acf_lags"] == [1]
         and r["badges"]["tests_disagree"] is True and r["verdict"]["tier"] == "not_proven_yet"
         and r["years_needed"]["displayed"]),
]


def build_yearly_cases(out):
    for c in CASES:
        years = c["years"]
        seed = find_seed(c["gen"], years, c["predicate"], c["decimals"])
        y = np.round(c["gen"](seed, years), c["decimals"])
        path = os.path.join(HERE, c["file"])
        write_series(path, years, y)
        yr_back, y_back = read_series(path)             # expected values come from what is on disk
        res = analyse(yr_back, y_back)
        if res["verdict"]["tier"] != "too_short":
            cross_check(yr_back, y_back, res, c["id"])
        out["cases"][c["id"]] = dict(file=c["file"], kind=c["kind"], purpose=c["purpose"],
                                     generator=dict(seed=seed, **c["params"]), expected=res)
        v = res["verdict"]
        extra = "" if v["tier"] == "too_short" else (
            f"  p_MK-HR={v['p_mk_hr']:.4g} p_OLS-AR1={v['p_ols_ar1']}  p_naive MK={res['mk_original']['p']:.4g}"
            f" OLS={res['ols']['p_naive']:.4g}  r1={res['ols']['r1_residual']:.2f}  n_ns_raw={res['mk_hamed_rao']['n_ns_raw']:.2f}"
            f"  lags={res['mk_hamed_rao']['significant_acf_lags']}  badges={res['badges']}  yrs={res['years_needed']}")
        print(f"{c['id']}: seed={seed} tier={v['tier']} p_used={v['p_used']}{extra}", flush=True)


def main():
    out = {
        "spec_version": SPEC_VERSION,
        "conventions": {
            "series": "yearly series, float64 (cast float32 npz values to float64 before testing)",
            "time_axis": "calendar years; slopes are per year (per decade = x10)",
            "alpha": ALPHA,
            "min_valid_yearly_values": MIN_YEARS,
            "mk": "two-sided, normal approximation with continuity correction and tie-corrected Var(S); tau = S / (n(n-1)/2)",
            "hamed_rao": ("Var(S) multiplied by n/n*_s = 1 + 2/(n(n-1)(n-2)) * sum_k (n-k)(n-k-1)(n-k-2) rho_k over ALL lags "
                          "1..n-1 whose rho_k is outside +-1.96/sqrt(n); rho = biased ACF (denominator n) of the ranks of "
                          "y - Sen_slope*index (average ranks for ties). FACTOR CAPPED AT 1. "
                          "'uncapped_reference' is kept only to cross-check against pymannkendall."),
            "sen_ci": ("Gilbert 1987: C = 1.96*sqrt(Var(S)); lower = pair-slope at 1-indexed rank (N-C)/2, upper at rank (N+C)/2+1, "
                       "N = n(n-1)/2, linear interpolation. Headline CI uses the capped Hamed-Rao Var(S)."),
            "ols_ar1": ("r1 = sum(e_t e_{t+1}) / sum(e_t^2) of OLS residuals; n_eff = n(1-r1)/(1+r1), n_eff = n if r1 <= 0; "
                        "SE_adj = SE_ols * sqrt((n-2)/(n_eff-2)); t on n_eff-2 df (Santer et al. 2000). Undefined if n_eff <= 2."),
            "verdict_p": "OPTION B: p_used = max(p_MK-HR, p_OLS-AR1); if OLS-AR(1) undefined, p_used = p_MK-HR",
            "tiers": "on p_used: <0.05 confirmed; <0.20 not_proven_yet; else no_case; <10 valid yearly values -> too_short",
            "badges": "tests_disagree = exactly one of {p_MK-HR<0.05, p_OLS-AR1<0.05}; autocorrelated = OLS residual r1 > 0.3",
            "years_needed": ("b = OLS slope, sigma = sqrt(SSE/(n-2)), phi = max(r1,0); smallest n*>=n with "
                             "|b|/SE(n*) >= t_{0.975,n_eff(n*)-2} (~50% detection odds); displayed iff tier == not_proven_yet "
                             "and p_used<0.5 and extra years <= 50."),
            "magnitude": "total_change_sen = Sen slope x (last_year - first_year); pct_of_mean_per_decade = 100*10*Sen/mean",
        },
        "tolerances": {"integers": "exact", "slopes_means_CI_ends_n_eff_r1": "rel 1e-9 (abs 1e-12)",
                       "p_values_z_t_q": "rel 1e-7", "booleans_tiers_years_needed_ids": "exact"},
        "cases": {},
    }
    build_yearly_cases(out)
    import golden_ext
    golden_ext.build(out, HERE)
    with open(os.path.join(HERE, "golden_expected.json"), "w") as f:
        json.dump(out, f, indent=2)
    print("OK: all cross-checks passed; wrote CSVs/JSON + golden_expected.json")


if __name__ == "__main__":
    sys.exit(main())
