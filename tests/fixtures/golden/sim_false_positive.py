#!/usr/bin/env python3
"""
sim_false_positive.py - Monte-Carlo validity checks for METHODS.md (Methods lead).

PART 1  False-positive rate under the NULL (no true trend), AR(1) noise.
        Nominal alpha = 0.05. Reports the empirical rate of p < 0.05 for:
          naive MK | MK-HR (uncapped, as pymannkendall) | MK-HR (factor capped at 1)
          naive OLS | OLS-AR(1) (Santer, n_eff capped at n)
        plus how often a NULL series lands in each verdict tier (HR p).
PART 2  Years-until-significant check (METHODS s10): simulate at the predicted n*
        and report how often the tests reject (formula targets ~50%).

Uses the reference implementation in make_golden.py. Fixed seed; deterministic.
Run:  python sim_false_positive.py [reps]
"""
import json
import os
import sys

import numpy as np
from scipy import stats

from make_golden import (hamed_rao_factor, mk_score, mk_var, ols_block, p_two_sided,
                         pair_slopes, years_needed, z_cc)

HERE = os.path.dirname(os.path.abspath(__file__))
ALPHA = 0.05


def ar1_matrix(rng, reps, n, phi, sd=1.0):
    x = np.empty((reps, n))
    x[:, 0] = rng.normal(0, sd, reps)
    eps = rng.normal(0, sd * np.sqrt(1 - phi ** 2), (reps, n))
    for k in range(1, n):
        x[:, k] = phi * x[:, k - 1] + eps[:, k]
    return x


def all_tests(t, y):
    n = len(y)
    S = mk_score(y)
    var = mk_var(y)
    p_naive_mk = p_two_sided(z_cc(S, var))
    sen = float(np.median(pair_slopes(t, y)))
    n_ns, _ = hamed_rao_factor(y, sen)
    p_hr = p_two_sided(z_cc(S, var * n_ns))
    p_hr_cap = p_two_sided(z_cc(S, var * max(n_ns, 1.0)))
    o = ols_block(t, y)
    p_adj = o["p_adj"] if o["p_adj"] is not None else 1.0
    return dict(mk_naive=p_naive_mk, mk_hr=p_hr, mk_hr_cap=p_hr_cap,
                ols_naive=o["p_naive"], ols_ar1=p_adj,
                both_cap_and_ols=max(p_hr_cap, p_adj))   # significant iff BOTH are


def part1(reps, rng):
    rows = []
    for phi in (0.0, 0.3, 0.6):
        for n in (12, 24, 40):
            t = np.arange(n, dtype=float)
            X = ar1_matrix(rng, reps, n, phi)
            P = {k: np.empty(reps) for k in ("mk_naive", "mk_hr", "mk_hr_cap", "ols_naive", "ols_ar1", "both_cap_and_ols")}
            for i in range(reps):
                r = all_tests(t, X[i])
                for k in P:
                    P[k][i] = r[k]
            rate = {k: float(np.mean(v < ALPHA)) for k, v in P.items()}
            tiers = dict(confirmed=float(np.mean(P["mk_hr"] < 0.05)),
                         not_proven_yet=float(np.mean((P["mk_hr"] >= 0.05) & (P["mk_hr"] < 0.20))),
                         no_case=float(np.mean(P["mk_hr"] >= 0.20)))
            mc_se = float(np.sqrt(ALPHA * (1 - ALPHA) / reps))
            nan_hr = float(np.mean(np.isnan(P["mk_hr"])))
            rows.append(dict(phi=phi, n=n, reps=reps, mc_se=mc_se, false_positive_rate=rate, null_tier_share=tiers,
                             nan_rate_mk_hr_uncapped=nan_hr))
            print(f"phi={phi} n={n}: " + "  ".join(f"{k}={v:.3f}" for k, v in rate.items())
                  + f"  | null tiers: {tiers['confirmed']:.3f}/{tiers['not_proven_yet']:.3f}/{tiers['no_case']:.3f}"
                  + f"  | NaN(HR uncapped)={nan_hr:.3f}", flush=True)
    return rows


def part1b(reps, rng):
    """Alternative MK autocorrelation corrections (pymannkendall) at n=24, null."""
    import warnings
    import pymannkendall as mk
    warnings.filterwarnings("ignore")
    n = 24
    rows = []
    for phi in (0.0, 0.3, 0.6):
        X = ar1_matrix(rng, reps, n, phi)
        names = ("yue_wang", "tfpw_yue2002", "prewhitening")
        fn = dict(yue_wang=mk.yue_wang_modification_test,
                  tfpw_yue2002=mk.trend_free_pre_whitening_modification_test,
                  prewhitening=mk.pre_whitening_modification_test)
        rej = {k: 0 for k in names}
        for i in range(reps):
            for k in names:
                try:
                    rej[k] += fn[k](X[i], alpha=ALPHA).p < ALPHA
                except Exception:
                    pass
        rate = {k: rej[k] / reps for k in names}
        rows.append(dict(phi=phi, n=n, reps=reps, false_positive_rate=rate))
        print(f"[alt MK corrections] phi={phi} n={n}: " + "  ".join(f"{k}={v:.3f}" for k, v in rate.items()), flush=True)
    return rows


def part2(reps, rng):
    rows = []
    sigma = 0.03
    for b, phi, n0 in ((0.004, 0.0, 10), (0.004, 0.4, 10), (0.003, 0.6, 10)):
        extra = years_needed(n0, b, sigma, phi)
        if extra is None:
            continue
        n_star = n0 + extra
        t = np.arange(n_star, dtype=float)
        X = b * t + sigma * ar1_matrix(rng, reps, n_star, phi)
        rej_hr = rej_ols = 0
        for i in range(reps):
            r = all_tests(t, X[i])
            rej_hr += r["mk_hr"] < ALPHA
            rej_ols += r["ols_ar1"] < ALPHA
        rows.append(dict(true_slope=b, sigma=sigma, phi=phi, n_start=n0, n_star=n_star, reps=reps,
                         reject_rate_mk_hr=rej_hr / reps, reject_rate_ols_ar1=rej_ols / reps))
        print(f"b={b} phi={phi}: n*={n_star}  reject MK-HR={rej_hr / reps:.3f}  OLS-AR1={rej_ols / reps:.3f}", flush=True)
    return rows


def part3_power(reps=4000):
    """Power at n=24, true slope 0.004/yr, noise sd 0.03 (own fixed seed, independent of parts 1-2)."""
    import warnings
    import pymannkendall as mk
    warnings.filterwarnings("ignore")
    rng = np.random.default_rng(77)
    n = 24
    t = np.arange(n, dtype=float)
    rows = []
    for phi in (0.0, 0.3, 0.6):
        X = 0.004 * t + 0.03 * ar1_matrix(rng, reps, n, phi)
        c = dict(pre_whitening=0, mk_hr_capped=0, ols_ar1=0, both_cap_and_ols=0)
        for i in range(reps):
            r = all_tests(t, X[i])
            c["pre_whitening"] += mk.pre_whitening_modification_test(X[i]).p < ALPHA
            c["mk_hr_capped"] += r["mk_hr_cap"] < ALPHA
            c["ols_ar1"] += r["ols_ar1"] < ALPHA
            c["both_cap_and_ols"] += r["both_cap_and_ols"] < ALPHA
        rows.append(dict(phi=phi, n=n, reps=reps, true_slope=0.004, sigma=0.03,
                         power={k: v / reps for k, v in c.items()}))
        print(f"[power] phi={phi}: " + "  ".join(f"{k}={v / reps:.3f}" for k, v in c.items()), flush=True)
    return rows


def main():
    reps = int(sys.argv[1]) if len(sys.argv) > 1 else 10000
    rng = np.random.default_rng(2026)
    print(f"== PART 1: false-positive rate under the null (alpha=0.05, reps={reps}) ==")
    p1 = part1(reps, rng)
    print("\n== PART 1b: alternative MK corrections at n=24 (null) ==")
    p1b = part1b(max(reps // 2, 2000), rng)
    print("\n== PART 2: years-until-significant check (formula targets ~50% rejection at n*) ==")
    p2 = part2(max(reps // 2, 2000), rng)
    print("\n== PART 3: power at n=24 (true slope 0.004/yr, sd 0.03) ==")
    p3 = part3_power()
    with open(os.path.join(HERE, "sim_results.json"), "w") as f:
        json.dump(dict(seed=2026, alpha=ALPHA, part1_null=p1, part1b_alt_corrections=p1b, part2_years_needed=p2,
                       part3_power=p3), f, indent=2)
    print("\nwrote sim_results.json")


if __name__ == "__main__":
    sys.exit(main())
