# METHODS v1: implementation review

**Owner:** Sergio. **Updated:** 2026-11-14. **Current scope:** local implementation rechecked after Oier's PR #44; deployed validity remains pending.

METHODS.md remains normative. [review/LOCAL_RECHECK.md](review/LOCAL_RECHECK.md) is the current local result; [review/README.md](review/README.md) preserves the earlier failed production review. No in-person review conversation is claimed.

## Completed and verified locally

- [x] Flat nine-case key is active in tests/test_golden.py; it no longer skips the delivery.
- [x] Independent reference reproduces 9/9 cases; expanded yearly engine comparison matches all checked fields in 7/7 cases.
- [x] HR floor, residual cross-product r1/effective n, adjusted uncertainty, interpolated Sen CI, combined verdict and estimate visibility align with the checked key.
- [x] Seven case-8 seasonal/custom aggregation and eligibility variants match.
- [x] Nullable unavailable OLS inference, constant/exact-linear inputs and nonfinite coverage have passing edge checks.
- [x] Runtime BH/mirror golden tests and deterministic map/scanner family integration tests pass; these use supplied or mocked inputs rather than a live full-region family.
- [x] The source wording/process cards and Ekaitz's guards preserve unit, fallback, disagreement, calibration and attribution limits.
- [x] Full Python suite: 71 passed, no skips, one dependency warning; the focused golden/edge/family suite has 14 passes.

## Remaining review items

- [ ] Oier resolves the exact q = 0.05 mirror omission and adds a boundary regression. See review/local_recheck.json: raw-confirmed opposite slopes can pass inclusive BH at equality but are filtered out by strict mirror comparisons.
- [ ] Independently settle inference across missing calendar years. Aggregation passing does not validate serial-dependence inference over retained gaps.
- [ ] Validate correlation separately: matching calendar months/lags, effective n, detrending and the searched-lag adjustment. Trend fixtures do not certify correlation.
- [ ] Retain the approximate status of years-needed; existing simulations do not establish calibrated power for the combined rule.
- [ ] Review an identified corrected deployment, fresh Case evidence and ten genuine map entries/full-family behavior; measure cold-family latency and failures.
- [ ] Run and manually score the twenty-question partner evaluation and review generated demo explanations when live work resumes.

The outsider user test is omitted by Sergio's decision after reported team self-testing; it is not a remaining prerequisite. Vercel and live Claude work are deferred until tomorrow at the user's request.

## Evidence and acceptance

Current offline evidence is review/local_recheck.json plus golden_cases/verification.json. The older local_engine_review.json, production_review.json and monthly CSVs remain a historical record of the failures that led to PR #44. Their old outputs are not claims about the repaired code.

Only the checked local arithmetic, gates and test coverage are accepted by this update. It does not approve every physical explanation, all optional features, the actual deployment or calibration on real Earth data. The task-8 role checkbox and overall validity checkpoint stay unticked.

No engine/API/contract files were changed by this Methods review. The local review evidence is recorded in [LOCAL_RECHECK.md](review/LOCAL_RECHECK.md).
