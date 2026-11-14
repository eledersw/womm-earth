# coder-c · Task 7 panel · H6.6

## Done
- Branch `ekaitz/task7-case-explorations` from origin/main; user handles push/PR/merge.
- CorrelationView calls shared API for first region/current period/season/months, raw/detrended r/p/n_eff, co-trending and causality warnings; CorrelationChart shows supplied scatter with visual regression and lag bars.
- MirrorList uses first region/current Case, top 3 returned mirrors, name lookup, empty/error/retry, Show on globe writes frozen highlight store; Compare changes only regions. Own highlight clears on unmount.
- YearsMeter displays n/(n+extra) only for not_proven with usable supplied OLS uncertainty; supports zero, hides missing/out-of-range estimates, states assumptions and combined-test review limit.
- Predict switch sets predictMode/reveal. Before answering or skipping, Evidence, Verdict, Explain, correlation/mirror and chat are withheld. Answer reveals engine tier + direction and the user's guess.
- Requests abort on Case/secondary-variable changes, suppress stale responses and time out; Strict Mode replay does not duplicate requests.
- Updated draft verdict copy to report engine tiers/component p-values without asserting the superseded MK-only primary rule; years copy follows METHODS v1.
- E2E adapted to current Investigate/results portal, no tabs; mocked geometry isolates panel tests from WebGL polygon cost.

## State of things
- Pass: npm run check; 135 Vitest tests; 13 Chromium E2E with official HTTP fixtures/mocked extensions. Screenshot reviewed.
- Full globe acceptance is pending: GlobeView consumes hover/focus only, not mirror highlight or predict/reveal. No changes made outside Ekaitz ownership.
- Actual backend correlation/mirror science and real Claude/production were not verified. METHODS v1 engine alignment/review is still pending per STATUS.
- Feature implementation in the panel is complete; Task 7 Step 2 remains open for globe integration, live verification and user's PR/merge. No Task 8 started.

## For other roles
- Eleder: consume useUiStore.highlight (mirror regions/arcFrom) and predictMode && !reveal in components/globe/GlobeView.tsx; panel already writes these fields.
- Oier/Sergio: correlation, BH mirror selection and detection-time backend review remain yours; no inference is recomputed in the UI (regression overlay is visual only).
- Edur: review provisional exploration labels in lib/copy/case.ts.

## Next step for whoever continues
- User publishes this branch; coordinate Eleder's globe integration, verify actual Sahel/Mediterranean highlighting and hidden trend colours, then close Task 7 Step 2.
