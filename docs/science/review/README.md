# Engine validity gate: not passed

**Owner:** Sergio. **Review date:** 2026-11-14. **Local source reviewed:** e4225ba (main at review start). **Production evidence began:** 18:36 UTC / 19:36 Europe/Madrid. **Decision:** do not tick the task 8 checkbox or the validity checkpoint.

The review is performed; the gate is not satisfied. No engine, endpoint, contract, app string or golden input was changed. Repairs belong to the owners below. This is a reproducible failure report, not a request to weaken the answer key.

## Coverage and result

| Requirement | Evidence | Result |
|---|---|---|
| Existing reference key reproduces | ../golden_cases/verification.json | 9/9 reference cases reproduce, including external library checks for the six numerical yearly cases. |
| Yearly engine agrees with key | local_engine_review.json | 1/7 matches all checked fields: only the too-short rejection. Six numerical cases differ; case 7 also has the wrong tier. |
| Monthly aggregation and eligibility | local_engine_review.json | All seven case-8 season/custom-season aggregations and gates match. This is not uncertainty sign-off for retained gaps. |
| Runtime BH and mirror key | local_engine_review.json; api/index.py | Not exercised: map and mirror handlers serve fixtures; no runtime all-family BH/mirror implementation is available for case 9. |
| Deployed real-series comparison | production_review.json and production_monthly/ | All 16 Case requests return HTTP 200. Aggregation and Sen point estimates match independently; every case has uncertainty-field differences. Tiers match in 15/16. |
| Ten genuine map regions | Two production map requests | Not passed. Both responses are the same single Wisconsin fixture and ignore the requested context. Ten separate analyses are supplementary, not a map check. |
| H13 user test | No observed session or notes available at this review | Pending. Do not claim it happened or that wording was validated with users. |
| Validity sign-off | docs/STATUS.md | Withheld. Passing routine tests does not override these discrepancies. |

The production endpoint exposes runtime versions but no deployment commit. Health returned HTTP 200 with Python 3.12.16, numpy 2.5.4 and scipy 1.18.1. Local source identity and remote artifact identity must not be conflated. Production comparisons below use the returned monthly observations, so the observed output discrepancies do not depend on proving that identity.

The public /analyze endpoint accepts Case selections, not arbitrary synthetic series. The existing CLI imports the local engine and has no remote-server option. Synthetic golden injection into production was therefore not performed or claimed. Use the local golden evidence and the independent deployed real-series comparison together; Oier must supply a supported deployment-level validation route before claiming deployed golden conformance.

## Blocking findings and owners

### B1 — Statistical implementation differs from METHODS v1 — Oier

The expanded local check compares exposed sample counts, slopes, CIs, component p-values, MK score variance, residual diagnostics, means, magnitude, agreement and estimate visibility, using the specified tolerances. The existing narrower verifier independently gives the same 1/7 full-case result.

| Golden case | Full checked-field result | Material example |
|---|---|---|
| 1, linear trend | Fail | MK variance is 1318.891733 instead of 1625.333333; the required HR floor is absent. |
| 2, white noise | Fail | HR variance and uncertainty differ; OLS effective n differs. |
| 3, persistent null | Fail | Expected additional years 4, engine 6; uncertainty differs. |
| 4, ties | Fail | OLS adjusted uncertainty and Sen interval differ. |
| 5, too short | Pass | Inference and estimate are withheld as required. |
| 6, minimum length | Fail | Sen interval ranks differ; negative residual r1 is reported as zero instead of −0.32740393. |
| 7, test disagreement | Fail | Expected Not proven yet; engine Confirmed. Expected OLS p ≈0.124057; engine ≈0.176013. |

Source inspection explains the failures:

- api/_engine/trend.py: hamed_rao does not floor the correction at one.
- ols_ar1 uses Pearson correlation of residual slices, clips it to [0, 0.9], and floors effective n at three. METHODS requires the cross-product ratio, n_eff capped at n, and honest unavailable inference when n_eff ≤ 2.
- sens_slope rounds CI order-statistic indices instead of interpolating the specified Gilbert ranks.
- api/_engine/verdict.py selects tiers from MK alone rather than the larger usable component p-value.
- The years-needed search starts at n+1, uses the current clipped dependence estimate and is not restricted to Not proven yet.
- Inference across missing calendar years, unavailable-test and degenerate fixtures, and the current non-nullable contract still need the review listed in METHODS_REVIEW.md. Passing the aggregation gate does not resolve these.

**Required fix:** implement METHODS §§6–10 without weakening the reference tolerances; integrate the flat key into CI; handle unavailable inference through the agreed contract/seam process. Then rerun this packet and the full key. Keep scientific approval withheld in the meantime.

### B2 — Live diagnostic returns the wrong tier — Oier

For GWETROOT, NR-ARAL, 1981–2025, ANN, production returns Confirmed. On its returned data, the independent v1 reference returns No case:

| Quantity | Production | v1 reference |
|---|---|---|
| Capped MK p | 0.006359390 | 0.006359390 |
| Adjusted OLS p | 0.521894602 | 0.420620410 |
| Decision rule | Tier reflects MK alone | max(component p-values) |
| Tier | Confirmed | No case |

This is an implementation disagreement, not proof that the physical system has no trend or that one hypothesis is true. It demonstrates why an MK-only badge cannot be presented as the approved combined result.

**Required fix:** B1, followed by a production rerun of this exact Case and the selected demos. Ekaitz should use the provisional mismatch wording from VERDICT_TEMPLATES.md until the output is aligned.

### B3 — No case still receives a detection-time estimate — Oier; Ekaitz checks display

For PRECTOTCORR, US-WI, 1981–2025, ANN, production returns No case and years_needed = 27. The v1 rule hides this estimate for No case, regardless of whether the formula finds a threshold. The app must not describe this as a future confirmation date. Fix the engine visibility rule; retain the defensive display guard specified in task 7.

### B4 — Production trend map is fixture data — Oier; Eleder for globe integration

These read-only requests both return the exact parsed content of api/_fixtures/trendmap.json:

- T2M, 1981–2025, ANN.
- AOD_55, 2002–2025, JJA.

Both responses identify T2M, 2002–2025, JJA, with one US-WI entry: slope 0.8 per decade, p = 0.01, q = 0.02 and Confirmed. The second response even returns the wrong variable.

For the fixture's own stated Case, T2M / US-WI / 2002–2025 / JJA, live /analyze returns approximately +0.098637 °C/decade, MK p ≈0.709844 and No case. The independent combined result is also No case. This is a direct same-context contradiction, not a comparison of different seasons.

**Required fix:** Oier implements real requested-variable/period/season map results and the full defined BH family; mirror and scan also remain fixtures by source inspection. Eleder must not present fixture colouring as scientific results and must verify the globe consumes the actual response. Rerun ten genuine map regions after implementation. Do not insert the ten supplementary analysis p-values into a smaller BH family as a workaround.

### F1 — Relative-percentage reporting metadata — Oier, follow-up

Production /variables marks all 16 reviewed variables ratio_scale = false. Consequently the soil-wetness, snow-depth, AOD and precipitation examples return no relative-percentage value. The audit lists these missing fields separately from incorrect numeric uncertainty. Their absence is not a fabricated percentage or a causal finding. Review the catalog flags and denominator safeguards against METHODS §11 before enabling them; Celsius percentages must remain suppressed.

### B5 — Golden CI harness skips delivered fixtures — Oier

tests/test_golden.py searches for subfolders containing expected.json. The supplied key is flat, so the golden test is skipped with an obsolete delivery message. Ordinary pytest success therefore does not establish key conformance. Adapt the harness to the existing nine cases, including aggregation and all-family BH/mirrors; do not recreate or relabel the delivered fixtures to make the skip look like a pass.

## Ten-region supplementary plausibility check

These are live /analyze results for T2M, 1981–2025, ANN, each with 45 finite yearly values. All yearly aggregates and headline Sen slopes reproduce from archived returned monthly data. All ten return Confirmed, which is also the reference tier. Their uncertainty fields still fail the strict comparison.

| Region | Sen slope, °C/decade |
|---|---:|
| Colorado | +0.337908 |
| Arizona | +0.453783 |
| Wisconsin | +0.362656 |
| Nevada | +0.457744 |
| California | +0.323871 |
| Texas | +0.399102 |
| New York | +0.446145 |
| Florida | +0.290315 |
| Minnesota | +0.338842 |
| Maine | +0.442203 |

The positive directions and changes of a few tenths of a degree per decade show no obvious sign/unit alarm in this coarse screen. The broad direction is consistent with observed US warming assessed in [NCA5 Chapter 2, hosted by NOAA's Climate Resilience Toolkit](https://toolkit.climate.gov/sites/default/files/2025-07/NCA5_Ch2_Climate-Trends.pdf). Colorado warming is also documented by the [Colorado Climate Center assessment](https://climatechange.colostate.edu/chapters/exec_summ.html). These publications use other spatial definitions, records and methods; they are context, not exact benchmarks for these ten slopes. The screen does not establish each local magnitude, attribution or statistical calibration. POWER bounding-box averages are not exact state polygon averages.

The intended Arctic/global-land example is not asserted: no genuine map family or compatible Arctic/global pair was verified. Plausibility does not substitute for arithmetic agreement or a calibrated uncertainty method.

## Selected demos on production

| Selection | Case | Valid years | Sen change per decade | Production / reference tier |
|---|---|---:|---:|---|
| FINAL | Colorado T2M, Annual | 45 | +0.337908 °C | Confirmed / Confirmed |
| FINAL | Arizona GWETROOT, Annual | 45 | −0.00354785 index units | Confirmed / Confirmed |
| FINAL | Wisconsin SNODP, DJF | 44 | −0.564039 cm | Confirmed / Confirmed |
| BACKUP | Wisconsin AOD_55, JJA, 2002–2025 | 24 | +0.00199648 AOD | No case / No case |
| BACKUP | Wisconsin PRECTOTCORR, Annual | 45 | +0.0283055 mm/day | No case / No case |

Other rows use 1981–2025; valid Wisconsin winter labels begin in 1982 because the boundary winter is dropped. Agreement on these five headline estimates and tiers does not approve their uncertainty fields or the whole deployment. In particular, Arizona wetness remains close to the nominal MK threshold and should not be oversold.

## User-test and wording follow-up

No H13 session was observed or supplied during this review. The task-7 templates already address likely misreadings: non-detection versus no change, significance versus causation, CIs versus combined tiers, and approximate additional years versus a promised deadline. Those are desk-review findings, not observed user behavior. Record actual user-test evidence when it exists and amend wording only from that evidence and the statistical rules.

## Reproduce and re-open the gate

Run from the repository root with the existing ignored validation environment:

~~~powershell
& docs/science/.venv-validation/Scripts/python.exe -X utf8 docs/science/golden_cases/verify_existing.py
& docs/science/.venv-validation/Scripts/python.exe -X utf8 docs/science/review/review_engine.py --local
& docs/science/.venv-validation/Scripts/python.exe -X utf8 docs/science/review/review_engine.py --replay
~~~

The first command verifies the reference and reports differences; its successful exit is not an engine pass. The local review likewise records failures without granting approval. Replay verifies the archived production comparison without network requests or pretending that the archive is a current deployment check.

To take a new production snapshot:

~~~powershell
& docs/science/.venv-validation/Scripts/python.exe -X utf8 docs/science/review/review_engine.py --production
~~~

It makes a bounded set of read-only public API requests, with two concurrent Case requests. This overwrites the current snapshot; commit new evidence deliberately rather than presenting different retrieval times as the same run.

Evidence layout:

- local_engine_review.json: expected/observed values, exact differing fields, aggregation/gates and local fixture responses.
- production_review.json: request context, status, original response-body hashes, selected returned fields, variable metadata, independent comparisons and timings. Deployment revision is explicitly unknown.
- production_monthly/*.csv: all returned monthly values and anomalies, with hashes in the summary. Returned yearly values, statistics and provenance remain in the JSON. Fitted-line point arrays are omitted and are outside this review's numeric comparison.
- ../golden_cases/verification.json: renewed reference/key and narrower core verification.
- review_engine.py: inspection/replay tooling inside Sergio's ownership; not application code.

After Oier's fixes, require all applicable golden checks (including runtime aggregation, unavailable/gapped inference and BH/mirrors), a newly identified deployment with matching real-series output, ten genuine map entries, and the actual user-test review. Sergio then records the decision. **No automatic test script grants the manual validity sign-off.**

## Verification of the review packet

Offline replay reproduces all 16 archived comparisons and verifies their monthly CSV hashes. Reference verification reports 9/9; the local audit reports yearly 1/7 and aggregation/gates 7/7. The routine suite reports 57 passed, 1 skipped and one dependency deprecation warning. The skip explicitly says that golden cases have not been delivered, which is the stale harness problem documented above. `npm run check` cannot start because npm is unavailable locally. These checks do not turn the failed scientific gate into a pass.

After rebasing onto main c2dcec5, all 12 recorded API/golden source hashes remain unchanged. New partner/card work was preserved; it does not resolve the reviewed engine/map failures. All 16 normalized monthly archive hashes were also checked against the committed Git blobs, so replay is portable across Windows and LF checkouts.
