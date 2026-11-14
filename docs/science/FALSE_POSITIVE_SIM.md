# FALSE-POSITIVE SIMULATION and power check

**Owner:** Methods lead · **Reproduce:** `python tests/fixtures/golden/sim_false_positive.py 10000` (fixed seeds; raw numbers in `sim_results.json`)
**Used in:** METHODS §6, §9, §10 decisions · LIMITATIONS ("Short records…", "Testing many…") · the pitch ("how do you know your p-values are right?")

## Setup

Synthetic yearly series, Gaussian AR(1) noise, no true trend (Part 1) or a known trend (Parts 2-3). 10,000 replicates per cell, so the Monte-Carlo standard error on a rate near 5% is about 0.002. Tests are the reference implementation from `make_golden.py`, cross-checked against pymannkendall. "Capped" means the Hamed-Rao variance factor is floored at 1.

## 1. False-positive rate under the null (nominal 5%), n = 24

| True φ | Naive MK | MK-HR uncapped | **MK-HR capped** | Naive OLS | **OLS-AR(1)** | Both (capped HR and OLS-AR(1)) |
|---|---|---|---|---|---|---|
| 0.0 | 4.1% | **7.8%** | 4.0% | 5.1% | 4.3% | 2.8% |
| 0.3 | 12.1% | 15.2% | 11.7% | 14.2% | 8.4% | 7.4% |
| 0.6 | 27.4% | 25.3% | 22.7% | 31.4% | 12.5% | 12.1% |

Other lengths (MK-HR capped / OLS-AR(1)): φ=0 gives 4.8% / 4.4% at n=12 and 4.5% / 4.1% at n=40. φ=0.3 gives 11.1% / 9.8% at n=12 and 12.0% / 7.2% at n=40. φ=0.6 gives 23.6% / 17.3% at n=12 and 20.2% / 8.7% at n=40.

**Findings**
- **Uncapped Hamed-Rao is anti-conservative even with no autocorrelation** (7.5-8.2% at φ=0), because the correction can *shrink* the variance. In 0.4-1.9% of null series the variance goes negative and the p-value is NaN. Capping at 1 fixes both problems.
- **No test is calibrated once the noise is strongly persistent.** At φ=0.6 and n=24, capped MK-HR rejects 22.7% of pure-noise series and OLS-AR(1) 12.5%. The Hamed-Rao correction is weak for short yearly series, because it only corrects at lags whose sample autocorrelation looks significant.
- OLS-AR(1) is the better calibrated of the two, and requiring both tests to agree is marginally better still.
- For well-behaved series (φ ≈ 0) the capped MK-HR and OLS-AR(1) are both at or just under 5%.

## 2. Power at n = 24 (true slope 0.004/yr, noise sd 0.03)

| True φ | MK-HR capped | OLS-AR(1) | Both | Pre-whitening |
|---|---|---|---|---|
| 0.0 | 98.0% | 98.0% | 97.2% | 58.6% |
| 0.3 | 94.6% | 88.0% | 87.3% | 32.8% |
| 0.6 | 85.6% | 66.6% | 66.4% | 22.6% |

## 3. Alternatives I tested and do NOT recommend (n = 24, null)

| Method (pymannkendall) | φ=0 | φ=0.3 | φ=0.6 | Problem |
|---|---|---|---|---|
| Yue-Wang modification | 43.9% | 47.4% | 53.7% | Unusable at n=24 |
| TFPW (Yue et al. 2002) | 4.8% | 13.4% | 33.9% | Worse than Hamed-Rao at high φ |
| Pre-whitening | 3.7% | 4.2% | 5.7% | Near-nominal, but loses most of its power (table 2): it removes real trend along with the autocorrelation |

## 4. Years-until-significant check (METHODS §10)

Simulated at the predicted n* (σ = 0.03, start n = 10). The formula targets ≈50% rejection.

| True slope | φ | n* | MK-HR rejects | OLS-AR(1) rejects |
|---|---|---|---|---|
| 0.004 | 0.0 | 15 | 53.4% | 49.9% |
| 0.004 | 0.4 | 21 | 84.2% | 68.4% |
| 0.003 | 0.6 | 31 | 88.7% | 70.4% |

The formula is well calibrated for uncorrelated noise. With persistent noise the tests reject *more* often than 50% at n*, partly because they are themselves optimistic there (section 1). So the estimate errs on the side of "longer than needed". Tooltip: "about even odds, assuming slope and noise stay the same".

## 5. What a "Not proven yet" verdict means

For a correctly calibrated test, p is uniform under the null, so **about 15% of series with no trend at all land in the 0.05-0.20 band** (measured: 14.8-15.1% at φ=0). The student wording "seems to be rising/falling" therefore overclaims. Use something like "could be a real trend or just chance".

## Recommended decisions

1. **Cap the Hamed-Rao factor at 1** (§6). Evidence: sections 1 and 2 above.
2. **Choose how the verdict combines the two tests (§6/§9).**
   - **Option A (current spec):** the verdict follows MK-HR (capped), with the "tests disagree" badge. Simplest. False-positive rate: 4% / 12% / 23% for φ = 0 / 0.3 / 0.6.
   - **Option B (my recommendation):** the verdict p is max(p_MK-HR capped, p_OLS-AR(1)), i.e. Confirmed needs both. False-positive rate: 3% / 7% / 12%, at the cost of power at high φ (97% / 87% / 66%).
   - Either way, add an "autocorrelated series" badge when the residual r1 > 0.3: *p-values are optimistic for this series*. That is the honest handling of what nothing here fixes.
3. **If you choose B, golden 3 changes tier**: its max-p is 0.280, so it becomes "No case". I'll regenerate it with a seed that lands in "Not proven yet" under the new rule. The other two cases keep their tiers.
4. **§10 tooltip:** "about even odds".
5. **VERDICT_TEMPLATES:** reword "Not proven yet" as in section 5. **LIMITATIONS:** fill "Short records and natural variability" with these rates.

## Caveats

Gaussian AR(1) noise is a simplification: real series have trends in variance, outliers (e.g. fire years) and non-stationarity. Results are for n = 12-40 yearly values; monthly data are not tested directly, by design (§5). The true φ of annual or seasonal regional means is usually modest, but this is not measured here for any real variable. Estimating it per variable from the POWER series would be a good follow-up.
