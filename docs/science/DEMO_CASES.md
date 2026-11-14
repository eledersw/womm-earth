# DEMO CASES

**Owner:** Methods lead. **Reviewed:** 2026-11-14 on sergio/methods. **Selection:** 3 FINAL + 2 BACKUP scientific cases.

FINAL means the scientific example is selected and independently reproducible. After the team's upstream request fix, the unmodified case_cli.py succeeds for all five selected cases (see demo/cli_checks.json). The engine still differs from METHODS v1 in uncertainty/reporting, so Oier must align and verify those fields before the team presents the reference numbers as current app output. Browser/production smoke is separate. No validity checkpoint is granted here.

All numerical results below come from demo/results.json, calculated from actual POWER monthly regional data using the existing independent golden reference and cross-checked with scipy, pymannkendall 1.4.3 and statsmodels. The eight candidates were declared before results were inspected; all are retained in the evidence. Dates and seasons were not adjusted to manufacture significance. Selection is illustrative screening, not a field-wide discovery claim.

## Selected cases at a glance

Slopes and Sen 95% intervals are per decade. MK is **capped** Hamed–Rao; OLS has the specified AR(1) uncertainty adjustment. p_used is the larger p-value (METHODS v1). “Confirmed” denotes a nominal threshold under assumptions, not certainty or causation.

| Selection | Question | Variable / region / period / season | Sen slope per decade | MK p | OLS p | v1 verdict |
|---|---|---|---|---|---|---|
| FINAL 1 | Is Colorado getting warmer? | T2M / US-CO / 1981–2025 / Annual | +0.337908 °C | 0.0000949505 | 0.0000228739 | Confirmed |
| FINAL 2 | Is Arizona's root-zone soil getting drier? | GWETROOT / US-AZ / 1981–2025 / Annual | −0.00354785 index units | 0.0492702 | 0.0249809 | Confirmed, close to the threshold |
| FINAL 3 | Is Wisconsin's winter snowpack getting shallower? | SNODP / US-WI / 1981–2025 requested / DJF | −0.564039 cm | 0.0205492 | 0.0306490 | Confirmed |
| BACKUP 1 | Do Wisconsin's smoky summers imply a steady aerosol trend? | AOD_55 / US-WI / 2002–2025 / JJA | +0.00199648 dimensionless | 0.980211 | 0.321152 | No case |
| BACKUP 2 | Is Wisconsin receiving more precipitation on average? | PRECTOTCORR / US-WI / 1981–2025 / Annual | +0.0283055 mm/day | 0.405693 | 0.334902 | No case |

These are cos(latitude)-weighted **bounding-rectangle** averages, not exact state polygon averages. Metadata and reporting caveats are in DATA_CATALOG.md. The slight rectangle extensions and coarse grids matter, especially near the Great Lakes and mountains.

## FINAL 1: Is Colorado getting warmer?

- **Case ID:** co-temperature.
- **Variable/source:** T2M, NASA POWER / MERRA-2 reanalysis; native 0.5° latitude × 0.625° longitude grid.
- **Region:** US-CO; actual bbox [−109.04667, 37.00085, −102.01278, 41.00086].
- **Period/season:** 1981–2025, Annual; 45 valid consecutive yearly means.
- **Result:** Sen +0.337908 °C/decade; approximate Sen CI [0.194700, 0.490069] °C/decade. MK p = 0.0000949505; adjusted OLS p = 0.0000228739; p_used = 0.0000949505. Both tests agree; residual r1 = 0.00727. Years-needed is hidden because the verdict is already Confirmed.
- **Literature check:** NOAA/NCEI's Colorado state summary reports observed warming, including all seasons [1]. Colorado State University's assessment also documents historical warming [2]. **Agreement:** yes on warming direction; neither source validates this exact POWER rectangle, period, slope or p-value.
- **Process card needed:** regional-warming; explain reanalysis and distinguish a measured trend from attribution.
- **Demo talking point:** “Colorado's yearly average rises by about 0.34 °C per decade in this record, and both tests pass the threshold.”
- **Caveats:** a model/data-assimilation estimate, not every local thermometer; mountain elevation differences are unresolved. Do not express Celsius warming as a percent or forecast a future temperature by extending the line.
- **Decision:** FINAL. Strong numerical signal, low residual persistence and clear external agreement make this the simplest first example.
- **Case URL:** [Open Colorado](https://womm-earth.vercel.app/?v=T2M&r=US-CO&from=1981&to=2025&s=ANN&lvl=student). Press the analysis button after opening; live readiness remains pending.

## FINAL 2: Is Arizona's root-zone soil getting drier?

- **Case ID:** az-wetness.
- **Variable/source:** GWETROOT, NASA POWER / MERRA-2 land model; dimensionless 0–1 wetness index, approximately the root-zone layer.
- **Region:** US-AZ; actual bbox [−114.83595, 31.32421, −109.04667, 37.00415].
- **Period/season:** 1981–2025, Annual; 45 valid consecutive yearly means.
- **Result:** Sen −0.00354785 wetness-index units/decade; approximate Sen CI [−0.00746939, −0.0000114992]. MK p = 0.0492702; adjusted OLS p = 0.0249809; p_used = 0.0492702. Tests agree; residual r1 = 0.10806. Years-needed is hidden.
- **Literature check:** Williams, Cook and Smerdon (2022) document exceptional southwestern North American soil-moisture drought [3]. **Agreement:** compatible drying direction, not a replication: the paper uses a wider region, different moisture data and a different period/statistic. It does not validate the exact Arizona index trend.
- **Process card needed:** southwest-soil-moisture; model soil wetness versus groundwater, and the distinction between drought evidence and causal attribution.
- **Demo talking point:** “The root-zone wetness index decreases, but its combined p-value is only just below 0.05—this is a good place to discuss uncertainty.”
- **Caveats:** the confidence interval barely excludes zero, and the selected examples were screened rather than a preregistered confirmatory study. Do not call this a robust regional discovery, a measured fall in groundwater, a loss of that fraction of water volume, or proof that warming caused this particular trend. Land only; use the absolute index unit.
- **Decision:** FINAL, as a deliberately cautious threshold example. Do not hide the near-threshold result or call it overwhelming evidence.
- **Case URL:** [Open Arizona](https://womm-earth.vercel.app/?v=GWETROOT&r=US-AZ&from=1981&to=2025&s=ANN&lvl=student).

## FINAL 3: Is Wisconsin's winter snowpack getting shallower?

- **Case ID:** wi-snow.
- **Variable/source:** SNODP, NASA POWER / MERRA-2 model snow depth, in centimetres.
- **Region:** US-WI; actual bbox [−92.89652, 42.4928, −86.26452, 47.3091].
- **Period/season:** requested 1981–2025, DJF. Valid labels are **1982–2025**, 44 consecutive winters. DJF 1981 is excluded because December 1980 lies outside the requested window; January's year labels DJF.
- **Result:** Sen −0.564039 cm/decade; approximate Sen CI [−1.204755, −0.056451] cm/decade. MK p = 0.0205492; adjusted OLS p = 0.0306490; p_used = 0.0306490. Both tests agree; residual r1 = −0.04210, so n_eff is capped at 44. Years-needed is hidden.
- **Literature check:** Suriano, Robinson and Leathers (2019) report declining basin-wide snow depth over their Great Lakes study period, with substantial spatial and period dependence [4]. **Agreement:** compatible depth direction; their basin/period and observational product differ from this Wisconsin-area model series. Wisconsin research can find increasing snowfall even while snow depth behaves differently [7]; do not confuse these quantities.
- **Process card needed:** snow-depth-and-season; snowpack depth versus snowfall and snow-water equivalent, plus the DJF convention.
- **Demo talking point:** “We test one complete winter per year; this modelled winter snow depth declines by about 0.56 cm per decade.”
- **Caveats:** monthly depth is not accumulated snowfall, snow-water equivalent or snow-cover duration. The bbox includes lake/coastal cells; model and boundary effects require care. Do not extrapolate to every Wisconsin location or claim attribution from the trend alone.
- **Decision:** FINAL. Adds a different variable and demonstrates why season construction matters.
- **Case URL:** [Open Wisconsin snow](https://womm-earth.vercel.app/?v=SNODP&r=US-WI&from=1981&to=2025&s=DJF&lvl=student).

## BACKUP 1: Do Wisconsin's smoky summers imply a steady aerosol trend?

- **Case ID:** wi-aod.
- **Variable/source:** AOD_55, NASA POWER / CERES SYN1deg, with satellite-constrained and model-assisted aerosol information. **Not** the Aqua-only MYD08_M3/Giovanni hero product.
- **Region/period/season:** US-WI bbox above, 2002–2025, JJA; 24 complete yearly summer means.
- **Result:** Sen estimate +0.00199648 AOD/decade, CI [−0.0353140, 0.0474777]; MK p = 0.980211, adjusted OLS p = 0.321152, p_used = 0.980211, No case. Tests agree. Years-needed is hidden; do not show the reference's undisplayed raw estimate.
- **Literature check:** Jin and Pryor (2020) find geographically/seasonally different aerosol trends [5]; Burke et al. (2023) examine wildfire contributions to changes in US surface PM2.5 [6]. **Agreement:** contextual, not a same-measurement replication. Surface smoke pollution, column AOD, changing periods and episodic fires are different questions. Neither paper proves that this POWER series has no underlying change.
- **Process card needed:** smoke-aod, including why column AOD is not surface PM2.5 or a smoke-only measurement.
- **Demo talking point:** “A few memorable smoky summers do not, by themselves, establish a steady trend in this 24-year AOD series.”
- **Decision:** BACKUP. Useful hypothesis-testing example and a direct aerosol link to the challenge, but never pitch it as confirmed worsening smoke or as an exact rebuild of NASA's Aqua example.
- **Case URL:** [Open Wisconsin AOD](https://womm-earth.vercel.app/?v=AOD_55&r=US-WI&from=2002&to=2025&s=JJA&lvl=student).

## BACKUP 2: Is Wisconsin receiving more precipitation on average?

- **Case ID:** wi-precipitation.
- **Variable/source:** PRECTOTCORR, corrected MERRA-2 precipitation supplied by POWER, in mm/day.
- **Region/period/season:** US-WI bbox above, 1981–2025, Annual; 45 valid yearly means.
- **Result:** Sen +0.0283055 mm/day per decade, CI [−0.0288060, 0.0955454]; MK p = 0.405693, adjusted OLS p = 0.334902, p_used = 0.405693, No case. Tests agree; years-needed is hidden.
- **Literature check:** the USGS Wisconsin streamflow/climate study examines positive precipitation changes across stations and several historical windows [7]. **Agreement:** positive estimate is directionally compatible; our lack of detection is not a replication or a refutation of their station-based, differently bounded analyses.
- **Process card needed:** precipitation-variability; rates versus accumulated totals and dependence on region/period.
- **Demo talking point:** “The estimated direction is upward, but these tests do not detect a clear trend in this particular record.”
- **Decision:** BACKUP. A useful insufficient-evidence example if the aerosol discussion is too complex.
- **Case URL:** [Open Wisconsin precipitation](https://womm-earth.vercel.app/?v=PRECTOTCORR&r=US-WI&from=1981&to=2025&s=ANN&lvl=student).

## Complete candidate audit and dropped ideas

| Candidate | Reference result | Current local engine tier | Decision |
|---|---|---|---|
| co-temperature | +0.337908 °C/decade; p_used 0.0000949505 | Confirmed | FINAL 1 |
| az-wetness | −0.00354785 index/decade; p_used 0.0492702 | Confirmed | FINAL 2; borderline caveat required |
| wi-snow | −0.564039 cm/decade; p_used 0.0306490 | Confirmed | FINAL 3 |
| wi-aod | +0.00199648 AOD/decade; p_used 0.980211 | No case | BACKUP 1 |
| wi-precipitation | +0.0283055 mm/day per decade; p_used 0.405693 | No case | BACKUP 2 |
| aral-wetness | **Positive** +0.00241512 index/decade; MK p 0.00635939, OLS p 0.420620; **No case** | **Confirmed** | DROP: engine/spec disagreement and opposite to the proposed drying story. Soil index is not Aral Sea volume. |
| wi-temperature | +0.302111 °C/decade; p_used 0.0379725 | Confirmed | Not selected; duplicates the temperature lesson. Different windows can differ from century-scale summer assessments. |
| nv-precipitation | −0.0260653 mm/day per decade; p_used 0.277551 | No case | Not selected; duplicates the insufficient-evidence lesson. |

All eight candidates returned real provider data, had consecutive valid yearly series and matched the engine's monthly-to-yearly aggregation in this check. The subsequent unmodified CLI check succeeds for the five selections, with matching verdict labels. Numerical uncertainty still differs between the current engine and v1. The Wisconsin precipitation backup additionally exposes a reporting mismatch: the current CLI supplies 27 years-needed for No case, whereas v1 hides the estimate in that tier. Matching verdict labels is not complete engine validation.

**Arctic/global comparison:** not selected. POWER Regional restricts longitude spans to at most 10°; the existing Arctic/world bounds exceed this. The current land/world bbox path also does not impose a land mask, so it must not be sold as a world-land comparison.

**Sahel–Mediterranean mirror:** not selected. The Sahel test returned a 422 maximum-longitude-span error; both proposed regions exceed the verified longitude limit. The starter proposal also mixed seasons, which violates the same-season mirror rule. A published Mediterranean precipitation assessment emphasises strong temporal/spatial variability [8]; do not promise an opposite-trend mirror before measuring and applying BH.

**City OMI NO2 / manual hero:** omitted. It would require a separately verified data source/import, while the selected cases use already reviewed POWER parameters. No new data source is necessary to satisfy this challenge's variable-choice, time-series and significance scope.

## Reproduction and handoff

- Run demo/run_candidates.py with the isolated science environment. It reads existing region bounds, fetches the declared candidates with a valid alphanumeric provider user, saves monthly CSVs, computes independent v1 results, compares the current engine, and runs the unmodified CLI.
- Evidence: demo/results.json; demo/series/*.csv; source hashes, API headers, library versions and aggregation details are retained. The CSVs are scientific validation artifacts, not a production cache or an imported hero service.
- Initial unmodified CLI check: AOD_55 / US-WI / 2002–2025 / JJA returned exit code 2 with 422 “NASA POWER cannot serve this variable for the selected request.” This is a historical snapshot in results.json. After the team's upstream alphanumeric-user fix, check_cli.py ran **all five selections successfully**, without patching the application. Current outputs and the source hash are in cli_checks.json. Neither snapshot is a browser/production smoke test.
- **Oier:** the user fix is verified locally. Address regional-size limitations where needed and align uncertainty, verdict combination and years-needed visibility with METHODS v1 and the existing golden key. Re-run the exact selections through the real app; match numerical fields before sign-off. The Aral verdict and Wisconsin precipitation years-needed mismatches are concrete regression examples.
- **Edur:** build the demo story from the three FINAL selections and two backups above. Literature is external context, not proof of our exact slope, p-value or cause. No process-card content or final presentation copy is claimed complete here.
- **Ekaitz:** after numerical alignment, use the exact variable/region/period/season keys for tours/explanations; only add physical explanations after the relevant approved process cards exist.
- Production smoke, full validity approval, process cards and pre-generated explanations remain their separate tasks. Do not mark them complete because this scientific selection is complete.

## Literature

1. NOAA/NCEI and NCICS, [Colorado State Climate Summary](https://statesummaries.ncics.org/chapter/co/): observed warming context, not this exact POWER fit.
2. Bolinger et al., Colorado State University, [Climate Change in Colorado — executive summary](https://climatechange.colostate.edu/chapters/exec_summ.html): historical regional assessment.
3. Williams, A. P., Cook, B. I. & Smerdon, J. E. (2022), [Rapid intensification of the emerging southwestern North American megadrought in 2020–2021](https://doi.org/10.1038/s41558-022-01290-z), Nature Climate Change. [Author-institution copy](https://escholarship.org/uc/item/6sm1c6hf).
4. Suriano, Z. J., Robinson, D. A. & Leathers, D. J. (2019), [Changing snow depth in the Great Lakes basin (USA): Implications and trends](https://doi.org/10.1016/j.ancene.2019.100208), Anthropocene. [NOAA repository](https://repository.library.noaa.gov/view/noaa/57950).
5. Jin, Q. & Pryor, S. C. (2020), [Long-Term Trends of High Aerosol Pollution Events and Their Climatic Impacts in North America Using Multiple Satellite Retrievals and MERRA-2](https://doi.org/10.1029/2019JD031137), JGR Atmospheres.
6. Burke et al. (2023), [The contribution of wildfire to PM2.5 trends in the USA](https://doi.org/10.1038/s41586-023-06522-6), Nature. [Author copy](https://web.stanford.edu/~samhn/papers/Burke%20et%20al%202023%20-%20Nature.pdf).
7. USGS, [Peak Streamflow Trends in Wisconsin and Their Relation to Changes in Climate, Water Years 1921–2020](https://pubs.usgs.gov/sir/2023/5064/j/sir20235064j.pdf): distinct time windows and the snowfall/depth distinction require care.
8. Vicente-Serrano et al. (2025), [High temporal variability not trend dominates Mediterranean precipitation](https://doi.org/10.1038/s41586-024-08576-6), Nature.
