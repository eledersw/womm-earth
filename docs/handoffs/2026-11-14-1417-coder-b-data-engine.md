# Coder B · data engine · H2

## Done
- Merged contract v1, typed stub API, OpenAPI/TypeScript generation, contract tests and country geometry (`e7cbc6f`, `e4f4471`, merged via PR #1).
- Created local, unmerged engine branch `oier/engine-core`: yearly series, OLS/MK/Hamed–Rao/Sen, verdicts, API store/endpoints and CLI (`1749680`, `a2a061e`). 44 passed, 1 skipped in its worktree.
- Created local, unfinished data branch `oier/region-library`; pipeline and `api/_data/regions.json` remain uncommitted.

## Decisions made (also logged in PROJECT.md or METHODS.md)
- Follow `METHODS.md` and pymannkendall for Hamed–Rao. Reproducible FPR results contradict plan thresholds: white noise 9.7%, AR(1) φ=.6 24.6%; ask Sergio before claiming <10% in slides.

## State of things
- Works: contract API; local engine core; graph snapshot on main (`a0a5151`).
- Not yet / broken: real regional series generation is unfinished; real trendmap/correlate/mirror/scan and deploy smoke are not complete. Golden cases and hero CSVs are missing.

## For other roles
- @Sergio: review the FPR discrepancy and provide golden cases/hero CSVs.
- @Eleder: verify the production Vercel project and preview bundle.

## Next step for whoever continues
- Inspect `/tmp/womm-earth-data-pipeline` uncommitted data, finish and test library generation; then rebase/merge it with `/tmp/womm-earth-engine` and run the API tests.
