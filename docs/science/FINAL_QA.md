# Final science QA: ready for the next live session

**Owner:** Sergio, with Ekaitz for the partner/chart checks, Oier for API/statistics and Eleder for the globe. **Prepared:** 2026-11-14. **Status:** checklist prepared; live items are deliberately unchecked.

The user deferred Vercel and live Claude work until tomorrow morning. The outsider test was omitted by user decision. This checklist makes neither a new deployment request nor a usability-study requirement. Preserve the failed production archive as historical evidence until a new identified deployment is checked.

## Before opening the live app

- [x] Reproduce the independent key: 9/9 reference cases; 7/7 checked yearly engine cases now agree after PR #44.
- [x] Run the Python suite: 71 passed, no skips, one dependency warning.
- [x] Prepare EVAL.md's twenty explicit contexts and rubric; Ekaitz's merged #46 preflight/evidence tooling is ready.
- [ ] Oier resolves the exact BH-cutoff mirror omission recorded in review/local_recheck.json, or its scope is explicitly disclosed before map/mirror sign-off.
- [ ] Edur adopts PITCH_SCIENCE.md / LIMITATIONS.md and supplies approved captions for the selected demos.
- [ ] Record the actual serving revision, origin, time, model/settings and data retrieval context. A merged commit or caller-supplied revision string alone is not deployment identity.
- [ ] Confirm the corrected deployment is serving the intended backend before using old links, caches or screenshots as evidence.

## API canaries on the corrected deployment

These are regression checks, not a new selection of demonstration cases. Retrieve the actual monthly/yearly evidence again; reference values are comparison targets, not values to insert into an answer.

| Case | Required check |
|---|---|
| GWETROOT / NR-ARAL / 1981–2025 / ANN | Combined rule gives No case on the archived reference; verify the newly returned data and both component p-values. The old MK-only Confirmed discrepancy must be gone. |
| PRECTOTCORR / US-WI / 1981–2025 / ANN | No case has no additional-years estimate. Preserve mean daily rate units rather than annual accumulation. |
| T2M / US-CO / 1981–2025 / ANN | Compare current yearly values, signed Sen slope, both p-values, CI, valid n and verdict with the reference for that retrieval. |

- [ ] Independently check the fresh returned monthly-to-yearly aggregation.
- [ ] Compare all applicable statistics at METHODS tolerances, not just the tier or slope.
- [ ] Label unavailable adjusted OLS explicitly; do not manufacture agreement, a CI band or detection time.
- [ ] Retain and disclose sampling/fallback, dependence and gapped-year limitations where applicable.
- [ ] Link each result to evidence and note changes since the historical snapshot rather than overwriting that history.

## Three FINAL Cases: numbers, units and chart

| Scientific selection | Required context | Interpretation to preserve |
|---|---|---|
| Colorado temperature | T2M / US-CO / 1981–2025 / ANN | Near-surface air temperature in °C; no relative Celsius percentage or automatic causal attribution. |
| Arizona root-zone wetness | GWETROOT / US-AZ / 1981–2025 / ANN | Dimensionless model wetness index; no claim that it measures groundwater or water volume. Keep the near-threshold caveat if supported by the new result. |
| Wisconsin winter snow depth | SNODP / US-WI / 1981–2025 / DJF | Depth in cm, distinct from snowfall/SWE; January labels the winter and the boundary winter is dropped. |

- [ ] Case controls, response context, selected season and chart agree.
- [ ] Valid-year counts come from the returned series; the archived snow reference has 44 winters, labelled 1982–2025.
- [ ] Chart points match the returned yearly values and reveal missing slots honestly.
- [ ] Sen rate is per decade, with the interval converted once into matching units.
- [ ] OLS line and its shaded uncertainty use the intended fit fields; the band is centered/aligned correctly and is not called a Sen slope interval.
- [ ] Axis titles, units, source badges, total-change text and any percentages match the returned variable.
- [ ] Appropriate warnings and provisional/unavailable states remain visible; changing controls does not leave stale results or captions.
- [ ] The deterministic verdict remains usable if Claude is unavailable.

## Real map, BH family and mirror

- [ ] Request at least two distinct variables/periods/seasons and verify the response identifies each requested context.
- [ ] Confirm real computed geography, not the old Wisconsin-only fixture.
- [ ] Spot-check ten eligible regions against corresponding /analyze requests using identical settings; use CO, AZ, WI, NV, CA, TX, NY, FL, MN and ME where eligible.
- [ ] Compare map slopes and individual combined p-values with analyses; check BH q against the full eligible family, not a hand-picked ten-region subset.
- [ ] Verify eligibility failures, unavailable source coverage and retrieval failures are represented appropriately.
- [ ] Confirm mirror candidates use the same variable, period, season and region type, satisfy both raw/field rules and exclude containment.
- [ ] Exercise q exactly at the inclusive cutoff; a raw-confirmed base/candidate pair with q = 0.05 should not disappear solely because of strict comparison.
- [ ] Check the globe's legend, units, direction, missing-data coloring and highlighted regions against the API response.
- [ ] Record full-family latency and failures separately from plausibility; acceptable speed does not establish statistical correctness.
- [ ] Do not assert Arctic/global-land comparisons or correlations that were never actually evaluated.

## Partner accuracy and generated explanations

- [ ] Ekaitz runs EVAL's twenty questions against the identified corrected environment and saves full evidence, answers and errors.
- [ ] Sergio scores each row for numbers, context, units, key facts, forbidden claims and reading level. Numeric matching alone is insufficient.
- [ ] Record the actual score and unresolved failures; do not invent a target score or drop failed executions.
- [ ] Check that unavailable or annual-only correlation tools are disclosed rather than presented as seasonal evidence.
- [ ] Approved process cards apply to the actual variable/place/conditions; cited mechanisms remain conditional.
- [ ] Inspect detection-time assumptions, zero estimates and hidden estimates; no promised confirmation date or combined-rule even-odds claim.
- [ ] After Edur's approved tours are available, generate the three demo explanations and review the relevant reading-level variants.
- [ ] Approve only reviewed texts with the correct Case key; verify cache behavior and review metadata.
- [ ] Update the real accuracy/evidence checkboxes only after these actions, not from a successful preflight.

## Pitch and final decision

- [ ] Edur's deck, project page and Q&A reflect the verified implementation and actual data sources.
- [ ] Any false-positive figure has its correct method, sample size and simulation scope; the old uncapped graphic is not labelled as the combined capped method.
- [ ] Distinguish effect magnitude, nominal detection and physical attribution in the talking points.
- [ ] Preserve the uncertainty and selection caveats for demos.
- [ ] Record the final decision, revision, evidence links, remaining limitations and owners in STATUS.
- [ ] Tick the validity checkpoint only when its numerical/deployment requirements are satisfied; preparation of this checklist does not grant sign-off.

Offline rehearsal can happen now using PITCH_SCIENCE.md's short answers. The live checks and scientific score remain tomorrow's work.
