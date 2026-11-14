# Golden cases 1-3 (answer key for `api/_engine/`)

**Owner:** Methods lead (Sergio) · **Consumer:** Oier (`tests/fixtures/golden/`) · **Spec:** `docs/science/METHODS.md`
**Status:** v0, matches the Methods lead's recommended Decision lines (H0 draft). Re-generate after the H2 review if any Decision changes.

## Files

| File | What |
|---|---|
| `golden_01_linear_trend.csv` | n=24 (2002-2025). White noise around a real trend. |
| `golden_02_white_noise.csv` | n=31 (1995-2025). No trend. Odd length on purpose. |
| `golden_03_ar1_null.csv` | n=24 (2002-2025). AR(1) phi=0.6, no true trend. |
| `golden_expected.json` | Expected output for every case + conventions + tolerances. |
| `make_golden.py` | Regenerates everything. Independent reference implementation, cross-checked against pymannkendall 1.4.3, scipy, statsmodels (test-only deps). Fails loudly on any mismatch. |

Inputs are float64 CSVs at 6 decimals; expected values are computed from the values as read back from the CSV. Cast float32 `.npz` data to float64 before testing.

## What each case proves

| Case | Expected verdict | What it catches |
|---|---|---|
| 1 Linear trend | Confirmed (HR p = 1.2e-8), tests agree | Basic correctness of S, Sen slope + CI, OLS, tau |
| 2 White noise | No case (HR p = 0.44), tests agree, years-needed hidden | False positives; odd-n median/rank conventions; hiding rule |
| 3 AR(1) null | Not proven yet (HR p = 0.111), tests agree, 10 more years shown | **Skipped autocorrelation correction.** Naive MK p = 0.024 and naive OLS p = 0.0096 both say "significant"; the corrected tests (MK-HR 0.111, OLS-AR(1) 0.280) do not |

Case 3 was **selected on purpose** (first seed meeting those conditions) as a hard fixture. It is a unit test of the implementation, not evidence about real data. Say so if a judge asks.

## Tolerances

- Integers (S, n, years-needed, lag lists), booleans, tiers: exact.
- Slopes, means, CI ends, n_eff, r1: relative 1e-9 (absolute 1e-12).
- p-values, z, t: relative 1e-7.

## Spec gaps the golden cases exposed (decide in METHODS v1, then tell Oier)

1. **Sen CI convention (§7).** Key uses Gilbert (1987): lower = pair-slope at 1-indexed rank (N-C)/2, upper at rank (N+C)/2 + 1, linear interpolation between order statistics, with the Hamed-Rao-corrected Var(S). scipy's `theilslopes` rounds ranks instead and ignores HR, so it will differ slightly.
2. **OLS with AR(1)-adjusted SE (§6).** Key uses Santer et al. (2000): r1 = sum(e_t e_{t+1}) / sum(e_t^2) of OLS residuals; n_eff = n(1-r1)/(1+r1), **capped at n** when r1 <= 0; SE_adj = SE_ols * sqrt((n-2)/(n_eff-2)); t on n_eff-2 df.
3. **Cap the Hamed-Rao factor at 1?** Key follows pymannkendall (uncapped). Golden 1 has n/n*_s = 0.81, so the correction makes that test *more* liberal (p = 1.2e-8 vs 2.8e-7 naive). If you cap it, use `mk_hamed_rao.if_factor_capped_at_1` for that case (p = 2.8e-7). Tiers are unchanged either way. For consistency with the OLS cap on n_eff, capping is arguably the more defensible choice.
4. **Tau (§6).** Key reports tau = S / (n(n-1)/2) (no tie adjustment), as pymannkendall does.
5. **Magnitude and years-needed definitions (§10-11).** total change = Sen slope x (last year - first year). Years-needed uses the OLS slope b, sigma = sqrt(SSE/(n-2)), phi = max(r1, 0), and finds where the *expected* slope just reaches significance (about even odds, not 90% power). Needs `scipy.special.stdtrit` for non-integer degrees of freedom.

## Not covered yet (golden 4-8, next)

Ties in the data, a missing-month/DJF season-construction case, n=9 ("Too short to judge"), a series with exactly one significant autocorrelation lag, and a Mirror/BH-FDR fixture.

## Using it in pytest (sketch; `analyze_yearly` is whatever Oier exposes)

```python
import json, pathlib, numpy as np, pytest
G = pathlib.Path("tests/fixtures/golden")
K = json.load(open(G / "golden_expected.json"))

@pytest.mark.parametrize("cid", K["cases"])
def test_golden(cid):
    c = K["cases"][cid]
    d = np.genfromtxt(G / c["file"], delimiter=",", names=True)
    res = analyze_yearly(d["year"], d["value"])
    e = c["expected"]
    assert res["mk"]["p"] == pytest.approx(e["mk_hamed_rao"]["p"], rel=1e-7)
    assert res["sen"]["slope"] == pytest.approx(e["sen"]["slope_per_year"], rel=1e-9)
    assert res["verdict"]["tier"] == e["verdict"]["tier"]
```
