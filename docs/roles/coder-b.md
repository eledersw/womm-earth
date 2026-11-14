# Playbook: Coder B, data & stats engine (Oier, Codex)

**Mission:** turn NASA data into reliable region series and implement `docs/science/METHODS.md` exactly. The spec is the source of truth: when something is unclear, ask Sergio rather than guess.
**Carries:** Validity.
**Your area:** `api/**`, `pipeline/**`, `tests/**`, `requirements*.txt`, `public/geo/**`, `lib/api-types.ts` (generated) and your scripts. The full list is in `docs/process/OWNERSHIP.md`. **Edit nothing outside it.**
**Your plan:** [`docs/superpowers/plans/2026-11-14-data-engine.md`](../superpowers/plans/2026-11-14-data-engine.md). It has the exact files, interfaces, tests and commands. This playbook is the timeline.

**How you work (Codex):**
1. Open Codex in the repo; it reads `AGENTS.md` automatically. Type **`resume coder-b`**.
2. Tell it *"work Task N of my plan"*. It ticks the plan's checkboxes as it goes.
3. Follow the PR loop in `docs/process/MERGING.md`: a `oier/<topic>` branch, rebase, `python -m pytest -q`, PR, then self-merge if the PR only touches your area.
4. End every session with **`handoff coder-b`**.

**Inputs you need:**

| What | From | By |
|---|---|---|
| Scaffold merged to `main` | Eleder | H1.5 |
| `METHODS.md` v1 | Sergio | H2 |
| Hero CSVs | Sergio | H4 |
| Golden cases | Sergio | H5 |
| Review-gate findings | Sergio | H11–H14 |

**Outputs others need:**

| What | To | By |
|---|---|---|
| Variable list from the Zarr spike, posted in STATUS | Sergio | H1 |
| **Contract v1 + stub API + `countries.geojson`** | Eleder, Ekaitz | **H2** |
| `case_cli.py` | Sergio | H6 |
| Real `/analyze`, `/variables`, `/regions` | everyone | H8 |
| `/trendmap`, `/correlate`, `/mirror` + the FPR figure | everyone | H14 |
| `scripts/warm.sh` | Eleder | H22 |

## Timeline

- [ ] **H0.5–H1.5: Zarr spike in Colab** (outside the repo while Eleder scaffolds). List the variables present, the fill value, the latest month and the MERRA-2 store path. Post them in STATUS and set the `DATA_CATALOG.md` rows to `in store`. Tell Sergio to commit that, since it's his file.
- [ ] **H1.5–H2: plan Task 1, contract + stub API + first geometry.** Branch from `main` after Eleder's scaffold. Merge **first** at the H2 checkpoint.
- [ ] **H2:** a 10-min `METHODS.md` v1 review with Sergio, then update `api/_engine/config.py` to match.
- [ ] **H2–H6: plan Task 2, the pipeline in Colab.** Demo variables first. Geometry + `regions.json` → tell Eleder.
- [ ] **H2–H8: plan Task 3, engine core (TDD).** Copy the golden cases into `tests/fixtures/golden/` as Sergio delivers them.
- [ ] **H6: plan Task 4 Step 4.** Get `case_cli.py` to Sergio.
- [ ] **H6–H8: plan Task 4, real endpoints.** Merge first at the **H8 checkpoint**.
- [ ] **H8–H14: plan Task 5,** trend map, correlation, mirror. Fix the review-gate findings. Export the FPR figure. Merge first at the **H14 checkpoint**; don't sleep with an unmerged branch.
- [ ] **H14–H18: sleep.**
- [ ] **H18–H22: plan Task 6,** hardening, scanner, `warm.sh`. Merge at the **H22 checkpoint**.
- [ ] **H22–H29:** fixes from the eval and QA. After the H26 freeze, P0 only, merged by Eleder. Stay on call during submission.

## If you're blocked

- **A store or variable is missing:** use the POWER REST monthly API for the demo regions only, and tell Sergio which variables dropped out.
- **No golden cases yet:** the property tests in plan Task 3 cover you; `test_golden.py` skips until the fixtures arrive.
- **You need a change in Eleder's or Ekaitz's files** (e.g. `vercel.json`, `package.json`): ask them in chat or in STATUS. Don't edit those files yourself.
