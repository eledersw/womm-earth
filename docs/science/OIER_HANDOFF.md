# Request to Oier: close the numerical validity blockers

**From:** Sergio. **Evidence:** [review/README.md](review/README.md), merged review PR #36. **Reviewed code:** no API/engine changes between the audited snapshot and main da41f42. Outside-user testing has been omitted by Sergio; it is not one of these fix requests.

**Update after PR #44:** the requested arithmetic/harness/visibility repairs are implemented and pass the current local recheck. The numbered request below is historical. The new remaining code follow-up is the exact q = 0.05 mirror omission in [review/LOCAL_RECHECK.md](review/LOCAL_RECHECK.md); production review resumes tomorrow.

Original request:

> Please align the backend with METHODS.md v1 and close the blockers in docs/science/review/README.md:
>
> 1. Correct the statistical implementation: capped HR factor, specified OLS residual r1/effective sample size and uncertainty, interpolated Sen CI, and the combined maximum-p verdict rule with an honest unavailable-OLS fallback.
> 2. Make tests/test_golden.py consume the existing flat nine-case key. It currently skips it. Add the missing unavailable/degenerate/gapped-inference checks identified in METHODS_REVIEW.md; keep the existing tolerances.
> 3. Restrict additional-years output to eligible Not proven yet cases, preserve valid zero, and hide it for No case and unavailable inference.
> 4. Replace fixture map results with requested-variable/period/season computations and the defined full-family BH correction. Implement mirror/scanner rules or explicitly leave those features unavailable; do not present fixtures as measurements.
> 5. If unavailable inference needs a contract change, follow the frozen-seam agreement and regenerate OpenAPI/TypeScript types.
>
> Please send the fix PR and passing checks, plus the deployed revision, so I can rerun the Methods gate. The acceptance examples include Aral GWETROOT 1981–2025 ANN (reference No case, not the old Confirmed), Wisconsin precipitation No case with no years estimate, and a real Wisconsin summer-temperature map entry agreeing with /analyze.

Existing golden inputs are already delivered; this is integration and implementation work, not a request to author them again. The three FINAL examples and two backups are selected. Please do not alter periods, thresholds or the answer key merely to make demonstrations look stronger.

After the backend repair, Eleder verifies that the globe consumes genuine results. Ekaitz's recently merged mismatch/grounding safeguards should remain; better wording alone does not correct numeric inference. Sergio reruns the reference, production and map checks before granting sign-off.
