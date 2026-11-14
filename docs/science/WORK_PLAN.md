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

## Task 7: verdict wording and grounding source completed

`VERDICT_TEMPLATES.md` now supplies all four tiers in Student and Scientist versions, a defined placeholder/unit contract, combined-test and fallback rules, eligibility reasons, disagreement/dependence notices, estimate visibility including zero, unavailable-statistics and implementation-mismatch wording. Separate Explain and Partner prompt blocks enforce tool-grounded numbers and card-grounded physical explanations without the old general-knowledge escape.

Reviewed `docs/pitch/COPY.md`: the ten statistical tooltips remain placeholders. Scientifically reviewed replacements, plus corrected Timeline/Verdict helper text, are supplied in the Methods document for Edur to adopt and review for tone. No joint tone approval is claimed. Ekaitz receives the source and detailed conversion handoff through STATUS; his app integration remains pending. Only the permitted role checkbox was ticked.

The current engine still selects its tier using MK alone. The new source requires that discrepancy to be explicit until Oier aligns it; it does not silently approve or change runtime output. Task 8, the engine review gate, remains next, and the validity checkpoint is unticked.

Validation: eight tier/reading-level templates are complete, all 19 placeholders are defined, and the ten tooltip replacements are 17–25 words each. The documented decision rule agrees with all seven yearly golden references, including disagreement; explicit boundary, zero-estimate, availability and mode restrictions were checked. This validates the source specification, not engine conformance. `python -X utf8 -m pytest -q` passes with 57 passed, 1 skipped (existing golden harness) and one dependency deprecation warning. `npm run check` cannot start because npm is unavailable locally. `git diff --check` passes. No application files or tests were changed.

## Task 8: review performed; validity gate not passed

The actual gate audit is in `review/README.md`, with local expected/actual evidence, a public production snapshot and hashed monthly CSVs that replay offline. The nine-case reference still reproduces. Only 1/7 yearly engine cases matches all checked fields; all seven case-8 aggregation/gate variants match. The public API returns all 16 reviewed Cases successfully and their aggregation/Sen point estimates reproduce, but uncertainty differs. The Aral diagnostic has an incorrect combined tier; No case precipitation still exposes additional years.

The ten supplementary regional temperature analyses do not satisfy the map requirement: production map responses are the exact fixed Wisconsin fixture, ignore requested context and contradict the same-context live analysis. Runtime BH/mirrors and the CI harness remain incomplete. Owner-specific repairs are recorded in STATUS and the review packet. No engine/app/contract files were edited. The actual H13 user test is not claimed. Task 8 and the validity checkbox stay unchecked until the required numerical fixes, deployment checks and genuine map review pass; the outside-user requirement is superseded by the decision below.

## User decision: omit the outside-user session

On 2026-11-14 Sergio reported that the team had tested the app as users and liked its appearance, and explicitly omitted the planned H13 outsider test. Record this as reported team self-testing, not an observed independent-participant study. The previous task-8 requirement for that session is superseded; do not ask for it again. The numerical engine gate and factual partner evaluation remain required. Edur owns the original USER_TEST.md and schedule sections, which were not edited outside ownership.

## Task 9: science source pack delivered while task 8 remains open

`EVAL.md` now contains twenty complete questions with explicit canonical Cases, both reading levels and the requested six factual/four causal/four statistical/three correlation/three trick distribution. The old ambiguous Wisconsin smoke Case 1 is replaced by explicit Colorado/Arizona/Wisconsin contexts. `LIMITATIONS.md` supplies Student and Scientist wording; `PITCH_SCIENCE.md` supplies validity-slide content, the conditional-years explanation, project-page science copy, NASA attribution and science Q&A for Edur. The existing uncapped false-positive graphic is distinguished from the capped combined-method simulation. `OIER_HANDOFF.md` is the precise backend request for the user to send; no external message was sent.

Source preparation can proceed in parallel with the engine fixes. The Story lead receives the pack through STATUS; deck assembly and tone adoption remain Edur’s work. The actual twenty-answer live evaluation, its score and generated-demo approval are the following task and have not run here. No validity sign-off is implied.

Validation: structural checks confirm all twenty seven-column rubric rows, unique sequential IDs, explicit canonical query structures, real variable/region IDs and both reading levels. All fourteen limitations have Student/Scientist versions. Pitch rates and simulation scope match the stored n=24 reference experiment. `python -X utf8 -m pytest -q` reports 57 passed, 1 skipped and one dependency warning; the golden harness skip is still not a scientific pass. `npm run check` and the official `npx ... --dry-run` cannot start because npm/npx are unavailable locally. The actual eval runner and live scoring have not been executed. `git diff --check` passes. No app, API, engine or Story-owned files were edited.

## Offline preparation after the engine repair

At the user’s request to identify useful work now, the repaired implementation was independently rechecked on local main f2e24ad. The reference reproduces 9/9; all checked yearly fields match in 7/7 cases; aggregation/gates match 7/7. The focused golden/edge/family suite passes 14 tests and the full Python suite passes 71 with no skips. No Vercel, NASA or Claude request was made in this offline recheck.

A separate exact-BH-cutoff mirror probe finds a conservative omission at q=0.05, documented for Oier in `review/LOCAL_RECHECK.md` and `local_recheck.json`; the normal yearly results remain passing. The earlier failed local and production snapshots are preserved. The local review command now uses deterministic/mocked family tests and writes a separate recheck file instead of overwriting the old snapshot or triggering real map requests.

`FINAL_QA.md` prepares tomorrow’s deployment identity, canary Cases, three demos, chart/units, ten-region map/BH checks, actual EVAL scoring, cached explanation review and pitch checks. Current source handoffs are refreshed to distinguish repaired local arithmetic from unreviewed production behavior. Offline pitch rehearsal/adoption and Edur’s captions can proceed now. The overall validity, live eval and final-production-QA boxes remain unchecked.
