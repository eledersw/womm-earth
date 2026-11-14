# Methods work plan: scope clarification

**Owner:** Sergio. **Decision:** 2026-11-14, following the user's instruction to omit redundant tasks and continue to demo selection. Work remains on `sergio/methods`, through pull requests rather than direct commits to main.

## Task 2: omit the separate hero import

A hero series was a manually downloaded, curated satellite time series for the main showcase, originally MODIS Aqua AOD over Wisconsin via Giovanni. It was intended to supply a distinctive real example and a data source beyond the original reanalysis library. It is not a statistical method or a separate feature required by the challenge.

The current runtime fetches NASA POWER data on demand. Its verified AOD_55 already supports a real aerosol case, alongside the reviewed meteorological and land variables. We therefore omit the separate Giovanni/Aqua import for the current demo. Do not spend time creating Earthdata credentials or adding CSV imports solely to satisfy the old checklist.

This does not make the two products identical. Label the actual example POWER / CERES SYN1deg AOD, not Aqua-only MODIS or an exact Wisconsin polygon mean. The unused MODIS catalog row and old hero recipes remain optional reference material; their unchecked import box does not mean active work remains in this reduced plan.

## Task 3: answer-key creation is complete

Keep the existing nine cases. Their source data and expected results are already delivered in `tests/fixtures/golden/`; all nine reproduce in the Methods verifier. There is no reason to recreate the historical six-case folder layout, add a second copy, or repeat the simulation now.

Validation remains essential. The current automated harness skips the delivered layout, and an explicit engine comparison finds real numerical and verdict differences. Oier must integrate the key and align the engine; Sergio reviews the results at the existing validity gate. These owner actions are retained in `METHODS_REVIEW.md` and STATUS, rather than shown as unfinished fixture-authoring work for Sergio.

Additional missing-year, unavailable-test and optional-feature fixtures remain targeted review follow-ups, not a reason to block demo research or generate every imaginable edge case immediately. Do not claim deployment validity until the relevant checks actually pass.

## Task 5: scientific selection completed; live readiness pending

`DEMO_CASES.md` contains three FINAL scientific selections and two BACKUP cases, based on eight declared candidate dry-runs. Actual monthly series, independent v1 results and current-engine comparisons are saved in `demo/`. The initial unmodified CLI failed before the team's request fix; subsequent CLI checks on the updated code succeed for all five selections, recorded separately in `demo/cli_checks.json`.

FINAL means selected scientific content, not a passing deployment checkpoint. The provider user fix is verified locally; Oier still needs to align the statistical/reporting implementation. The source-backed process cards, final pitch copy and production smoke test remain their existing tasks. No one should present the reference numbers as current production output before that work is verified.

## Task 6: process-card authoring completed

`PROCESS_CARDS.md` now contains ten cards with student and scientist versions, two primary-source citations each, explicit variable/region IDs and interpretation limits. All three FINAL selections and both BACKUP cases have a primary card. Supporting cards address aerosol mixtures, conditional snow-albedo feedback, evaporative demand, internal variability and reanalysis/regional averaging. No mirror pair is selected for the final demo, and no causal connection is inferred from opposite slopes.

The handoff to Ekaitz is recorded in STATUS and in the card document: he converts the source text into the existing partner JSON shape and verifies tool retrieval and applicability. That app integration remains his work; the process-card file in the app was not edited. Card completion does not pass the engine validity gate. Task 7, verdict templates and grounding rules, remains next.

Validation checks the ten unique IDs, both 80–120-word versions, one or two citations per card, absence of placeholders, exact live catalog/region IDs and coverage of the five selected cases. Sources were checked against NASA/NOAA/IPCC publications, institutional assessments and original research.

Validation result: all 20 versions are 99–108 whitespace-delimited words, with two citations per card; exact IDs and 5/5 case coverage pass. `git diff --check` passes. In the ignored validation environment, `python -X utf8 -m pytest -q` reports 53 passed, 1 skipped (existing golden harness) and one dependency deprecation warning after installing declared geospatial dependencies. The initial plain Windows run failed because of default text encoding and missing dependencies; no application files were changed to resolve the environment. `npm run check` cannot start because npm is unavailable locally; web CI remains required before merge.
