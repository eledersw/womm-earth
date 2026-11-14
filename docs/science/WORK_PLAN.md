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
