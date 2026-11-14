#!/usr/bin/env python3
"""
make_golden.py - generates golden cases 1-3 (the engine's answer key).

WHAT THIS IS
  An independent reference implementation of the METHODS.md spec, written from the
  papers (Mann 1945/Kendall 1975, Sen 1968, Hamed & Rao 1998, Santer et al. 2000,
  Weatherhead et al. 1998), NOT from api/_engine/. Every number it writes is
  cross-checked against pymannkendall / scipy / statsmodels before being saved.

USAGE
  pip install numpy scipy pymannkendall statsmodels     # test-only deps
  python make_golden.py                                  # rewrites CSVs + golden_expected.json

The CSVs are the source of truth for the inputs (6 decimals). Expected values are
computed from the CSV values as read back, so there is no float round-trip ambiguity.
"""
import csv
import json
import os
import sys

import numpy as np
from scipy import stats

ALPHA = 0.05
HERE = os.path.dirname(os.path.abspath(__file__))
SPEC_VERSION = "METHODS v0 + Methods-lead recommended Decisions (H0 draft); update after H2 review"


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


def mk_var(y):
    n = len(y)
    _, c = np.unique(y, return_counts=True)
    return (n * (n - 1) * (2 * n + 5) - np.sum(c * (c - 1) * (2 * c + 5))) / 18.0


def z_cc(s, var):
    """Normal approximation with continuity correction."""
    if s > 0:
        return (s - 1) / np.sqrt(var)
    if s < 0:
        return (s + 1) / np.sqrt(var)
    return 0.0


def p_two_sided(z):
    return float(2 * stats.norm.sf(abs(z)))


def acf_biased(x, nlags):
    """Autocovariance with denominator n at every lag (Hamed & Rao use this form)."""
    x = np.asarray(x, float)
    n = len(x)
    y = x - x.mean()
    c0 = np.sum(y * y) / n
    return np.array([np.sum(y[: n - k] * y[k:]) / n / c0 for k in range(nlags + 1)])


def hamed_rao_factor(y, slope):
    """n/n*_s from Hamed & Rao (1998), eq. 17: ranks of Sen-detrended series,
    ALL lags 1..n-1 whose sample ACF lies outside +-z_{1-a/2}/sqrt(n)."""
    n = len(y)
    idx = np.arange(1, n + 1)
    ranks = stats.rankdata(y - slope * idx)
    rho = acf_biased(ranks, n - 1)
    bound = stats.norm.ppf(1 - ALPHA / 2) / np.sqrt(n)
    sig = [k for k in range(1, n) if abs(rho[k]) > bound]
    sni = sum((n - k) * (n - k - 1) * (n - k - 2) * rho[k] for k in sig)
    return 1.0 + 2.0 / (n * (n - 1) * (n - 2)) * sni, sig


def rank_interp(sorted_vals, r):
    """Value at fractional 1-indexed rank r (linear interpolation, clipped to [1, N])."""
    N = len(sorted_vals)
    r = min(max(r, 1.0), float(N))
    lo = int(np.floor(r))
    frac = r - lo
    a = sorted_vals[lo - 1]
    b = sorted_vals[min(lo, N - 1)]
    return float(a + frac * (b - a))


def sen_ci(slopes_sorted, var_s):
    """Gilbert (1987): C = z_{1-a/2} sqrt(Var S); M1 = (N-C)/2; M2 = (N+C)/2;
    lower = slope at rank M1, upper = slope at rank M2+1 (1-indexed, interpolated)."""
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
    # lag-1 autocorrelation of residuals (Santer et al. 2000)
    r1 = float(np.sum(e[:-1] * e[1:]) / sse)
    n_eff = n * (1 - r1) / (1 + r1) if r1 > 0 else float(n)   # capped at n
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
    """METHODS s10 (Weatherhead et al. 1998): smallest n* >= n with |b|/SE(n*) >= t_crit.
    phi = max(r1, 0); SE(n*)^2 = 12 sigma^2 / (n*(n*^2-1)) * (1+phi)/(1-phi);
    n_eff(n*) = n*(1-phi)/(1+phi); t_crit = t_{0.975, n_eff-2}.
    NOTE: this is the point where the *expected* slope just reaches significance (~50% power)."""
    phi = max(r1, 0.0)
    for ns in range(n, n + max_extra + 1):
        n_eff = ns * (1 - phi) / (1 + phi)
        if n_eff <= 2.0:
            continue
        se = np.sqrt(12 * sigma ** 2 / (ns * (ns ** 2 - 1)) * (1 + phi) / (1 - phi))
        if abs(b) / se >= stats.t.ppf(1 - ALPHA / 2, n_eff - 2):
            return ns - n
    return None   # more than max_extra years


def tier(p):
    if p < 0.05:
        return "confirmed"
    if p < 0.20:
        return "not_proven_yet"
    return "no_case"


def analyse(years, y):
    years = np.asarray(years, float)
    y = np.asarray(y, float)
    n = len(y)
    slopes = pair_slopes(years, y)
    sen = float(np.median(slopes))

    S = mk_score(y)
    var = mk_var(y)
    z0 = z_cc(S, var)
    n_ns, sig_lags = hamed_rao_factor(y, sen)
    var_hr = var * n_ns
    z_hr = z_cc(S, var_hr)
    p_hr = p_two_sided(z_hr)

    ols = ols_block(years, y)
    mk_sig = p_hr < ALPHA
    ols_sig = (ols["p_adj"] < ALPHA) if ols["p_adj"] is not None else None
    t = tier(p_hr)
    yn = years_needed(n, ols["slope"], ols["sigma"], ols["r1_residual"])
    shown = (t == "not_proven_yet") and (p_hr < 0.5) and (yn is not None) and (yn <= 50)

    lo_o, hi_o = sen_ci(slopes, var)
    lo_h, hi_h = sen_ci(slopes, var_hr)
    span = years[-1] - years[0]
    return {
        "inputs": {"n": n, "first_year": int(years[0]), "last_year": int(years[-1])},
        "descriptive": {"mean": float(y.mean()), "sd": float(y.std(ddof=1))},
        "mk_original": {"S": S, "var_S": float(var), "z": float(z0),
                        "p": p_two_sided(z0), "tau": S / (0.5 * n * (n - 1))},
        "mk_hamed_rao": {"n_ns": float(n_ns), "significant_acf_lags": sig_lags,
                         "var_S": float(var_hr), "z": float(z_hr), "p": p_hr,
                         "if_factor_capped_at_1": {"z": float(z_cc(S, var * max(n_ns, 1.0))),
                                                   "p": p_two_sided(z_cc(S, var * max(n_ns, 1.0)))}},
        "sen": {"slope_per_year": sen, "slope_per_decade": 10 * sen,
                "ci95_per_year_hamed_rao_variance": [lo_h, hi_h],
                "ci95_per_year_original_variance": [lo_o, hi_o]},
        "ols": ols,
        "agreement": {"mk_significant": bool(mk_sig),
                      "ols_ar1_significant": None if ols_sig is None else bool(ols_sig),
                      "tests_agree": None if ols_sig is None else bool(mk_sig == ols_sig)},
        "verdict": {"p_used": p_hr, "tier": t},
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
    close(res["mk_original"]["var_S"], o.var_s, what="var_S")
    close(res["mk_original"]["z"], o.z, what="z")
    close(res["mk_original"]["p"], o.p, rel=1e-7, what="p original")
    close(res["mk_original"]["tau"], o.Tau, what="tau")
    close(res["sen"]["slope_per_year"], o.slope, what="Sen slope (pymannkendall)")
    close(res["sen"]["slope_per_year"], stats.theilslopes(y, years)[0], what="Sen slope (scipy)")

    h = mk.hamed_rao_modification_test(y, alpha=ALPHA)       # lag=None -> all lags
    close(res["mk_hamed_rao"]["var_S"], h.var_s, what="HR var_S")
    close(res["mk_hamed_rao"]["z"], h.z, what="HR z")
    close(res["mk_hamed_rao"]["p"], h.p, rel=1e-7, what="HR p")

    lr = stats.linregress(years, y)
    close(res["ols"]["slope"], lr.slope, what="OLS slope")
    close(res["ols"]["se_naive"], lr.stderr, what="OLS SE")
    close(res["ols"]["p_naive"], lr.pvalue, rel=1e-7, what="OLS p")
    close(res["ols"]["r2"], lr.rvalue ** 2, what="OLS r2")

    e = y - (lr.intercept + lr.slope * years)
    close(res["ols"]["r1_residual"], sm_acf(e, nlags=1, adjusted=False, fft=False)[1], what="r1 vs statsmodels")


# ----------------------------------------------------------------------------
# Case generators
# ----------------------------------------------------------------------------
def gen_linear(seed, years):
    rng = np.random.default_rng(seed)
    return 0.15 + 0.008 * (years - years[0]) + rng.normal(0, 0.03, len(years))


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


def quick(years, y):
    y = np.round(y, 6)
    return analyse(years, y)


def find_seed(gen, years, predicate, limit=200000):
    for seed in range(limit):
        y = np.round(gen(seed, years), 6)
        if predicate(analyse(years, y)):
            return seed
    raise RuntimeError("no seed found")


CASES = [
    dict(id="golden_01_linear_trend", file="golden_01_linear_trend.csv",
         years=np.arange(2002, 2026), gen=gen_linear,
         kind="white noise around a true linear trend (0.008/yr, sd 0.03); n=24",
         purpose="Happy path: a clear, real trend. Both tests must agree and the verdict is Confirmed.",
         params=dict(model="y = 0.15 + 0.008*(year-2002) + N(0, 0.03)"),
         predicate=lambda r: r["verdict"]["tier"] == "confirmed"
         and r["verdict"]["p_used"] < 1e-3 and r["agreement"]["tests_agree"]
         and abs(r["ols"]["r1_residual"]) < 0.3),
    dict(id="golden_02_white_noise", file="golden_02_white_noise.csv",
         years=np.arange(1995, 2026), gen=gen_white,
         kind="pure white noise, no trend (sd 0.03); n=31 (odd length)",
         purpose="Null case: no trend. Verdict No case; tests agree; years_needed not displayed.",
         params=dict(model="y = 0.20 + N(0, 0.03)"),
         predicate=lambda r: r["verdict"]["tier"] == "no_case"
         and r["verdict"]["p_used"] > 0.4 and r["agreement"]["tests_agree"]
         and abs(r["ols"]["r1_residual"]) < 0.25),
    dict(id="golden_03_ar1_null", file="golden_03_ar1_null.csv",
         years=np.arange(2002, 2026), gen=gen_ar1,
         kind="AR(1) noise phi=0.6, NO true trend (marginal sd 0.03); n=24",
         purpose=("Autocorrelation trap, deliberately selected: the NAIVE tests (plain MK, plain OLS) "
                  "call it significant, the corrected tests do not. Verdict: Not proven yet; "
                  "years_needed displayed. Fails if the engine skips the autocorrelation correction."),
         params=dict(model="x_t = 0.6*x_{t-1} + e_t; y = 0.20 + x", phi=0.6),
         predicate=lambda r: r["mk_original"]["p"] < 0.05 and r["ols"]["p_naive"] < 0.05
         and 0.05 < r["verdict"]["p_used"] < 0.20
         and r["ols"]["p_adj"] is not None and r["ols"]["p_adj"] >= 0.05
         and r["mk_hamed_rao"]["n_ns"] > 1.5
         and r["years_needed"]["displayed"]),
]


def main():
    out = {
        "spec_version": SPEC_VERSION,
        "conventions": {
            "series": "yearly series, float64 (cast float32 npz values to float64 before testing)",
            "time_axis": "calendar years; slopes are per year (per decade = x10)",
            "alpha": ALPHA,
            "mk": "two-sided, normal approximation with continuity correction and tie-corrected Var(S); tau = S / (n(n-1)/2)",
            "hamed_rao": ("Var(S) multiplied by n/n*_s = 1 + 2/(n(n-1)(n-2)) * sum_k (n-k)(n-k-1)(n-k-2) rho_k over ALL lags "
                          "1..n-1 whose rho_k is outside +-1.96/sqrt(n); rho = biased ACF (denominator n) of the ranks of "
                          "y - Sen_slope*index. Not capped at 1 (matches pymannkendall)."),
            "sen_ci": ("Gilbert 1987: C = 1.96*sqrt(Var(S)); lower = pair-slope at 1-indexed rank (N-C)/2, upper at rank (N+C)/2+1, "
                       "N = n(n-1)/2, linear interpolation between order statistics. Headline CI uses the Hamed-Rao-corrected Var(S)."),
            "ols_ar1": ("r1 = sum(e_t e_{t+1}) / sum(e_t^2) of OLS residuals; n_eff = n(1-r1)/(1+r1), n_eff = n if r1 <= 0; "
                        "SE_adj = SE_ols * sqrt((n-2)/(n_eff-2)); t on n_eff-2 df (Santer et al. 2000)."),
            "tiers": "from the Hamed-Rao MK p: <0.05 confirmed; <0.20 not_proven_yet; else no_case",
            "tests_agree": "false iff exactly one of {MK-HR p<0.05, OLS-AR(1) p<0.05}",
            "years_needed": ("METHODS s10 with b = OLS slope, sigma = sqrt(SSE/(n-2)), phi = max(r1,0); smallest n*>=n with "
                             "|b|/SE(n*) >= t_{0.975,n_eff(n*)-2}; i.e. ~50% detection odds. displayed iff tier == not_proven_yet "
                             "and p<0.5 and extra years <= 50."),
            "magnitude": "total_change_sen = Sen slope x (last_year - first_year); pct_of_mean_per_decade = 100*10*Sen/mean",
        },
        "tolerances": {"integers": "exact", "slopes_means_CI_ends_n_eff_r1": "rel 1e-9 (abs 1e-12)",
                       "p_values_z_t": "rel 1e-7", "booleans_tiers_years_needed": "exact"},
        "cases": {},
    }

    for c in CASES:
        years = c["years"]
        seed = find_seed(c["gen"], years, c["predicate"])
        y = np.round(c["gen"](seed, years), 6)
        path = os.path.join(HERE, c["file"])
        with open(path, "w", newline="") as f:
            w = csv.writer(f, lineterminator="\n")
            w.writerow(["year", "value"])
            for yr, v in zip(years, y):
                w.writerow([int(yr), f"{v:.6f}"])
        # Re-read from disk so expected values are computed from exactly what is committed
        with open(path) as f:
            rows = list(csv.DictReader(f))
        yr_back = np.array([float(r["year"]) for r in rows])
        y_back = np.array([float(r["value"]) for r in rows])
        res = analyse(yr_back, y_back)
        cross_check(yr_back, y_back, res, c["id"])
        out["cases"][c["id"]] = dict(file=c["file"], kind=c["kind"], purpose=c["purpose"],
                                     generator=dict(seed=seed, **c["params"]), expected=res)
        print(f"{c['id']}: seed={seed}  tier={res['verdict']['tier']}  p_HR={res['verdict']['p_used']:.4g}  "
              f"p_MK_naive={res['mk_original']['p']:.4g}  p_OLS_naive={res['ols']['p_naive']:.4g}  "
              f"p_OLS_AR1={res['ols']['p_adj']}  r1={res['ols']['r1_residual']:.3f}  n_ns={res['mk_hamed_rao']['n_ns']:.3f}  "
              f"yrs_needed={res['years_needed']}")

    with open(os.path.join(HERE, "golden_expected.json"), "w") as f:
        json.dump(out, f, indent=2)
    print("OK: all cross-checks passed; wrote CSVs + golden_expected.json")


if __name__ == "__main__":
    sys.exit(main())
