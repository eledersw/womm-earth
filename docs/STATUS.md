# STATUS: live board

**Updated:** Sat 2026-11-14 (H6), by Eleder (Silver Orbit redesign in PR #21)

**Production:** https://womm-earth.vercel.app (auto-deploys from `main`; every PR gets a preview URL. Previews require a Vercel login or the bypass header.)

> 🛑 **`main` now requires the `web` and `api` CI checks (ruleset, H6).** A normal PR merge is blocked while either check is red, for everyone. Direct docs pushes to `main` (STATUS, handoffs, Sergio's and Edur's docs) still work as before. If GitHub says the merge is blocked, fix the checks: never tick "bypass rules" or pass `--admin`. Details in `docs/process/MERGING.md`.
> 🎨 **New look in review: Silver Orbit (H6.5, PR #21).** Modelled on fragment.im (Eleder's pick): near-black space with a starfield, liquid-glass panels, Fragment's type (Stack Sans Headline thin figures, Stack Sans Text, Fragment Mono labels), a chrome silver primary button, and a header pill for three colour schemes (Silver, Nebula, Ember). Region pens are now **amber, teal, orchid, silver** (no red or blue). @Ekaitz: your panel and charts restyle through tokens with no change from you. Please: (1) rename "Calculate" to "Investigate" in `lib/copy/case.ts` once Edur confirms it in `COPY.md`; (2) set headline numbers (slope, p, years to significance) with the `figure` class (Fragment's thin numerals); (3) small labels can use `label-mono`; (4) don't use `.scale-label`, `.chart-paper` or `--paper`/`--ink-*`/`--enamel*`/`--window*`, which are gone. Merge needs CI green, so it waits on the red `main`.
> ▶️ **Lead decision (H6): a case runs on an explicit button.** Choose the variable, regions, period and season, press the button, then the evidence, verdict and Explain appear. Nothing analyses while you are still choosing. Oier's #16 already added it as "Calculate" in `TimelineStep`. @Ekaitz: it's your area; own it, and make Explain start only after the press. @Edur: name it in `COPY.md` (the mockups say "Investigate").

> 📣 **Scaffold is on `main`: branch from it now.** Run `npm ci`, and create a Python venv for `requirements.txt` + `uvicorn`. Then `npm run dev` starts Next.js plus FastAPI on 127.0.0.1:8000. `npm run check` must pass before every PR.
> 🌍 **Globe live (H5, PR #14).** ⚠️ **Seam change:** regions now keep **insertion order** (no sort), and region *i* = pen `--series-(i+1)` on the globe and in the charts. @Ekaitz: nothing to change; your tests pass. Use `regionLatLng(region)` from `@/lib/api/region-geo` for tour fly-tos. @Oier: `/api/py/regions` centroids are **[lng, lat]**; please state it in `Region.centroid` (`Field(description=...)`).

> ~~Superseded by Silver Orbit (PR #21).~~ 🎨 **Visual direction live (H4.2, PR #12): Strip-Chart Recorder.** The panel sits on ruled chart paper, the globe sits in a dark viewing window, and region channels are pen inks. @Ekaitz: use `var(--series-1..4)` for each region's pen, `.scale-label` for labels, only `text-panel` (18px) and `text-scale` (14px), no nested cards, and the verdict as an outlined condensed uppercase stamp. The plan's stepped 5-step rail down the panel edge belongs in `CasePanel`. Tokens: `app/tokens.css`. @Edur: the name plate reads "Earth Case Files" until your brand brief; it is one string in `lib/copy/globe.ts`.

> 🔒 **Seams frozen (H2.8, PR #7).** Use `useCase()` from `@/lib/state/use-case` (inside `<Suspense>`), `useUiStore` from `@/lib/state/ui-store`, `api` / `serverApi` from `@/lib/api/client`, and types from `@/lib/api/types`. Additive changes: ask Eleder. Breaking changes: agreement from everyone affected.

**Deadline:** target H30 ≈ Sun 2026-11-15 18:00 local. *The Story lead confirms the official time at H1 and corrects this line.* **We submit by H29.**
**Current milestone:** M0 (due H2)

State legend: ✅ done · 🟡 in progress · ⛔ blocked · ⬜ not started

## Clock (H0 = Sat 12:00)

| H | Local time | Event |
|---|---|---|
| H0 | Sat 12:00 | Plan approved; docs pushed; 15-min huddle |
| H2 | Sat 14:00 | **M0** · stand-up · name vote · METHODS v1 review (B + Methods) |
| H3–H4 | Sat 15:00–16:00 | Design direction session (Lead + Story) |
| H6 | Sat 18:00 | Stand-up · `case_cli.py` ready |
| H8 | Sat 20:00 | **M1** · demo cases picked |
| H10 | Sat 22:00 | Stand-up |
| H13 | Sun 01:00 | Outsider user test |
| H14 | Sun 02:00 | **M2** · stand-up · **sleep wave 1:** Coder B, Methods, Story |
| H18 | Sun 06:00 | **Sleep wave 2:** Lead, Coder C · pitch block (Methods + Story) |
| H22 | Sun 10:00 | Stand-up · everyone awake |
| H26 | Sun 14:00 | **FEATURE FREEZE** · stand-up |
| H29 | Sun 17:00 | **SUBMIT** |

## Milestones

| Milestone | Done when | State |
|---|---|---|
| M0 (H2) | Docs pushed; Next.js + FastAPI scaffolded; smoke checklist passes; stub API live; Anthropic key + spend cap set; submission rules checked; Zarr spike done | 🟡 |
| M1 (H8) | Data library committed; engine passes golden cases 1–3; globe selects and searches; panel + chart work on stub data; Explain streams; demo cases picked | ⬜ |
| M2 (H14) | Case #1 runs fully on the production URL; trend map live; "Validity checkpoint passed" recorded below | ⬜ |
| M3/M4 (H26) | Should-features merged; finish-review fixes applied; Playwright smoke green; frozen | ⬜ |
| M5 (H29) | Submitted, receipt confirmed | ⬜ |

## Workstreams

| Role | Person | Now | Next | State |
|---|---|---|---|---|
| Lead | Eleder | Globe live (#14); Southern Ocean / Arctic click fix (#17); required checks on `main`; three dark mockups for the redesign | Pick the dark direction, then retoken the shell; Task 5 trend-map colouring (needs Oier's `/trendmap`) | 🟡 |
| Coder B (data & stats) | Oier | Live POWER `/analyze` merged (#16): dynamic monthly POWER catalogue, request-time regional observations, no local series fallback. FPR check: Hamed–Rao 9.7% (white) / 24.6% (AR1), matching pymannkendall; Sergio to review the slide claim. | **Fix the red `api` check (see Blockers).** Regenerate OpenAPI/types; validate a live case and POWER availability limits. | 🟡 |
| Coder C (panel, charts, partner) | Ekaitz | Tasks 1–6 completed and merged into `main` (Task 6: PR #18). Seven validated tools, streaming chat, explicit Open this case, cancellation and numeric checks. Web regressions from PR #16 fixed; Calculate remains explicit. Check + 124 tests + 12 Chromium E2E pass with mocks/fixtures. | Live Claude/tool smoke in Vercel pending. Oier still owns the Python CI issue. Process cards remain draft, so no physical explanations. | 🟡 |
| Methods & Validity lead | Sergio | On `sergio/methods`: DATA_CATALOG complete with 16 scientifically signed-off POWER variables, live metadata/coverage evidence and citations. METHODS v1 ready for Oier review; engine acceptance not granted. | Oier: fix regional user parameter and integrate catalog metadata (see `docs/science/catalog/README.md`); methods/golden review. Edur tone review and Giovanni hero import remain pending. | 🟡 |
| Story & Submission lead | Edur | — | Submission recon, brand brief | ⬜ |

## Checkpoints

- [x] Smoke deploy (Lead). **Production ✅ at H3.5** (https://womm-earth.vercel.app)
  - [x] nested route with a query string answers (`/api/py/health?x=1`) → 200
  - [x] numpy 2.5.4 + scipy 1.18.1 import on Vercel
  - [x] `/api/partner` answers alongside `/api/py/*` (stub → 501); Oier's `/api/py/regions` stub → 200
  - [x] cold start: 0.64 s import on Vercel (0.08 s locally); a warm request takes ~0.55 s round trip from Spain to iad1
  - [x] Python 3.12.16 on Vercel (from `.python-version`)
- [ ] Validity checkpoint passed (Methods lead, by H14)
- [ ] Accuracy eval score: ___ / 20 (Methods lead + Coder C, H22–H24)
- [ ] Submission checklist complete (Story lead + Lead, H29)

## Blockers

- [Eleder] Protection Bypass for Automation and Anthropic spend cap · Eleder (dashboard); ANTHROPIC_API_KEY is configured in Vercel per user report · since H3.5

- [coder-c] Confirm production rate limit for `/api/partner` before public Explain rollout · Eleder (Vercel firewall) · since H4.1

- [Oier, Ekaitz] ⛔ **`main` CI is red since PR #16** (`oier/power-live-all-variables`). (1) api: `tests/test_api.py` calls NASA POWER live and fails in CI (422 "NASA POWER cannot serve this variable"), so mock the network or mark those tests live-only. (2) web: Ekaitz fixed the lint/panel-test regressions locally on `ekaitz/task6-partner-chat` (check + 124 tests pass); Calculate is still manual. Awaiting user PR/merge. **GitHub now enforces it:** no PR merges normally until both checks are green. The first fix PR will still show the other job red, so post it in STATUS and Eleder merges it with the bypass once its own job is green. · Oier + Ekaitz · since H5.8

- [coder-c] At 390px the shell header Share button extends ~2px past the viewport; panel bounds pass independently · Eleder (header) · since H5.7

- [methods-lead] METHODS v1 review and engine alignment pending: flat golden key is not consumed by the current harness; missing-year inference and undefined-OLS fallback need validation. See `docs/science/METHODS_REVIEW.md`. No validity sign-off yet. · Oier + Sergio · since 2026-11-14

- [methods-lead] Catalog handoff: NASA regional API rejects the app's `user=womm_earth` (422, alphanumeric required); `user=wommearth` succeeds with valid bounds. Approved definitions are not yet overlaid on the dynamic catalog. Reproduction and owner actions: `docs/science/catalog/README.md`. · Oier (API/integration), Edur (tone review) · since 2026-11-14

Format: `- [owner] what is blocked · who can unblock it · since H?`
