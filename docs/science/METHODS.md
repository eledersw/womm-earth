# METHODS: statistics spec (source of truth for `api/_engine/`)

**Owner:** Methods & Validity lead. **Implementer:** Coder B. **Version:** v1, 2026-11-14; engine review pending.

The Decision lines below are normative; starter suggestions have been resolved. This revision adopts the conventions in `tests/fixtures/golden/golden_expected.json` and the evidence in `FALSE_POSITIVE_SIM.md`. It specifies intended behaviour, not certification of the current engine. Review with Oier and deployed-engine validity sign-off remain outstanding; see `METHODS_REVIEW.md`.

Notation: n is the number of finite yearly values, t is calendar year, and y is the corresponding value. Compute in float64, including values loaded from float32 data files. Keep full precision for inference; round only for display. All tests are two-sided at alpha = 0.05.

---

## 1. Regional averaging (fixed by the pipeline; for reference only)
- Each region's value is the cos(latitude)-weighted mean of the grid cells whose centres fall inside the region.
- A region too small to contain any cell centre uses the nearest cell instead, and the UI flags it.
- **Decision:** accept. Mask missing/fill values before averaging and normalise weights over valid cells. The nearest-cell fallback remains flagged.

## 2. Minimum series length for a verdict
- At least **10 valid yearly values** are needed for a verdict.
- **Trade-off:** Mann-Kendall has very little power below about 10 points. A higher minimum is more defensible, but it blocks short satellite records (e.g. CERES from 2001 gives about 24 years, which is fine).
- **Decision:** require ≥10 valid yearly values AND ≥80% valid eligible years (§3). Otherwise return "Too short to judge", no inferential statistics, no p-value and no years-needed estimate. Retain the reason for failure so insufficient coverage is distinguished from a short record. Ten years is an eligibility threshold, not a guarantee of sufficient power or reliable autocorrelation estimation.

## 3. Missing data
- **Trade-off:** looser rules keep more data, but risk biased means (for example, a missing winter month inflates the annual mean).
- **Decision:** seasons need ALL their months (3 of 3; custom sets: all). Annual needs ≥10/12. Use the unweighted arithmetic mean of months present, with no interpolation or day weighting. Retain the 10/12 annual rule to match golden case 8 and disclose that seasonally patterned missingness can bias the annual mean.
- Coverage is valid yearly values divided by eligible yearly slots. Slots wholly inside the requested period remain in the denominator when data are missing; seasons dropped for crossing period boundaries (§4) do not. Zero eligible slots fails; exactly 80% passes. Retain missing slots in the aggregated output and actual years for slopes.
- **Validation limit:** this aggregation rule does not settle autocorrelation inference across missing years. Cases 1–7 validate consecutive-year inference; case 8 validates aggregation/eligibility only. Do not silently treat adjacent retained observations as consecutive calendar years. An independently tested gap policy is a required Oier review item; no inference sign-off for gapped series until it is resolved (see `METHODS_REVIEW.md`).

## 4. Season construction
- DJF 2010 = Dec 2009 + Jan 2010 + Feb 2010.
- **Trade-off:** the alternative (labelling DJF by December's year) is also common. Pick one and say which in the UI tooltip.
- **Decision:** DJF is labelled by January's year. A custom season wrapping once across New Year is labelled by its final month's year; months before the wrap belong to year−1. The requested period is January of start through December of end, inclusive. Drop a season partly outside that window even if the source contains the extra months. Never use out-of-window observations.
- For 2001–2012, DJF 2001 and DJF 2013 are dropped; eligible labels are 2002–2012. Missing data within an eligible slot invalidates it under §3. The tooltip states the year convention.

## 5. The series the verdict tests
- The analysis uses:
  - The **yearly series**: one value per year, either the annual mean or the seasonal mean if a season filter is on.
  - Monthly anomalies (each value minus that calendar month's average over the period) are used only for display and correlation.
- **Trade-off:** testing monthly data directly as independent observations gives about 12× more points but ignores seasonal and serial dependence. Yearly aggregation reduces these problems; it does not eliminate residual autocorrelation.
- **Decision:** Accept: verdicts on the yearly series; monthly anomalies only for display/correlation.

## 6. Mann–Kendall, OLS and the combined verdict

- **Decision:** adopt **Option B** in the golden answer key: `p_used = max(p_MK_HR, p_OLS_AR1)` when both results are finite. Apply §9 to this value. Thus Confirmed requires both tests to reject at 0.05 when both are available.
- The tests use the same observations. They are not independent confirmations, and p_used is a combination rule rather than a third independent test. Taking their maximum does not repair miscalibrated component tests.

### Mann–Kendall and Hamed–Rao

For ordered values, `S = sum(sign(y[j]-y[i]))` over all i < j. With tie-group sizes u:

```text
Var0(S) = [n(n-1)(2n+5) - sum(u(u-1)(2u+5))] / 18
tau = S / [n(n-1)/2]
```

This is the golden key's score-normalised tau, not a tie-normalised tau-b. For consecutive-year data, detrend by subtracting `Sen_slope * index` (index 1…n), assign average ranks to ties and centre the ranks as a. Compute the biased ACF, `rho[k] = sum(a[i]*a[i+k])/sum(a[i]^2)`. Include ALL lags 1…n−1 whose absolute ACF exceeds `z_0.975/sqrt(n)`, not only lag 1.

```text
F_raw = 1 + 2/[n(n-1)(n-2)] *
        sum((n-k)(n-k-1)(n-k-2)*rho[k] for included lags k)
F = max(1, F_raw)
Var_HR(S) = F * Var0(S)
```

The floor at 1 is a project modification supported by our simulation. Compare the **uncapped** reference only with **pymannkendall 1.4.3**; do not require the capped app result to reproduce its uncapped p-value. Pin the comparison version because later implementations may differ.

Use continuity correction: Z = (S−1)/sqrt(Var_HR) for positive S, (S+1)/sqrt(Var_HR) for negative S, and zero for S = 0. Use the two-sided normal tail `2*normal.sf(abs(Z))`. For identical values, S = 0, p = 1 and Sen slope/CI = 0. Zero variance in detrended ranks gives F = 1. Unexpected nonfinite results are unavailable, never evidence of significance.

### OLS with AR(1)-adjusted uncertainty

Fit intercept and slope b against actual calendar years. For residuals e:

```text
sigma = sqrt(sum(e^2)/(n-2))
SE_OLS = sigma / sqrt(sum((t-mean(t))^2))
r1 = sum(e[i]*e[i+1]) / sum(e^2)
n_eff = n                       if r1 <= 0
        n*(1-r1)/(1+r1)          otherwise
SE_adj = SE_OLS * sqrt((n-2)/(n_eff-2))
df = n_eff-2
```

Use a t distribution on this noninteger df for the two-sided p-value and `b ± t_0.975,df * SE_adj` for the CI (Santer et al. 2000). r1 is the stated cross-product ratio, not Pearson correlation of the residual slices. Do not floor n_eff at 3 or allow it to exceed n.

If n_eff <= 2, adjusted OLS uncertainty, p and CI are unavailable. **Decision:** retain the golden-key fallback to finite capped MK alone, disclose that the second test is unavailable and hide years-needed. This is an exception to the two-test rule, requires a fixture before sign-off, and must not be described as test agreement. If neither usable p-value is available, withhold significance conclusions.

For exactly constant data, use r1 = 0, slope/SE/CI = 0 and p = 1. For an exactly nonzero linear trend with zero residual variance, use r1 = 0, zero SE, a point CI and p = 0. Add separate tests for these degeneracies; the current key does not exercise them.

### Warnings and calibration

- "Tests disagree" means exactly one of the two available p-values is below 0.05. Agreement is unavailable if either test is unavailable.
- Flag residual r1 > 0.3 as an autocorrelated series. This is a display heuristic; explain that uncertainty estimates can be optimistic for persistent, short series.
- Stored n = 24 simulations give Option B null rejection rates of 2.83%, 7.39% and 12.12% for true phi = 0, 0.3 and 0.6. These Gaussian AR(1) experiments are not guarantees for real Earth data. Do not claim a universal 5% false-positive rate or that the correction solves autocorrelation. Source: `FALSE_POSITIVE_SIM.md` and `tests/fixtures/golden/sim_results.json`.

## 7. Slope shown to users
- **Decision:** headline Sen's slope: the median of all `(y[j]-y[i])/(t[j]-t[i])`, i < j, using actual calendar-year differences. Show its approximate 95% CI; show OLS slope and adjusted CI in Scientist view.
- Sort the N = n(n−1)/2 pairwise slopes. Let C = z_0.975*sqrt(Var_HR(S)). Lower and upper bounds use **1-indexed** ranks `(N-C)/2` and `(N+C)/2 + 1`. Clamp ranks to [1, N] and linearly interpolate neighbouring slopes. Do not round to integer ranks. This is the Gilbert-rank convention encoded in the key, using capped-HR variance.
- This is not a CI obtained by inverting the combined Option B rule. It can exclude zero while OLS prevents Confirmed. Do not promise exact agreement between CI exclusion and verdict tier.

## 8. Confidence level
- **Decision:** 95% two-sided intervals everywhere. Distinguish a slope CI from uncertainty around a fitted line. Neither is a probability that a particular physical explanation is true.

## 9. Verdict tiers

| Tier | Rule after the eligibility gate |
|---|---|
| **Confirmed** | p_used < 0.05 |
| **Not proven yet** | 0.05 ≤ p_used < 0.20. Show years-needed only when §10 allows it. |
| **No case** | p_used ≥ 0.20 |
| **Too short to judge** | Fails §2 or §3 |

- **Decision:** retain the 0.05 / 0.20 display tiers, applied to combined p_used (§6, including the explicitly labelled fallback). The 0.20 boundary is a communication convention, not a second significance threshold.
- "Not proven yet" means evidence is insufficient at 0.05; the pattern could reflect change or variability. It does not mean almost significant or promise that a longer record will confirm it. "No case" does not mean no change, no important effect, or proof of natural variability. A p-value is not the probability a trend is real or that chance caused it. Significance does not establish causation.

## 10. Years until significant
- **Decision:** retain the key's approximate signal-to-noise calculation using OLS b, residual σ and φ = max(r1, 0), assuming slope and noise stay constant. This is inspired by Weatherhead et al. (1998); it is not that paper's 90%-power detection-time formula.

```text
Var_b(m) = 12*sigma^2/[m(m^2-1)] * (1+phi)/(1-phi)
n_eff(m) = m*(1-phi)/(1+phi)
```

Search integers m from n through n+50 inclusive, skipping n_eff(m) <= 2. The first m satisfying `abs(b)/sqrt(Var_b(m)) >= t_0.975,n_eff(m)-2` gives m−n extra years. Starting at n matches the key: zero is possible and must not silently become one.

Show only for Not proven yet, finite usable inputs and a solution within 50 extra years (the key also requires p_used < 0.5, redundant within this tier). Hide for failed eligibility, unavailable OLS uncertainty, zero slope, zero residual noise, φ >= 1 or no solution. A hidden estimate is not proof a trend cannot exist.

The threshold roughly targets even odds in an idealised single-test calculation; it does not guarantee even odds for Option B. Stored simulations support approximately 50% rejection for uncorrelated noise, not persistent noise. Wording must state that the estimate is approximate and assumes unchanged slope/noise; never promise a future significance date. Option B detection-power validation remains a review item.

## 11. Reporting magnitude
- Reporting conventions:
  - The slope per decade in the variable's units, plus the total change over the period (slope × years).
  - **% of the period mean** is shown only for ratio-scale variables (precipitation, AOD, soil wetness, cloud %, radiation). It is never shown for temperatures in °C or for pressure anomalies.
- **Decision:** slopes are per year internally and per decade on display (×10). Total fitted change is `Sen_slope * (last_valid_year-first_valid_year)`, not slope times observation count. Relative change is `100 * 10 * Sen_slope / period_mean`, per decade, for ratio-scale variables only; hide when abs(mean) <= 1e-9 in stored units. Celsius temperatures and pressure anomalies never get this percentage. Cloud-cover percentage-point change differs from relative percent change.

## 12. Correlation between two variables
- Correlation conventions:
  - Compute on de-seasoned monthly anomalies. Pearson is primary; Spearman is also shown.
  - Report both the raw and the detrended correlation (each series linearly detrended).
  - p-values use the effective n, n_eff = n·(1−r₁ₓr₁ᵧ)/(1+r₁ₓr₁ᵧ) (Bretherton et al. 1999).
  - Search lags of −6…+6 months and report the best lag with a note that searching 13 lags inflates the chance of a spurious peak. Apply the Bonferroni ×13 adjustment to the best-lag p.
  - **Warning rule:** if the raw |r| ≥ 0.5 but the detrended |r| < 0.3, show "Both are trending, but that alone doesn't mean they're connected."
- **Decision:** accept. Use finite values paired on matching calendar months, without bridging missing months when shifting lags. Cap effective n at paired n; n_eff <= 2 or a constant series makes inference unavailable. Estimate r1 on the appropriate raw/detrended series. Select the largest absolute Pearson r; positive lag L pairs x(t) with y(t+L), so x leads y. Report `min(1, 13*p_best)`. The 0.5/0.3 warning thresholds are heuristics. Correlation/lag selection does not establish causation. Independent correlation fixtures remain required; trend fixtures do not validate this feature.

## 13. Mirror rule
- Mirror conventions:
  - Candidates are regions of the **same type** as the case region, excluding any region that contains or is contained by it.
  - Both trends must be Confirmed under §6/§9, have opposite nonzero Sen-slope signs, and pass BH (§14).
  - Rank by |Z_MK| and show the top 3. If none qualify, show "No mirror found".
- **Trade-off:** even calibrated individual 5% tests produce chance discoveries when many regions are searched. Our persistence simulations also show that component tests need not be calibrated. BH is required by the decision below; it cannot resolve that separate calibration problem.
- **Decision:** same type, same variable, period AND season; exclude the case itself and all containing/contained regions. Both regions, including the case, must pass the same all-region BH family (§14). Apply BH before filtering mirror candidates; never rerun it on a smaller mirror subset. Rank by descending absolute capped-MK Z and return at most three. If the case fails BH or no candidate qualifies, return No mirror found. Opposite directions alone do not establish a shared cause; explanations need process-card support.

## 14. Many regions at once: trend-map dots and the scanner
- The map and scanner use Benjamini–Hochberg (BH) at q = 0.05. A single-case verdict uses unadjusted combined p_used.
- **Trade-off:** this is stricter and more defensible ("field significance") than raw p everywhere, and a strong answer to the judge question "with 300 regions, aren't some significant by luck?"
- **Decision:** apply BH to the same p_used that drives each case verdict. Map family: all regions of all types with finite eligible inference for one variable × period × season, together (golden case 9). Exclude no-data/ineligible regions from m, not from displayed geography. Do not partition by type or the user's selected regions. Scanner family: all valid variable × season tests evaluated for one region and period in that scan; adjust before selecting findings.
- Sort m p-values ascending; take the largest k with p_(k) <= (k/m)*0.05, then reject ranks 1…k. No qualifying k means no discoveries. Adjusted p-values use reverse cumulative minima of m*p_(i)/i, capped at 1 and restored to original order. An empty family has no discoveries.
- BH addresses multiplicity under its dependence assumptions; it does not repair component-test calibration or guarantee 95% of individual map discoveries are genuine. Regions overlap spatially. Retain the §6 caveat; see Wilks (2016).

## 15. Change point (Could)
- **Decision:** Pettitt, p < 0.05, if this optional feature is implemented and separately validated. Label "possible shift around YYYY". A step can trigger a monotonic test; significance alone does not prove steady linear change. The current nine-case key does not validate Pettitt.

## 16. Assumptions and limitations
- **Decision:** explain the following for users in `LIMITATIONS.md` and the pitch.

- linear trends only;
- monotonic tests;
- reanalysis is a model product;
- regional means hide spatial patterns;
- short records;
- approximate serial-dependence corrections and their observed calibration limits;
- seasonally patterned missingness and annual means;
- multiple testing and selective demonstration cases.

Use "nominal 5% significance threshold", not "5% chance this result is wrong". Matching a reference validates arithmetic, not calibration on real data. Do not extrapolate a fitted trend as a forecast, infer causation from correlation, or promise eventual confirmation.

## 17. Verification and review gate

- **Decision:** require agreement with `golden_expected.json` before implementation sign-off. Integers, booleans, tiers, year lists, years-needed and IDs are exact. Slopes, means, CI endpoints, n_eff and r1: relative 1e-9, absolute 1e-12 near zero. p-values, Z, t and BH-adjusted p: relative 1e-7; handle expected zero explicitly, rather than using a loose absolute tolerance that masks tiny p-values.
- Cases 1–7 cover consecutive-year trends/ties/gates/disagreement; case 8 covers aggregation/edges/coverage; case 9 covers BH/mirrors. Presence of files does not establish that the test harness consumes them.
- Oier must review `METHODS_REVIEW.md`, integrate the key and provide comparisons. Missing-year inference, fallback/degenerate cases, correlation and Option B detection-power validation remain explicit review limits. This documentation commit does not imply review or deployment success. Leave the playbook review checkbox and H14 validity checkpoint unticked until their actual requirements are met.

## References
- Hamed, K. H., & Rao, A. R. (1998). A modified Mann-Kendall trend test for autocorrelated data. *J. Hydrology*.
- Sen, P. K. (1968). Estimates of the regression coefficient based on Kendall's tau. *JASA*.
- Gilbert, R. O. (1987). *Statistical Methods for Environmental Pollution Monitoring*, §6.5. The interpolated rank convention is specified in §7 and the golden key.
- Santer, B. D., et al. (2000). [Statistical significance of trends and trend differences in layer-average atmospheric temperature time series](https://doi.org/10.1029/1999JD901105). *JGR*.
- Weatherhead, E. C., et al. (1998). [Factors affecting the detection of trends: Statistical considerations and applications to environmental data](https://doi.org/10.1029/98JD00995). *JGR*. Our approximate threshold is specified in §10.
- Bretherton, C. S., et al. (1999). The effective number of spatial degrees of freedom of a time-varying field. *J. Climate*.
- Benjamini, Y., & Hochberg, Y. (1995). Controlling the false discovery rate. *JRSS-B*.
- Wilks, D. S. (2016). [“The Stippling Shows Statistically Significant Grid Points”: How Research Results Are Routinely Overstated and Overinterpreted, and What to Do about It](https://journals.ametsoc.org/view/journals/bams/97/12/bams-d-15-00267.1.xml). *BAMS*.
- Pettitt, A. N. (1979). A non-parametric approach to the change-point problem. *Applied Statistics*.
- [pymannkendall v1.4.3 source](https://github.com/mmhs013/pyMannKendall/blob/v1.4.3/pymannkendall/pymannkendall.py), for the uncapped reference algorithm. The app follows this spec and the capped golden key.

## Change log

| When | Section | Change | Why |
|---|---|---|---|
| H0 | — | v0 starter written | — |
| 2026-11-14 | 6, 9, 13, 14 | Adopt Option B, cap HR at 1, define fallback/warnings and combined-p BH families | Reconcile independent golden key and stored simulation. |
| 2026-11-14 | 2–5, 7, 10–12, 17 | Specify coverage denominator, seasonal edges, residual ACF, interpolated Sen CI, detection-estimate limits, units and verification | Remove ambiguities and distinguish tested conventions from pending validation. |
