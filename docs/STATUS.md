# STATUS: live board

**Updated:** Sat 2026-11-14 (H8), by Eleder (Task 8 reviews, PR #43)

**Production:** https://womm-earth.vercel.app (auto-deploys from `main`; every PR gets a preview URL. Previews require a Vercel login or the bypass header.)

> 🔍 **Task 8 reviews (H8, PR #43).** Finish review + performance pass done; my fixes are in #43. **@Ekaitz (from the reviews):** (1) yearly chart: Wisconsin's confidence band is mispositioned (slopes 23→20 while its OLS line is flat at about 19.7); (2) show units via `displayUnit` from `components/globe/palette.ts` (verdict text, variable select and y-axis still say "C"); (3) put Verdict above Evidence in the results pane and give the chart a height that fits (the "Year" title clips); (4) one heading per block: drop the helper lines under LEAD/SCENE/TIMELINE/EVIDENCE/VERDICT and "Explanation" in explain cards (eyebrow ban); (5) the verdict cards and the explain pane both explain: keep the explanation only in the explain pane, and cut verdict bodies to verdict + slope + 95% range; (6) the pinned Investigate footer should be opaque `bg-space-2` (blur smears chips); drop the "Search NASA POWER parameters" label (same as its placeholder); use the ui Checkbox for Predict; (7) Scene chips: lucide `X` instead of the "×" glyph, and each chip's pen swatch; (8) perf: lazy-load the charts with `next/dynamic`, cache analyses by `caseKey` in `useAnalysis`. **@Oier:** (1) `/analyze` fetches regions one after another (3 regions take 4.0 s): `asyncio.gather` + a TTL memo on POWER requests; (2) GeoJSON: round coordinates to 3 decimals and simplify `named`/`oceans` (849 KB → under 200 KB gz); (3) `Cache-Control: public, s-maxage=21600, stale-while-revalidate=86400` on `/variables`, `/regions`, `/trendmap`; (4) real `/trendmap`, then set `NEXT_PUBLIC_TRENDMAP_LIVE=1` in Vercel to switch the globe colours on.
> 🌍 **PR #33 (H7): trend map + legend (Task 5), compact UI, "Explain & ask" pane, Sonnet 5.5.** @Oier: the globe now colours by `/api/py/trendmap`, which still returns the Wisconsin-only fixture; please compute real entries for every region (same contract: `slope_per_decade`, `p`, `q` FDR, `tier`). @Ekaitz: cross-area again, please approve: no Student/Scientist switch, explanations and chat live in an always-open right-hand pane, "Partner" wording removed from the UI, `VerdictStep` gains `showExplanation`. **Model is now `claude-sonnet-5-5`** (Eleder's call; AGENTS.md and ARCHITECTURE.md updated). e2e specs updated but not run locally (no Playwright browsers on Eleder's machine).
> 🛑 **`main` now requires the `web` and `api` CI checks (ruleset, H6).** A normal PR merge is blocked while either check is red, for everyone. Direct docs pushes to `main` (STATUS, handoffs, Sergio's and Edur's docs) still work as before. If GitHub says the merge is blocked, fix the checks: never tick "bypass rules" or pass `--admin`. Details in `docs/process/MERGING.md`.
> 🎨 **Silver Orbit is on `main` (#21); round two in PR #23, @Ekaitz please approve.** The product is now **WOMM Earth** (wordmark only). The glass is clearer, Silver is the only scheme, and Fragment Mono carries headings, nav and buttons. **Single Investigate flow (cross-area, at Eleder's request):** `CasePanel` now shows Lead, Scene and Timeline plus one Investigate button; after the press, the evidence, the verdict with its explanation, and the partner chat open in a results pane on the right (portal into `#case-results`). Your steps, hooks, charts and partner are reused unchanged; `TimelineStep`'s own button is optional; the tabs are gone; your tests are updated (127/127 pass). @Ekaitz: (1) review and approve #23; (2) `lib/partner/prompts.ts` still says "Earth Case Files", so rename it when you next touch the prompt; (3) use the `figure` class for headline numbers. @Edur: the button label is "Investigate" in `lib/copy/case.ts`; please mirror it in `COPY.md`.
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
| Coder B (data & stats) | Oier | On branch `oier/methods-v1-engine`: METHODS v1 combined inference, nullable OLS fallback, nine golden cases active in CI, and request-time POWER map/mirror/scan with shared map BH family. Local `pytest` 71/71, Vitest 197/197 and `npm run check` pass. | Rebase/merge, measure cold 314-region map latency on production, then have Sergio repeat validity review. Missing-year inference, correlation and Option B years-needed power still need independent scientific validation; no validity sign-off yet. | 🟡 |
| Coder C (panel, charts, partner) | Ekaitz | Tasks 1–8 implementation and Task 9 tooling merged (#26, #28, #32). Sergio’s new verdict templates/grounding integration completed: actual-year coverage and combined-p consistency guard; provisional mismatch notice preserves reported tier; labelled MK fallback; safe years/zero estimates, intervals and percentages (no combined-rule 50% power claim); separate Explain/Partner prompts with applicable cards and Case IDs/custom months. Check + 182 Vitest + 17 Chromium E2E pass; one live test skipped. | Close Task 9: Oier aligns engine and unavailable-inference contract; Edur supplies captions/tone review; Sergio completes/reconciles EVAL.md (3/20, old Case 1 context), approves generated texts and scores the real run. Key only in Vercel; live verification deferred per user. User handles push/PR/merge of scientific integration. PR #33 is a separate pending UI/model change; globe integration remains with Eleder. | 🟡 |
| Methods & Validity lead | Sergio | Task 9 science pack ready: EVAL 20/20 questions with explicit Cases; Student/Scientist limitations; slide/project-page/Q&A source in `docs/science/PITCH_SCIENCE.md`. Exact backend request in `docs/science/OIER_HANDOFF.md`. Task 8 gate remains failed on recorded numerical evidence. | Oier: repair METHODS/key alignment, golden CI, estimate visibility and real map/BH. Edur: assemble/adopt science copy. Ekaitz/Sergio: real evaluation and demo-text review after prerequisites. Outsider test omitted by Sergio after reported team self-testing; no independent-user claim. | 🟡 |
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

- [Oier, Ekaitz] ⛔ **`main` CI is red since PR #16** (`oier/power-live-all-variables`). (1) api: `tests/test_api.py` calls NASA POWER live and fails in CI (422 "NASA POWER cannot serve this variable"), so mock the network or mark those tests live-only. (2) web: Coder C's lint/panel-test fixes are completed and merged; the scientific integration passes check + 182 tests + 17 Chromium E2E. Investigate remains explicit. **GitHub now enforces it:** no PR merges normally until both checks are green. The first fix PR will still show the other job red, so post it in STATUS and Eleder merges it with the bypass once its own job is green. · Oier + Ekaitz · since H5.8

- [coder-c] At 390px the shell header Share button extends ~2px past the viewport; panel bounds pass independently · Eleder (header) · since H5.7

- [methods-lead] Task 8 gate FAILED on reviewed main e4225ba and live API: reference 9/9; full checked yearly engine fields 1/7; golden CI still skips delivered fixtures. Production Aral GWETROOT returns Confirmed versus v1 No case; Wisconsin precipitation No case still has 27 additional years. Oier owns statistical alignment/harness/visibility fixes. See `docs/science/review/README.md` and archived evidence. Validity checkpoint remains unticked. · Oier + Sergio · reviewed 2026-11-14

- [methods-lead] Catalog metadata overlay landed on main in PR #24; upstream alphanumeric-user fix also verified by five successful unmodified CLI cases. Original request/overlay blocker resolved. Production metadata QA and engine validity remain separate; Edur tone review pending. See `docs/science/catalog/README.md` for original evidence and `docs/science/demo/cli_checks.json`. · Oier + Sergio + Edur · updated 2026-11-14

- [coder-c] Task 7 globe integration: `components/globe/GlobeView.tsx` does not consume `highlight` (mirror regions/arcs) or `predictMode && !reveal` (hide trend colours). Panel already writes the frozen store fields; no seam change needed · Eleder (globe) · since H6.6

- [coder-c] Task 8 official demos / Task 9 cache: Sergio has selected 3 FINAL + 2 BACKUP and supplied ten process cards (converted). DEMO_CASES.md requires engine alignment before using its keys; DEMO_SCRIPT.md captions are still placeholders. tours.json and demo-explanations.json stay empty until those prerequisites and text review are satisfied · Oier (engine) + Edur (captions) + Sergio (review) · updated H7.2

- [coder-c] Task 9 official eval (tooling merged #32): EVAL.md has 3/20 complete questions; its Wisconsin smoke Case 1 context differs from the new FINAL 1 Colorado temperature. Harness preflight blocks an incomplete/unresolved run. No accuracy score or scientific approval claimed; real Claude/cache verification remains deferred (key only in Vercel). Python checks could not start: pytest and backend dependencies absent · Sergio (rubric/context reconciliation, score) + deployment/environment setup · since H7.2

- [coder-c] Scientific templates/grounding are integrated with conservative guards, not engine validity sign-off. The current non-nullable OLS contract cannot represent every unavailable-inference case; only the existing n_eff <= 2 diagnostic authorizes an MK-only display fallback. Malformed/unknown inference is withheld. Missing-year inference remains provisional; its years estimate and demo-cache generation are blocked. Edur tone/tooltips adoption and Oier/Sergio validation remain pending · Oier + Sergio + Edur · since H7.7

- [methods-lead] Production trendmap returns the exact one-region fixture for different variable/period requests; fixture Wisconsin summer temperature is +0.8 °C/decade Confirmed versus live /analyze +0.098637 No case in the same context. Ten genuine map-region checks and runtime BH/mirror key cannot pass. Oier: implement real map/BH; Eleder: consume real values, not fixture colouring. Evidence in `docs/science/review/production_review.json`. · Oier + Eleder + Sergio · since 2026-11-14

Format: `- [owner] what is blocked · who can unblock it · since H?`
