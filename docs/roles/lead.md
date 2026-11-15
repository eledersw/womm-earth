# Playbook: Lead / integrator (Eleder, Claude Code)

**Mission:** one working app on the production URL that can always be demoed. You own the shell, the globe, the look, the infra and the seams; you unblock everyone, merge cross-area PRs and run the integration checkpoints.
**Carries:** Presentation, Relevance.
**Your area:** config files, `app/` (except `app/api/partner/`), `components/{ui,shell,globe}/**`, `lib/state/**`, `lib/api/client.ts` + `types.ts`, `public/` (except `public/geo/`), E2E infra. The full list is in `docs/process/OWNERSHIP.md`.

**Inputs you need:**

| What | From | By |
|---|---|---|
| Contract v1 + `countries.geojson` | Oier | H2 |
| Brand brief | Edur | H2 |
| Panel shell | Ekaitz | H2 |
| Full geometry + `regions.json` | Oier | H6 |
| Real `/analyze` | Oier | H8 |
| `/trendmap`, `/mirror` | Oier | H14 |
| `warm.sh` | Oier | H22 |
| Copy QA list | Edur | H24 |

**Outputs others need:**

| What | To | By |
|---|---|---|
| **Scaffold on `main`** | Oier, Ekaitz | **H1.5** |
| **Seams frozen** | everyone | **H2** |
| Build for the user test | Edur | H13 |
| Screenshots | Edur | H18 and H26 |

## Timeline

- [ ] **H0–H0.5: kickoff.** Names are already filled in (done). Share the repo and tell everyone their first command: `/resume <role>` (Claude Code) or `resume <role>` (Codex). Agree that nobody branches until your scaffold is on `main`.
- [ ] **H0.5–H1.5: plan Task 1,** scaffold, deps, CI, deploy, smoke test. Commit straight to `main`, then post "branch from main now".
- [ ] **H1.5–H2: plan Task 2,** seams. Merge at the **H2 checkpoint** right after Oier's contract, then post "seams frozen".
- [ ] **H2: run the H2 checkpoint** (Oier → you → Ekaitz). Run the production smoke test and record it in STATUS.
- [ ] **H2–H4: plan Task 3,** with the design direction session at H3–H4 with Edur.
- [ ] **H4–H8: plan Task 4,** the globe. Run the **H8 checkpoint**.
- [ ] **H8–H14: plan Tasks 5 + 7,** trend map, legend, E2E infra. Have a build ready for the H13 user test. Run the **H14 checkpoint**: Case #1 end to end on production, and nobody goes to sleep with an unmerged branch.
- [ ] **H14–H18: plan Task 6,** mirror arcs, focus, highlight. Leave screenshots for Edur.
- [ ] **H18–H22: sleep.** Oier is the only coder awake; he self-merges his own area only.
- [ ] **H22: run the H22 checkpoint.**
- [ ] **H22–H26: plan Task 8 Steps 1–4,** finish review, copy QA, rate limit, freeze at H26, DESIGN.md.
- [ ] **H26–H29: plan Task 8 Step 5,** warm-up, screenshots, video with Edur, submit by H29.

## Your merge duties (see MERGING.md)

- Merge every PR that touches someone else's area or a seam (breaking), once the affected owner approves.
- After H26, review and merge P0 fixes only.
- Glance at the CI ownership warnings on PRs; a warning means someone edited outside their area.

## If you're blocked

- **No geometry yet:** Oier's Task 1 ships `countries.geojson` at H2. Until then, build on any Natural Earth 110m file locally without committing it.
- **Globe performance is bad:** use 110m countries, show one layer per zoom level, and lower the polygon resolution.
- **Python deploy fails:** check the bundle size and `excludeFiles` first. Plan B is FastAPI on Render/Fly, with the rewrite pointed there.
