# Golden cases 1-9 (answer key for `api/_engine/`)

**Owner:** Methods lead (Sergio) · **Consumer:** Oier (`tests/fixtures/golden/`) · **Spec:** `docs/science/METHODS.md`
**Status:** v1 draft. Encodes **Option B** (verdict p = larger of the MK-HR and OLS-AR(1) p-values) and the **Hamed-Rao factor capped at 1**. Evidence: `docs/science/FALSE_POSITIVE_SIM.md`.
**Replace the old fixtures:** `golden_02_white_noise.csv` and `golden_03_ar1_null.csv` changed (new seeds under the new rules); `golden_01` is identical. `golden_expected.json` is fully regenerated.

## Files

| File | What |
|---|---|
| `golden_01` ... `golden_07` `.csv` | Yearly series (`year,value`), float64, up to 6 decimals |
| `golden_08_monthly.csv` | Monthly series (`date,value`), blank value = missing month |
| `golden_09_regions.json` | Region table for BH-FDR and Mirror |
| `golden_expected.json` | Expected output for every case, plus conventions and tolerances |
| `make_golden.py`, `golden_ext.py` | Regenerate everything. Independent reference implementation, cross-checked against pymannkendall, scipy, statsmodels (test-only deps) |
| `sim_false_positive.py`, `sim_results.json` | The validity simulation |

Expected values are computed from the data as read back from the files. Cast float32 `.npz` data to float64 before testing.

## The cases

| # | Series | Verdict | What it catches |
|---|---|---|---|
| 1 | Real trend, n=24 | Confirmed (p_used 5.8e-7) | Core arithmetic. Raw HR factor 0.81, so the **cap** must give 1.0 |
| 2 | White noise, n=31 | No case (p_used 0.69) | False positives, odd-length medians, hiding years-needed. Raw HR factor 0.68 (cap again) |
| 3 | AR(1) φ=0.6, no trend, n=24 | Not proven yet (p_used 0.129) | **Skipped autocorrelation correction**: naive MK p = 0.018 and naive OLS p = 0.013 both say "significant". Autocorrelated badge on, years-needed = 4 |
| 4 | Trend + values rounded to 0.1, n=20 | Confirmed (0.0084) | **Ties**: tie-corrected Var(S), average ranks, tie groups [2,2,3,4,4] |
| 5 | Obvious upward trend, n=9 | too_short | **Minimum-length gate**: no statistics, no p-value |
| 6 | Real trend, n=10 | Confirmed (0.0092) | Gate boundary (10 is allowed). Residual r1 = -0.33, so **n_eff is capped at n** |
| 7 | AR(1) φ=0.5, no trend, n=20 | Not proven yet (0.124) | **Exactly one significant HR lag** (lag 1) and the **tests disagree** (MK-HR 0.028, OLS-AR(1) 0.124): under Option B this is NOT Confirmed |
| 8 | Monthly 2000-2013, 7 missing months, period 2001-2012 | see below | Season construction and missing-data rules |
| 9 | 18 regions, 3 types | see below | BH-FDR and the Mirror rule |

Cases 3 and 7 were **selected on purpose** (first seed meeting their conditions) as hard fixtures. They test the implementation, not real data. No fixture sits within 0.05 of an r1 threshold of 0.3.

### Case 8: what the engine must reproduce
Period 2001-2012 inclusive. The file also contains 2000 and 2013, which must **not** be used. Rules: seasons need all their months; annual needs at least 10 of 12 (mean of the months present); DJF is labelled by January's year; a season partly outside the period is dropped and not counted; the gate needs at least 10 valid yearly values and at least 80% of years valid.

| Season | Valid / total | Gate | Why |
|---|---|---|---|
| ANN | 11 / 12 | ok | 2010 has 9 of 12 months |
| DJF | 9 / 11 | **too short** | 2001 and 2013 dropped (edge); Dec 2005 and Jan-Feb 2010 missing |
| MAM | 11 / 12 | ok | Mar 2010 missing |
| JJA | 10 / 12 | ok | exactly 10: Jun 2003 and Jul 2008 missing |
| SON | 11 / 12 | ok | Nov 2012 missing |
| NDJF (custom, wraps year) | 9 / 11 | **too short** | same edge and missing months as DJF |
| JA (custom) | 11 / 12 | ok | Jul 2008 missing |

### Case 9: what the engine must reproduce
16 valid regions (2 have no data), q = 0.05, so BH rejects the 9 smallest p-values. Three regions have raw p < 0.05 but **fail BH** (CTY-E, CTY-F, NR-4). Six Mirror scenarios: `CTY-B` has 4 qualifying mirrors and returns the top 3 (CTY-A, CTY-C, CTY-G); `NR-1` excludes NR-3 (contained in it) and NR-4 (fails BH) and returns NR-2; `CTY-A` returns CTY-B and CTY-D; `OCN-1` and `CTY-E` return "none found" because the **case region itself** is not significant after BH; `NR-2` returns NR-1.

## Tolerances

Integers, booleans, tiers, ids, year lists: exact. Slopes, means, CI ends, n_eff, r1: relative 1e-9. p-values, z, t, BH-adjusted p: relative 1e-7.

## Spec gaps to write into METHODS v1

Settled by the golden cases (just copy the wording from `golden_expected.json` → `conventions`): Sen CI (Gilbert ranks, interpolated, capped-HR variance), OLS AR(1) SE (Santer, n_eff capped at n), Hamed-Rao cap at 1, tau definition, years-needed definition (~50% odds), Option B verdict rule, autocorrelated badge at r1 > 0.3.

**Still open, not covered by any fixture yet:**
1. **Missing years inside a series** (allowed by the 80% rule). How are the HR autocorrelation and the OLS r1 computed when years are skipped? The key assumes consecutive data only.
2. **OLS-AR(1) undefined (n_eff <= 2).** The key falls back to the MK-HR p for the verdict. A fixture needs a short, very persistent series.
3. **Annual mean with missing months** is the plain mean of the months present, which can be biased when a month with a strong seasonal value is missing. Requiring 12 of 12 would avoid it.
4. **BH population (case 9).** BH runs over all valid regions of all types together. Say so in METHODS §14.
5. **What p does each trend-map region use?** The key assumes the same Option B verdict p.

## Using it in pytest (sketch; `analyze_yearly` is whatever Oier exposes)

```python
import json, pathlib, numpy as np, pytest
G = pathlib.Path("tests/fixtures/golden")
K = json.load(open(G / "golden_expected.json"))
YEARLY = [k for k, v in K["cases"].items() if v["file"].endswith(".csv") and "monthly" not in k]

@pytest.mark.parametrize("cid", YEARLY)
def test_golden_yearly(cid):
    c = K["cases"][cid]; e = c["expected"]
    d = np.genfromtxt(G / c["file"], delimiter=",", names=True)
    res = analyze_yearly(d["year"], d["value"])
    assert res["verdict"]["tier"] == e["verdict"]["tier"]
    if e["verdict"]["tier"] != "too_short":
        assert res["verdict"]["p_used"] == pytest.approx(e["verdict"]["p_used"], rel=1e-7)
        assert res["sen"]["slope"] == pytest.approx(e["sen"]["slope_per_year"], rel=1e-9)
        assert res["badges"]["tests_disagree"] == e["badges"]["tests_disagree"]
```
