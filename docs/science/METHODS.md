# METHODS: statistics spec (source of truth for `api/engine/`)

**Owner:** Methods & Validity lead. **Implementer:** Coder B. **Version:** v0 (starter). Target: v1 by H2.

Each section asks one question. It gives a **suggested default**, the **trade-off** (including what a judge might challenge) and a **Decision:** line. Fill in every Decision line; Coder B implements exactly what is written there. Later changes go into the change log at the bottom.

---

## 1. Regional averaging (fixed by the pipeline; for reference only)
- Each region's value is the cos(latitude)-weighted mean of the grid cells whose centres fall inside the region.
- A region too small to contain any cell centre uses the nearest cell instead, and the UI flags it.
- **Decision:** _accept / change: ____

## 2. Minimum series length for a verdict
- **Suggested default:** at least **10 valid yearly values**. Below that the verdict is "Too short to judge".
- **Trade-off:** Mann-Kendall has very little power below about 10 points. A higher minimum is more defensible, but it blocks short satellite records (e.g. CERES from 2001 gives about 24 years, which is fine).
- **Decision:** ____

## 3. Missing data
- **Suggested default:**
  - A season counts for a year if at least 2 of its 3 months are present. A custom set of months counts if at least ⅔ of them are present.
  - An annual value needs at least 10 of 12 months.
  - A series needs at least 80% of its years valid.
- **Trade-off:** looser rules keep more data, but risk biased means (for example, a missing winter month inflates the annual mean).
- **Decision:** ____

## 4. Season construction
- **Suggested default:** DJF belongs to the year of its January, so "DJF 2010" = Dec 2009 + Jan 2010 + Feb 2010. An incomplete season at either end of the period is dropped. Custom month sets that cross the new year follow the same rule.
- **Trade-off:** the alternative (labelling DJF by December's year) is also common. Pick one and say which in the UI tooltip.
- **Decision:** ____

## 5. The series the verdict tests
- **Suggested default:**
  - The **yearly series**: one value per year, either the annual mean or the seasonal mean if a season filter is on.
  - Monthly anomalies (each value minus that calendar month's average over the period) are used only for display and correlation.
- **Trade-off:** testing monthly data directly gives about 12× more points, but those points are strongly autocorrelated and seasonal, which inflates significance. Yearly values are what NASA's example uses and are much easier to defend.
- **Decision:** ____

## 6. Primary test and corroborating test
- **Suggested default:**
  - **Primary:** modified Mann-Kendall with the Hamed & Rao (1998) variance correction, two-sided, α = 0.05.
  - **Corroborating:** OLS with an AR(1)-adjusted standard error. Use the effective n, n_eff = n·(1−r₁)/(1+r₁) (Santer et al. 2000), with a t distribution on n_eff−2 degrees of freedom.
  - **If the two tests disagree:** show a "tests disagree, treat with caution" badge. The verdict follows Mann-Kendall.
- **Trade-off:** pre-whitening (Yue-Pilon) is an alternative fix for autocorrelation. Hamed-Rao is easier to explain. Ordinary MK understates p-values when the data are autocorrelated, and a judge may ask about exactly this.
- **Decision:** ____

## 7. Slope shown to users
- **Suggested default:** Sen's slope with its 95% CI from the MK variance as the headline. The OLS slope appears in the Scientist view.
- **Decision:** ____

## 8. Confidence level
- **Suggested default:** 95% everywhere.
- **Decision:** ____

## 9. Verdict tiers

| Tier | Suggested rule |
|---|---|
| **Confirmed** | MK p < 0.05 |
| **Not proven yet** | 0.05 ≤ p < 0.20. Show years until significant. |
| **No case** | p ≥ 0.20 |
| **Too short to judge** | Fails §2 or §3 |

- **Trade-off:** a judge may see the 0.20 band as soft. The framing must stay honest: "Not proven yet" means *the direction is suggestive but the evidence is not sufficient*. It never means "almost significant". The alternative is to use only two tiers and always show years until significant.
- **Decision:** ____

## 10. Years until significant
- **Suggested default:**
  - For a yearly series with slope b, residual SD σ and lag-1 autocorrelation φ, use Var(b) ≈ 12σ² / (n(n²−1)) · (1+φ)/(1−φ).
  - Find the smallest n* at which |b| / SE(n*) ≥ t_crit(n_eff−2), and show "≈ (n* − n) more years at the current rate" (after Weatherhead et al. 1998).
  - Hide the estimate when p ≥ 0.5 or n* − n > 50 ("not detectable soon at this rate").
  - Coder B checks the formula with a Monte-Carlo test.
- **Trade-off:** the estimate assumes the slope and the noise stay constant. Say so in a tooltip.
- **Decision:** ____

## 11. Reporting magnitude
- **Suggested default:**
  - The slope per decade in the variable's units, plus the total change over the period (slope × years).
  - **% of the period mean** is shown only for ratio-scale variables (precipitation, AOD, soil wetness, cloud %, radiation). It is never shown for temperatures in °C or for pressure anomalies.
- **Decision:** ____

## 12. Correlation between two variables
- **Suggested default:**
  - Compute on de-seasoned monthly anomalies. Pearson is primary; Spearman is also shown.
  - Report both the raw and the detrended correlation (each series linearly detrended).
  - p-values use the effective n, n_eff = n·(1−r₁ₓr₁ᵧ)/(1+r₁ₓr₁ᵧ) (Bretherton et al. 1999).
  - Search lags of −6…+6 months and report the best lag with a note that searching 13 lags inflates the chance of a spurious peak. A Bonferroni ×13 adjustment on the best-lag p is optional.
  - **Warning rule:** if the raw |r| ≥ 0.5 but the detrended |r| < 0.3, show "Both are trending, but that alone doesn't mean they're connected."
- **Decision:** ____

## 13. Mirror rule
- **Suggested default:**
  - Candidates are regions of the **same type** as the case region, excluding any region that contains or is contained by it.
  - Both trends must be Confirmed (p < 0.05) and of opposite sign.
  - Rank by |Z_MK| and show the top 3. If none qualify, show "No mirror found".
- **Trade-off:** with about 300 regions, roughly 15 will look "Confirmed" by chance at α = 0.05. Consider requiring the mirror to pass the FDR rule in §14.
- **Decision:** ____

## 14. Many regions at once: trend-map dots and the scanner
- **Suggested default:**
  - The trend map's "significant" dots use the Benjamini-Hochberg FDR at q = 0.05 across all regions. A single case's verdict uses its raw p.
  - The scanner applies BH-FDR at q = 0.05 across variables × seasons.
- **Trade-off:** this is stricter and more defensible ("field significance") than raw p everywhere, and a strong answer to the judge question "with 300 regions, aren't some significant by luck?"
- **Decision:** ____

## 15. Change point (Could)
- **Suggested default:** the Pettitt test, p < 0.05. Show the change year on the chart as "possible shift around YYYY".
- **Decision:** ____

## 16. Assumptions and limitations
These are listed and explained for users in `LIMITATIONS.md`:
- linear trends only;
- monotonic tests;
- reanalysis is a model product;
- regional means hide spatial patterns;
- short records.

## References
- Hamed, K. H., & Rao, A. R. (1998). A modified Mann-Kendall trend test for autocorrelated data. *J. Hydrology*.
- Sen, P. K. (1968). Estimates of the regression coefficient based on Kendall's tau. *JASA*.
- Santer, B. D., et al. (2000). Statistical significance of trends and trend differences in layer-average atmospheric temperature time series. *JGR*.
- Weatherhead, E. C., et al. (1998). Factors affecting the detection of trends. *JGR*.
- Bretherton, C. S., et al. (1999). The effective number of spatial degrees of freedom of a time-varying field. *J. Climate*.
- Benjamini, Y., & Hochberg, Y. (1995). Controlling the false discovery rate. *JRSS-B*.
- Pettitt, A. N. (1979). A non-parametric approach to the change-point problem. *Applied Statistics*.

## Change log

| When | Section | Change | Why |
|---|---|---|---|
| H0 | — | v0 starter written | — |
