# Offline engine recheck after PR #44

**Reviewer:** Sergio's Methods workflow. **Date:** 2026-11-14. **Revision:** f2e24ad. **Scope:** local code and archived inputs only; no Vercel, NASA or Claude requests were made for this recheck.

## Resolved locally

- Independent key/reference: 9/9 reproduce, including the established numerical-library cross-checks.
- Expanded yearly engine comparison: 7/7 match all checked fields, including component inference, interpolated Sen intervals, diagnostics and years-estimate visibility.
- Case-8 aggregation and eligibility variants: 7/7 match.
- Existing golden, edge-inference and mocked-family tests: 14 passed.
- Full Python suite: 71 passed, no skips; one dependency deprecation warning.

The old MK-only verdict, HR floor, OLS uncertainty, Sen interval, skipped golden harness and No case years-estimate findings are repaired in the checked local implementation. Do not keep asking Oier to redo those completed changes. This is not a new production snapshot or a claim of universal statistical calibration.

## One exact-cutoff mirror follow-up — Oier

A separate boundary probe uses four same-type regions with combined p-values [0.025, 0.025, 0.8, 0.9]. Runtime BH gives q-values [0.05, 0.05, 0.9, 0.9]. Colorado and Wisconsin have opposite nonzero slopes, raw Confirmed tiers and no containment relationship.

METHODS §§13–14 uses an inclusive BH cutoff, so Wisconsin qualifies as Colorado's mirror. select_mirrors instead returns an empty list: api/_engine/map.py rejects a base at q >= 0.05 and requires candidate q < 0.05.

**Required follow-up:** align those exact-cutoff comparisons with the inclusive BH rule and add a focused boundary regression. This is a conservative omission of a qualifying mirror at equality; it does not undo the passing yearly numeric checks. No Oier-owned file was edited here.

The extra boundary probe is not covered by the existing passing fourteen tests, and therefore local_scope_passed remains false in local_recheck.json. It is recorded separately rather than hidden by the green routine suite.

## Current gate status

The original failure evidence remains in local_engine_review.json and production_review.json. The renewed golden_cases/verification.json describes the repaired local implementation; it must not be read as the old deployment's result.

The full validity checkpoint remains open for this cutoff follow-up and the actual identified production/map review. Missing-calendar-year inference, independent correlation validation and calibrated combined-rule detection power retain their stated limits. The user has deferred live work until tomorrow and omitted the outsider session.

Use [FINAL_QA.md](../FINAL_QA.md) for tomorrow's checks and [PITCH_SCIENCE.md](../PITCH_SCIENCE.md) for offline rehearsal. Ekaitz's twenty-question capture tooling is ready; no live evaluation score or generated text approval is assigned here.

## Reproduce offline

~~~powershell
& docs/science/.venv-validation/Scripts/python.exe -X utf8 docs/science/golden_cases/verify_existing.py
& docs/science/.venv-validation/Scripts/python.exe -X utf8 docs/science/review/review_engine.py --local
& docs/science/.venv-validation/Scripts/python.exe -X utf8 -m pytest -q
~~~

The local audit now invokes mocked family tests rather than making real map requests, writes local_recheck.json, and leaves the original failed local snapshot intact. Its JSON contains expected/actual fields, the cutoff example, source hashes and test output. Audit completion is not automatic manual sign-off. npm/npx checks remain unavailable in this Windows shell; no application code was changed.
