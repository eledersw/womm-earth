# METHODS v1: review with Oier

**Owner:** Sergio. **Status:** prepared 2026-11-14; review and engine acceptance pending.

This packet supports the playbook's METHODS v1 review. `METHODS.md` is normative. Engine implementation and test fixtures are Oier's area. This update changes documentation only; it does not change the HTTP contract.

## Decisions now documented

| Topic | Decision | Evidence |
|---|---|---|
| Verdict | Option B: larger of capped MK-HR and adjusted OLS p-values | `golden_expected.json`, cases 1–7 |
| Hamed–Rao | Factor floored at 1; all significant detrended-rank ACF lags | Golden conventions and `FALSE_POSITIVE_SIM.md` |
| OLS | Residual cross-product r1; n_eff capped at n; Santer SE adjustment and fractional df | Golden conventions; case 6 exercises negative r1 |
| Sen CI | Interpolated Gilbert ranks with capped-HR variance; not a CI for the combined verdict | Golden conventions |
| Aggregation | All months for seasons/custom sets; annual ≥10/12; ≥10 years and ≥80% eligible slots | Case 8; annual missingness bias disclosed |
| Fallback | Undefined adjusted OLS: finite capped MK alone, with explicit unavailable-test warning | Golden convention; fixture still needed |
| Map/mirrors | BH on combined p across all valid region types before mirror filtering | Case 9 |
| Years-needed | Key formula/search, including possible zero extra years; conditional approximation | Key and stored simulation; Option B power not validated |

## Required review and follow-up

- [ ] Sergio and Oier review the changed rules; record the actual review date/outcome here. No such conversation is claimed by this commit.
- [ ] Oier adapts `tests/test_golden.py` to the flat nine-case key. Its current discovery requires subfolders with `expected.json`, so it skips this delivery.
- [ ] Oier compares the engine's HR factor, OLS r1/n_eff/SE, Sen rank interpolation, verdict combination and years-needed search with the key. The inspected engine still reflects several starter rules; old tests passing would not establish v1 agreement.
- [ ] Agree and independently test **missing-year autocorrelation inference**. Preserve calendar-year slopes; do not impute silently or equate adjacent retained observations to consecutive years. Coverage passing alone is not sign-off. Case 8 tests aggregation, not uncertainty for its gapped outputs.
- [ ] Add an independent fixture for n_eff <= 2, and tests for constant/exact-linear and nonfinite cases. Represent unavailable inference honestly. Oier identifies any needed contract additions and follows the frozen-seam heads-up and type-generation rules.
- [ ] Confirm the map/scanner apply BH to combined p over the full family, and both mirror endpoints pass the same map family.
- [ ] Validate correlation separately, including calendar lags, effective n and the 13-lag correction; trend fixtures provide no correlation sign-off.
- [ ] Check Option B detection power before describing the years-needed formula as calibrated to even odds. Existing evidence supports an approximate threshold only, especially with persistence.
- [ ] Give Ekaitz and Edur the implications for wording: the verdict does not always follow MK; Sen CI exclusion need not match the combined verdict; additional data do not guarantee confirmation. Verdict templates and limitations are separate follow-up tasks.

## Acceptance record

**Subsequent verification (2026-11-14):** the existing nine-case key reproduced successfully; the six numerical yearly cases passed scipy/pymannkendall 1.4.3/statsmodels cross-checks. `pytest tests/test_golden.py -q -p no:cacheprovider` confirms one skipped test. The separate engine comparison matches all checked fields in only 1/7 yearly cases (the minimum-length rejection); case 7 also differs in verdict. Actual results and differing fields are saved in `golden_cases/verification.json`. An isolated ignored science environment now supplies the dependencies; the earlier environment-limitation record below describes the original attempt, not the current verification.

The real-data dry-run also exposes a material disagreement: for `GWETROOT`, `NR-ARAL`, 1981–2025, Annual, the current engine returns Confirmed, whereas the v1 reference returns No case (capped MK p ≈0.00636, adjusted OLS p ≈0.42062). See `demo/results.json`. This is an implementation review blocker, not evidence that the supplied answer key needs to be recreated.

**Latest CLI check:** after the team's provider-user fix, all three FINAL cases and both BACKUP cases succeed through the unmodified CLI; see `demo/cli_checks.json`. This resolves the request-format issue locally, not the v1 numerical mismatches. The Wisconsin precipitation backup also returns 27 years-needed under No case, contrary to v1's visibility rule. Reference and core-engine source hashes still match the verified comparison after rebasing.

- Methods document: v1 written and reconciled to the existing key; missing-year inference is explicitly unresolved.
- Oier review: pending.
- Engine comparison: pending; harness mismatch identified by inspection, not a test run.
- Document consistency checks: 60 comparisons passed across the six numerical trend cases (OLS slope/r1/n_eff/SE, combined p/tier, HR floor and interpolated Sen CI); all 17 method sections present and no starter Decision placeholders remain. `git diff --check` passed. These checks use the stored key and do not exercise or certify the engine.
- Deployed-engine validity checkpoint: pending; not granted.
- Local checks attempted: `npm run check` cannot start because npm is unavailable; `python -m pytest -q` cannot start because pytest is not installed. These are environment limitations, not passing results. No application code changed.
- Upstream context: the main status board reports pre-existing failing web/API CI. This methods update does not resolve or certify those checks. The rebase preserves the team’s latest workstream updates.
