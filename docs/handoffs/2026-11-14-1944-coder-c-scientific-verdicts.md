# coder-c · Scientific verdicts/grounding · H7.7

## Done
- Branch ekaitz/scientific-verdicts from origin/main 8b4675c, rebased onto c2dcec5; Task 9 tooling already merged #32.
- Integrated Sergio's final VERDICT_TEMPLATES.md into copy, display/grounding adapter and separate Explain/Partner prompts.
- Eligibility uses returned finite yearly values and actual eligible slots, with DJF/custom boundary handling; verifies count, p-values, agreement and full-precision tier consistency.
- API tier is preserved. Mismatches are provisional; failed eligibility/unavailable inference suppress claims and automatic Explain.
- Labelled MK fallback only for the existing n_eff <= 2 diagnostic; no fabricated OLS agreement or CI/p inference.
- Years estimates require consistent eligible evidence; zero retained, gaps/mismatches/unavailable OLS suppressed.
- Grounding retains absolute slope magnitude from #34; detection_probability_percent is null (METHODS does not establish combined-rule power). IDs/months, method metadata, approved unit conversions and only applicable cards; Celsius percentages excluded.
- Demo generator rejects known engine mismatch/gaps before Claude or cache writes.
- Check + 182 Vitest + 17 Chromium E2E pass; one opt-in live test skipped. Python tests cannot start: no pytest/backend dependencies.

## State of things
- tours.json and demo-explanations.json remain empty. EVAL.md remains 3/20 with stale Case 1 context.
- No validity approval, score or real Claude/cache check claimed; deployment-only key, live checks deferred per user.
- scripts/run-eval.ts wrapper remains uncreated pending ownership authorization; executable is lib/partner/run-eval.ts.
- PR #33 is a separate pending cross-area UI/model change and may conflict with VerdictStep, copy and E2E; preserve guards when integrating it.

## For other roles
- @Oier + @Sergio: align engine and explicitly represent unavailable inference; gaps still lack reviewed inference policy.
- @Edur: captions and tone/COPY adoption; reviewed scientific meaning must be preserved.
- @Sergio: complete/reconcile 20 questions, review generated texts, score actual answers.

## Next step for whoever continues
- User publishes this branch and handles PR/merge. Then resolve PR #33 integration and finish demos/eval when dependencies arrive.
- No push, PR messages, approval or merge performed by agent.
