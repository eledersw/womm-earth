# coder-c · Task 3 Evidence + Verdict · H3.4

## Done
- Implemented on `ekaitz/task3-evidence-verdict`, branched from latest public origin/main (ca59350).
- SeriesChart: yearly points/line, supplied OLS fit + 95% confidence band, dashed Sen fit, four region colours via --series-N with readable fallbacks.
- MonthlyChart: raw or supplied anomalies, UTC dates, preserved null gaps; no client statistics or anomaly recalculation.
- Evidence: Yearly/Monthly and raw/anomaly controls, source/kind/instrument/product/DOI, readable backend warnings, season convention.
- Verdict: all four tiers at Student/Scientist levels, primary Hamed–Rao MK, supplied Sen per decade, conditional detection-time estimate, discrepancy warning.
- Scientist adds OLS/MK/Sen table, CIs, n/n_eff/tau/phi, total change; percentages only for ratio-scale variables.

## Decisions made
- Consumed frozen state/API seams without changing them; copy centralized in lib/copy/case.ts, derived from METHODS and draft VERDICT_TEMPLATES/COPY.
- METHODS overrides the draft detection-time promise: show an estimate with even odds, assuming unchanged slope/noise; hide unavailable years.

## State of things
- Pass: npm run check; 78 Vitest tests; 6 Chromium E2E using official HTTP fixtures.
- Reviewed real browser screenshots for light/dark and four regions; overflow checks at 1280/768/390.
- No Python changes; pytest unavailable in system Python in the preceding task. Real-data backend, production and Claude not exercised.
- Work is local, pending user's push/PR/merge. Partner remains a 501 stub; Task 4 helpers already merged.

## For other roles
- Sergio/Edur: review draft verdict/control copy against scientific and Story wording before final demo.
- Eleder: chart colour fallbacks are temporary until --series-1…4 tokens land.

## Next step for whoever continues
- User publishes this branch and handles PR/merge; reconcile Task 4 merge checkbox with existing helpers, then Task 5 Explain.
