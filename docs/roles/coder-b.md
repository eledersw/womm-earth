# Playbook: Coder B, data & stats engine

**Mission:** turn NASA data into reliable region series, and implement `docs/science/METHODS.md` exactly. The spec is the source of truth: when something is unclear, ask the Methods lead rather than guess.
**Carries:** Validity.
**Owns:** `pipeline/`, `api/` (FastAPI + Pydantic contract), `api/engine/` + `tests/`, `scripts/case_cli.py`, caching, keep-warm.

**Inputs you need:**

| What | From | By |
|---|---|---|
| `METHODS.md` v1 | Methods lead | H2 |
| Golden cases (`docs/science/golden_cases/`) | Methods lead | H5 |
| Giovanni hero CSVs | Methods lead | H4 |
| Review-gate findings | Methods lead | H11–H14 |

**Outputs others need:**

| What | To | By |
|---|---|---|
| Variable list from the Zarr spike, posted in STATUS | Methods lead | H1 |
| Stub API + `openapi.json` | Lead, Coder C | H2 |
| `case_cli.py` | Methods lead | H6 |
| Real `/analyze`, `/variables`, `/regions` | Lead, Coder C | H8 |
| `/trendmap`, `/correlate`, `/mirror` | Lead, Coder C | H14 |
| False-positive simulation export | Methods lead | before sleeping at H14 |

## Steps

- [ ] **H0–H0.5: plan.**
  - Create your worktree (`superpowers:using-git-worktrees`).
  - Run `superpowers:writing-plans` on this playbook plus ARCHITECTURE → `docs/superpowers/plans/2026-11-14-data-engine.md`.
- [ ] **H0.5–H1: Zarr spike in Colab** (not over venue wifi).
  - Open the POWER monthly Zarr stores (CERES path in ARCHITECTURE; find the MERRA-2 one).
  - List the variables present, check the −999 fill value and the latest populated month.
  - **Done when:** the variable list is posted in STATUS for the Methods lead and the `DATA_CATALOG.md` statuses are updated to `in store`.
- [ ] **H1–H2: stub API.**
  - Write every Pydantic model in its final schema, with endpoints returning fixture JSON.
  - Add `FastAPI(openapi_url="/api/py/openapi.json")` and the `gen:types` dump script.
  - **Done when:** the Lead and Coder C have generated `lib/api-types.ts` and are building against it.
- [ ] **H2: METHODS review.** A 10-min review of `METHODS.md` v1 with the Methods lead. Write down every parameter you'll implement.
- [ ] **H2–H6: pipeline.**
  - Masks with `regionmask`: −180..180 longitudes, antimeridian handling, nearest-cell fallback flagged, mainland overrides.
  - Area-weighted (cos lat) means. Demo variables first.
  - Write the validity matrix, `regions.json` and `series_<VAR>.npz`; commit only these small outputs.
  - **Done when:** T2M, PRECTOTCORR and GWETROOT are committed for all regions.
- [ ] **H2–H8: engine core, TDD** (`superpowers:test-driven-development`).
  - Series construction: season wrap, edge trimming, missing-data rule.
  - OLS with AR(1)-corrected SE.
  - Hamed-Rao Mann-Kendall, ported from the pymannkendall source.
  - Sen's slope + CI.
  - Verdict tiers.
  - Tests use the golden cases in `tests/fixtures/`.
- [ ] **H6: `scripts/case_cli.py`.** `--var --region --start --end --season` → a result table (slope/decade, MK p, OLS p, verdict, years until significant). Tell the Methods lead it's ready.
- [ ] **H6–H8: real endpoints** `/analyze`, `/variables`, `/regions`.
  - **M1 done when:** golden cases 1–3 pass and `/analyze` returns real data on the preview deploy.
- [ ] **H8–H14: the rest of the engine.**
  - `/trendmap` (vectorised, Cache-Control).
  - `/correlate` (anomalies, detrended values, Bretherton n_eff, lag ±6).
  - `/mirror` (same region type, no containment pairs, `none_found`).
  - Years until significant.
  - Fix whatever the Methods lead's review gate finds.
  - **Before sleeping:** export the false-positive simulation (naive MK vs Hamed-Rao on AR(1) noise) as a CSV + PNG to `docs/science/figures/`.
  - **Done when:** all golden cases pass and the Methods lead has recorded "Validity checkpoint passed".
- [ ] **H14–H18: sleep.**
- [ ] **H18–H22: hardening.**
  - Scanner (BH-FDR) and Pettitt (Could).
  - Edge cases: an all-NaN series, or fewer than the minimum years → no verdict, with a reason.
  - Contract test: every response validates against its model.
  - `lru_cache` lazy loading and a keep-warm script.
- [ ] **H22–H29: fixes and support.** Fix bugs from the eval and QA. Only P0 fixes after the H26 freeze; stay on call during submission.

## If you're blocked

- **A Zarr store or variable is missing:** use the POWER REST monthly API for the demo regions only, and tell the Methods lead which variables dropped out.
- **No golden cases yet:** write the property tests (known slope recovered, noise ≈5% false positives) and swap in the golden values when they arrive.
- **Bundle too big or cold start too slow:** drop everything except numpy, `scipy.special` and fastapi; lazy-load the data.
