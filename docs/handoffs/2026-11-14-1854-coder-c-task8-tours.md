# coder-c · Task 8 guided-tour player · H6.9

## Done
- Branch `ekaitz/task8-guided-tours` from origin/main 21169a9 (Task 7 merged via PR #26). User handles push/PR/merge.
- Added Tour/TourStep schemas, canonical-query validation, tours.json and tests. Manifest stays empty: source docs contain no FINAL cases or approved captions.
- TourPlayer applies replaceCase, explicit/fallback focus via regionLatLng, tour highlight, optional reveal and caption; Prev/Next/Play (6 seconds)/Pause/Exit.
- Player snapshots original Case/UI state. Exit restores original Case; unmount clears owned highlight and restores UI state without rewriting navigation URLs.
- Autoplay pauses on manual Case edits, skips background ticks and stops at the last step; no automatic analyses or focus traps.
- TourLauncher supports Watch this case per approved tour; empty-state fallback is an instructional guide for the current Case, with no fabricated statistics or demo claims.
- Single active player remains mounted across Investigate. Launchers appear before results and alongside Partner in the results pane.
- Guide focus is intentional on launch; Exit returns focus to the launcher. Copy is centralized in lib/copy/tour.ts.

## State of things
- Pass: npm run check; 143 Vitest tests; 14 Chromium E2E with HTTP fixtures; guide screenshot reviewed. Targeted guide E2E also repeated after Exit cleanup adjustment.
- `python -m pytest -q` unavailable: system Python reports no module named pytest; no Python files changed.
- E2E maps legacy fixture centroids to api/_data/regions.json to follow the frozen [lng,lat] seam; Oier's fixture files untouched.
- Official three-demo content is blocked on Sergio/Edur. Tour step parsing is exercised non-vacuously by the current-Case guide and supplied test tours.
- Globe flyTo already consumes focus; visible tour highlights still need Eleder's highlight consumer (same dependency as Task 7).
- Task 8 Step 1 done; Step 2 pending official content and user's PR/merge. Task 9 not started.

## For other roles
- Sergio: mark 3 scientifically validated FINAL cases in docs/science/DEMO_CASES.md, with fixed variable/region IDs, years and seasons.
- Edur: supply final Lead/Scene/Timeline/Evidence/Verdict captions in docs/pitch/DEMO_SCRIPT.md for those cases.

## Next step for whoever continues
- User publishes the branch; convert approved source cases/captions to tours.json, rerun tests and validate real tour/globe behavior before closing Task 8 Step 2.
