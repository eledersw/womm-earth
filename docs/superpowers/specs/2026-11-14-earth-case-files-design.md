# Earth Case Files (working name): Hackathon Plan

> **Snapshot of the design as approved at H0.** At H0.5, paths and process were refined: the engine and data live in `api/_engine/` and `api/_data/`; ownership and merging are in `docs/process/`; the implementation plans are in `docs/superpowers/plans/`. Where this file differs from the living docs or the plans, those win.

## Context

Team WOMM (5 people: 3 coders, 2 non-coders) is in NASA Space Apps 2026, challenge **"Be An Earth System Trend Detective!"**, with **about 30 hours left**. The repo holds only the challenge context in `public/docs/`. This plan sets the direction, scope, architecture, roles, schedule, plugin usage and progress-tracking docs so any new Claude chat can pick up the work cold.

**Decided with the team:**
- **Direction: hybrid A+B+C.**
  - The backbone is a guided *Case Files* detective flow: Lead (variable) → Scene (region) → Timeline (period + season) → Evidence (charts) → Verdict.
  - From *Mirror Earth*: a global trend map plus an opposite-trend "mirror" finder.
  - From *Signal Scanner*: a "years until significant" meter, plus (stretch) a scan of every variable for one region.
  - Claude plays the "partner detective".
- **Data:** a pre-built regional library from NASA POWER's public monthly Zarr on AWS (no login), plus one Giovanni "hero" series (MODIS Aqua AOD over Wisconsin) for Case #1.
- **Claude model:** `claude-opus-5-5` for everything.
- **Stack:** Next.js/TypeScript front end and Python (FastAPI) back end, both on Vercel. The UI is a **3D globe** you move around, with the panel on the left.

**Judging** scores each criterion 1–5. What should earn each score:

| Criterion | What earns it |
|---|---|
| Relevance | Follows the challenge's 5 steps exactly. Rebuilds NASA's own video example (Wisconsin AOD, MODIS Aqua, summers since 2002) as Case #1. Plain definitions for every variable. Watchable demo cases. |
| Validity | Verdicts run on one value per year. Mann-Kendall corrected for autocorrelation (Hamed-Rao) + Sen's slope, next to OLS with an autocorrelation-corrected CI. Regional means weighted by area. Data source on every chart, labelled "satellite" or "reanalysis/model". A simulation slide showing our false-positive control. Claude's numbers are checked automatically against our engine's output. |
| Creativity | Mirror finder (one process, opposite trends). "Years until significant" meter. Predict-before-reveal. Detective framing. |
| Impact | Teaches students *why* a trend is or isn't significant. Shareable case links. Student/Scientist reading levels. |
| Presentation | Polished, non-template UI built with the design plugins. A tight 3-case demo with instant, pre-generated explanations. A launch video made with `brag`. |

## Scope for 30 hours (MoSCoW)

**Must** (end to end on production by H14):
- **Globe:** countries, US states, ocean basins and about 15 hand-drawn "named regions" (Sahel, Arctic, Mediterranean, Aral basin, a few metro areas). Countries show when zoomed out, states when zoomed in. Selection by click **or** a search box in the panel, up to 4 regions compared at once. Trend-map colouring for the current variable, period and season.
- **Left panel:** the 5-step case flow, a period slider and a season filter (Annual / DJF / MAM / JJA / SON / custom months).
- **Chart:**
  - Raw monthly values plus the de-seasoned anomaly, for display.
  - The yearly (or seasonal) series that the verdict tests.
  - An OLS line with its CI band and a Sen's slope line.
  - Overlays when several regions are selected.
- **Statistics engine** (see below).
- **Verdict tiers:** **Confirmed** (MK p<0.05), **Not proven yet** (0.05≤p<0.20, shows years until significant), **No case** (p≥0.20). The Methods lead fixes the final cutoffs in `METHODS.md`. A template writes a plain-language verdict that works without Claude.
- **Claude explanation:** streamed, with a Student/Scientist toggle. **The 3 demo cases use pre-generated, cached explanations.**
- **Data:** about 15 variables, each with a definition card. Variables that don't apply to a region are greyed out (land-only ones over the ocean).
- **Demo tour:** 3 demo cases with a "Watch this case" tour. Each step is a stored case state plus a caption.
- Deployed on Vercel.

**Should** (H14–H22): correlation view (two variables, de-seasoned and detrended anomalies, lag search ±6 months, a "both rising ≠ connected" warning, scatter + regression); years-until-significant meter; mirror finder; partner chat with tools that can propose and open a case; share link (the URL holds the case state); predict-before-reveal toggle.

**Could:** Signal Scanner (variables × seasons, with BH-FDR correction for running many tests); Pettitt change point ("when did it change?"); live custom area through the POWER REST API; PNG/PDF case report.

**Won't:** accounts, a database, mobile-first layout (tablet-usable is enough).

## Statistical engine (`api/engine/`, numpy + `scipy.special` only)

Use `scipy.special.ndtr`/`stdtr` rather than `scipy.stats`, because importing `scipy.stats` costs about 1s of cold start. pymannkendall is a **test-only** reference, and Hamed-Rao is ported from its source.

- **Series construction:**
  - **Season filter:** one mean per year. DJF counts December toward the *following* year. Incomplete seasons at either end are dropped, and the same wrap rule applies to custom month sets.
  - **No season filter:** the verdict uses annual means. Monthly anomalies (each month minus its calendar-month average) are used **only** for display and correlation.
- **Trend** (always on the one-value-per-year series):
  - OLS: slope, SE inflated for lag-1 autocorrelation using the Santer effective n, t-test p-value, CI, R².
  - Modified Mann-Kendall (Hamed-Rao): p-value, Kendall τ, Sen's slope + 95% CI.
  - Lag-1 autocorrelation φ.
  - Agreement flag between OLS and MK.
  - Change per decade, in units and as % of the mean.
- **Years until significant:** for a yearly series, var(slope) = 12σ²/(n(n²−1)) · (1+φ)/(1−φ). Solve for the n at which |slope|/SE reaches the critical t-value. Report "≈N more years at the current rate". Hide the number when the slope ≈ 0.
- **Correlation:**
  - Pearson + Spearman on de-seasoned monthly anomalies, both raw and detrended.
  - p-values use the Bretherton effective sample size.
  - Lag search ±6 months.
  - Warning when the raw r is high but the detrended r is low.
- **Mirror finder:**
  - Compute the trend for every region of the **same type** (country↔country, named↔named) and drop pairs where one region contains the other (USA vs Wisconsin).
  - Keep significant trends with the opposite sign and rank them by |z|. Anomaly anticorrelation breaks ties.
  - Return the top 3, or an explicit "no mirror found" state.
  - The explanation comes from curated process cards.
- **Trend map:** vectorised across all regions, returns `{region_id: slope, p, verdict}`, cached with Cache-Control.
- **Scanner (Could):** variables × {annual, 4 seasons} → BH-FDR at q=0.05 → ranked list.
- **Tests (TDD; they double as slide material):**
  - A known slope plus noise is recovered within the CI.
  - With white noise, the false-positive rate is ≈5% over 1000 simulations.
  - With AR(1) noise, naive MK inflates false positives while Hamed-Rao stays much lower and under ~8%. That is honest at n≈25–45; don't assert exactly 5%.
  - Results agree with pymannkendall and `scipy.stats.linregress` (the reference, in tests only).
  - The years-until-significant formula agrees with a Monte-Carlo check.
  - Season wrap and edge trimming behave as specified.

## Architecture and repo layout

```
CLAUDE.md                     auto-loaded by every Claude Code chat
docs/                         see "Progress tracking"
app/                          Next.js App Router (TS)
  layout.tsx                  NuqsAdapter (nuqs/adapters/next/app)
  page.tsx                    globe + left panel (case UI inside <Suspense>)
  api/partner/route.ts        Claude (runtime 'nodejs', maxDuration set), server-only key
components/globe|panel|charts|tour/
lib/                          api client, generated api-types.ts, url-state, store
api/                          Vercel Python function (FastAPI), every route prefixed /api/py
  index.py                    variables, regions, analyze, correlate, trendmap, mirror, scan, health
  engine/                     pure stats functions (unit-tested)
  data/                       series_<VAR>.npz [region × month] float32, regions.json (incl. validity matrix),
                              variables.json, process_cards.json, hero/*.json, demo_explanations.json
pipeline/                     offline only; own requirements (xarray, zarr, fsspec, dask, regionmask, geopandas)
public/geo/                   simplified TopoJSON (countries NE 110m display, US states, oceans, named regions); earth textures self-hosted
tests/ (pytest)   e2e/ (playwright)   scripts/case_cli.py (run any case from the terminal)
```

**Contract:** the Pydantic models in `api/` are the source of truth. A script dumps `app.openapi()` to `api/openapi.json`, and `openapi-typescript` turns it into `lib/api-types.ts` (`npm run gen:types`). No running server is needed.

**Next + FastAPI wiring:**
- Copy Vercel's Next.js+FastAPI template exactly. Set `FastAPI(openapi_url="/api/py/openapi.json")`.
- The dev rewrite goes to `http://127.0.0.1:8000`, not `localhost`: on Windows, Node resolves localhost to `::1` and uvicorn won't answer.
- In `vercel.json`, set `functions.includeFiles: "api/data/**"` and `excludeFiles` for `pipeline/`, `node_modules/` and `public/`.
- Pin the Python version.

**H2 smoke deploy must prove:** a nested `/api/py/...?...` route with a query string, a numpy+scipy import, a read of one data file, and the cold-start time.

**Front-end gotchas:**
- **Globe:**
  - `react-globe.gl` sits in a `'use client'` wrapper using `dynamic(..., {ssr:false})`.
  - `polygonsData` stays referentially stable; only the cap-colour accessor changes.
  - Show one polygon layer per zoom level, to avoid overlap and z-fighting.
- **Charts:** Observable Plot goes in a single `<PlotFigure>` client wrapper with `useRef`, effect cleanup, `ResizeObserver` and colours from CSS variables.
- **URL state:**
  - nuqs is the only source of case state. Zustand only holds hover and chat state.
  - Region arrays use `parseAsArrayOf` with a canonical sort, so share links stay stable.
  - The slider commits on release with `history:'replace'`.
- **Backend performance:**
  - `.npz` files load lazily through `lru_cache`.
  - A keep-warm ping runs before judging.

**Front-end libraries:** `react-globe.gl`, Observable Plot, shadcn/ui + Tailwind (restyled), nuqs, zustand.

## Data pipeline (Coder B; spike in H1, finished by H6)

1. **Spike the stores at H1.** Open POWER's monthly Zarr with `fsspec` + `xr.open_zarr(consolidated=True)`.
   - CERES grid: `https://nasa-power.s3.amazonaws.com/syn1deg/temporal/power_syn1deg_monthly_temporal_lst.zarr`.
   - Find the matching MERRA-2 path.
   - Record which variables actually exist, mask the −999 fill value, and check that the latest months are populated.
2. **Bandwidth:** expect roughly 440 MB per variable for the full grid and full period (about 6 GB for 15 variables).
   - **Run the pipeline in Google Colab or a GitHub Codespace**, not over hackathon wifi.
   - Read in parallel with dask, demo variables first (T2M, PRECTOTCORR, GWETROOT, AOD if present).
   - Commit only the small `.npz` outputs.
3. **Masks:**
   - Use `regionmask` over Natural Earth admin-0 at 50m (mainland override list for France, Norway and similar), US admin-1, ocean basins and the named regions.
   - Normalise longitudes to −180..180 and handle the antimeridian (Russia, Fiji, Alaska).
   - Weight by cos(lat).
   - Regions too small to contain a grid-cell centre fall back to the nearest cell, flagged in `regions.json` and shown in the UI.
4. **Validity matrix:** per variable×region, so land-only variables are NaN or greyed out over the ocean.
5. **Hero series:** the Methods lead downloads the Giovanni CSV for MODIS Aqua AOD over Wisconsin. `import_giovanni.py` converts it to `hero/*.json` in the shape `{variable, region, source, instrument, doi, t0, values[]}`. The engine sees only arrays; the UI shows a provenance badge.
6. **Stub first:** at **H2**, Coder B publishes the stub API with fixture JSON in the final schema, so the Lead and Coder C are never blocked waiting for the pipeline.
7. **Fallback:** the POWER REST monthly API, for the demo regions only.

## Claude integration (Coder C)

Load the `claude-api` skill and read `typescript/claude-api/README.md`, `tool-use.md` and `streaming.md` before writing code.

- **Route** `app/api/partner/route.ts`, using `@anthropic-ai/sdk`:
  - `claude-opus-5-5`, adaptive thinking, explicit `output_config.effort` (start at `low` for Explain and `medium` for Partner, then tune).
  - Server-side fallback (`fallbacks: "default"`).
  - Handle the `refusal` and `max_tokens` stop reasons.
  - Cap the number of tool-loop iterations.
  - Stream to the browser as our own SSE events (`text`, `tool_result`, `propose_case`, `error`).
- **Explain:** the client posts the stats JSON it already has, so there is no server-to-server hop. Demo cases read `demo_explanations.json`, which is pre-generated.
- **Partner:**
  - Tool Runner with `betaZodTool` tools: `list_variables`, `analyze_case`, `correlate`, `find_mirror`, `scan_region`, `get_process_card` and `propose_case`.
  - `propose_case` renders an "Open this case" button. This covers the challenge's "short series of questions" onboarding.
  - Tools call `/api/py` by absolute URL. On protected previews they send the `x-vercel-protection-bypass` header, and Playwright uses the same bypass.
- **Grounding:**
  - The system prompt says: only numbers from tool results; name the test used; "not significant" ≠ "no change"; physical explanations only from process cards, or flagged as general knowledge.
  - A **number check** compares every number in the output against the tool JSON. It flags mismatches in dev and doubles as the eval harness.
- **Cost and safety:**
  - The key lives only in Vercel env, never as `NEXT_PUBLIC_`.
  - Prompt caching covers the frozen system prompt + catalog + process cards; confirm `cache_read_input_tokens` > 0.
  - Cap `max_tokens`.
  - A **Vercel Firewall rate-limit rule** on `/api/partner`. In-memory limits don't work on serverless.
  - Set an **Anthropic Console workspace spend cap**; the team picks the amount.
  - The template verdict always renders, so the app works with Claude down.

## Design approach (avoid the "vibe-coded" look)

**One aesthetic owner, the Lead,** so the plugins don't fight. The Lead works from the Story lead's brand brief, and the Story lead attends the direction session and picks between options.
- **impeccable** sets the direction contract at H3–H4. Starting brief: "scientific instrument at night": dark globe, restrained neutrals, one accent, a colourblind-safe diverging red/blue for trends, tabular monospace numerals, generous spacing. No purple gradients, emoji icons or default shadcn look.
- **ui-ux-pro-max** (design-system, ui-styling) picks the fonts and palette and produces `app/tokens.css`.
- **dataviz** handles chart marks, legends, the diverging palette and accessibility.
- **frontend-design** while building components, and **vercel:shadcn** for primitives.
- **taste-skill** (`design-taste-frontend`, `minimalist-ui`) is the anti-slop pre-flight before each UI merge.
- At **H24**, the **impeccable-finish-reviewer** agent produces an ordered fix list, and **impeccable-documenter** writes `docs/DESIGN.md`.
- **Figma** needs `/mcp` authorization; it's optional.

## Team roles

| Role | Mission | Judging score they carry |
|---|---|---|
| **Lead / integrator (you, coder)** | One working app on the production URL that can always be demoed; owns the look; unblocks everyone | Presentation, Relevance |
| **Coder B: data & stats engine** | Turns NASA data into region series and implements the Methods spec exactly | Validity |
| **Coder C: panel, charts & partner** | The 5-step case experience, the charts and the Claude partner | Impact, Creativity |
| **Methods & Validity lead (non-coder, statistician)** | Every number the app shows is correct, explained correctly and defensible in front of a judge. **Writes the stats spec that Coder B implements, supplies the reference answers for the tests, and signs off the engine.** | Validity |
| **Story & Submission lead (non-coder)** | Turns the work into the project page, slides, video and every word in the app; voice of the student user; makes sure we submit correctly | Presentation, Impact |

The two non-coders work as a **pair**. Methods supplies the content and checks its correctness; Story shapes it for the audience. Fixed pairing points: H2–H5 (in-app wording for statistical terms), H8 (demo cases → demo script), H13 (user test), **H18–H22 (pitch block, while the Lead and Coder C sleep)**, H26–H28 (rehearsal).

## Team rhythm

- **Stand-ups (5 min, walk through STATUS.md):** H2, H6, H10, H14 (before wave 1), H22 (after wave 2), H26 (freeze).
- **Sleep waves:**
  - **Wave 1, H14–H18:** Coder B + Methods + Story.
  - **Wave 2, H18–H22:** Lead + Coder C.

  Nobody sleeps through their own hand-off.
- **Milestones:**

  | Hour | Milestone |
  |---|---|
  | H2 | **M0:** scaffold + stub API + smoke deploy |
  | H8 | **M1:** real data + engine core + globe/panel on stubs |
  | H14 | **M2:** full case on the production URL |
  | H22–H26 | **M3/M4:** Should-features + polish; **freeze at H26** |
  | H29 | **M5:** submitted |

- **Cut order if behind:** scanner → mirror finder → partner tools (keep Explain) → correlation lag search.
- **How the non-coders use Claude:**
  - Claude Code desktop on the repo. Open with `/resume`, then: *"I'm the Methods lead; read docs/roles/methods-lead.md and help me with step N."*
  - Commit only inside your own folder (`docs/science/` or `docs/pitch/`).
  - End with `/handoff`.

## Role playbooks

These become `docs/roles/<role>.md` so each person's Claude chat loads only their own. Each step has a deliverable and a **Done when**.

### Lead / integrator (you)
- [ ] **H0–H0.5** Approve the plan; Claude writes and commits the docs scaffold; share the repo, `docs/TEAM.md` and your playbook link. Run a 15-min huddle: roles, personalization options, name vote at H2.
- [ ] **H0.5–H2** Scaffold Next.js (App Router, TS, Tailwind, shadcn) + FastAPI from Vercel's template, `vercel link`, push. Add `ANTHROPIC_API_KEY` via `vercel:env`; set the Anthropic spend cap. **Done when:** the production URL loads and the smoke checklist (nested route + query, numpy/scipy, data-file read, cold-start time) is recorded in STATUS.
- [ ] **H2–H6** Globe:
  - Client wrapper with `ssr:false`, self-hosted textures, countries TopoJSON.
  - Hover/click selection; US states when zoomed in; a search box fed by the stub `/regions`.
  - nuqs case state (`variable, regions[], start, end, season, level`).
- [ ] **H3–H4** Design direction session using the Story lead's brief: impeccable direction contract → ui-ux-pro-max fonts/palette → `tokens.css` → dataviz diverging palette. **Done when:** tokens are applied to the shell.
- [ ] **H6–H8** Panel/globe layout; merge Coder C's panel shell. **M1 done when:** clicking a region updates the URL and panel, and search works.
- [ ] **H8–H14** Trend-map colouring from `/trendmap` (stable data, colour accessor only); integrate the real API end to end; `code-review` before each merge; build ready for the H13 user test. **M2 done when:** Case #1 runs fully on production and the Playwright smoke passes.
- [ ] **H14–H18** Mirror highlight on the globe (arc + linked region), share-link button, predict-before-reveal (if chosen), tour engine wiring.
- [ ] **H18–H22** Sleep.
- [ ] **H22–H26** Merge M3; impeccable-finish-reviewer → fix list; taste-skill pass; performance-optimizer agent; Firewall rule; apply the Story lead's QA list. **Freeze at H26.**
- [ ] **H26–H29** Final deploy, keep-warm, Playwright screenshots for the Story lead, help record the video (`brag`), check the submission links.

### Coder B: data & stats engine
- [ ] **H0–H1** Worktree; Zarr spike in Colab (variables present, −999 fill, latest months). Post the variable list in STATUS for the Methods lead.
- [ ] **H1–H2** Stub FastAPI: every Pydantic model in its final schema, fixture JSON responses, `openapi.json` dump. **Done when:** the Lead and Coder C can build against it.
- [ ] **H2** 10-min review of `METHODS.md v1` with the Methods lead. The spec is the source of truth; ask, don't guess.
- [ ] **H2–H6** Pipeline: masks + extraction, demo variables first → commit the `.npz`. Engine core with TDD (series construction, OLS-AR(1), Hamed-Rao MK, Sen), **tested against the Methods lead's golden cases**.
- [ ] **H6** Ship `scripts/case_cli.py` (`--var --region --start --end --season` → result table) so the Methods lead can dry-run the cases.
- [ ] **H6–H8** Real `/analyze`, `/variables` and `/regions` (with the validity matrix). **M1 done when:** golden cases 1–3 pass.
- [ ] **H8–H14** `/trendmap`, `/correlate`, `/mirror`, years-until-significant; Cache-Control headers; fix what the Methods lead's review gate finds. Before sleeping, export the false-positive simulation as a CSV/PNG for the validity slide.
- [ ] **H14–H18** Sleep.
- [ ] **H18–H22** Scanner (BH-FDR); Pettitt (Could); edge cases (all-NaN, fewer than the minimum years → no verdict); keep-warm script; contract test.
- [ ] **H22–H29** Bug fixes only after H26; on call during submission.

### Coder C: panel, charts & partner
- [ ] **H0–H2** Worktree; load the `claude-api` skill; read the TS README, tool-use and streaming docs. Build the `<PlotFigure>` wrapper and panel component shells against the stub types.
- [ ] **H2–H8**
  - 5-step panel: variable picker with definition cards, period slider, season filter, region chips.
  - Main chart: raw/anomaly/yearly series, OLS band, Sen line.
  - Verdict card using the Methods lead's templates and wording from the Story lead's `COPY.md`.
  - Explain route streaming over SSE.
- [ ] **H8–H14** Wire to the real API; multi-region overlay; Student/Scientist toggle; number-check utility; correlation view skeleton.
- [ ] **H14–H18** Partner chat with tools + `propose_case`; finish the correlation view; years-until-significant meter UI; tour player (reads the tour JSON made from the Story lead's captions).
- [ ] **H18–H22** Sleep.
- [ ] **H22–H26** Pre-generate the 3 demo explanations; run the Methods lead's eval with the number check; Playwright E2E for the 3 cases; apply copy fixes. Freeze at H26.
- [ ] **H26–H29** P0 fixes only.

### Methods & Validity lead (statistician)
**Owns:** `docs/science/METHODS.md`, `golden_cases/`, `DEMO_CASES.md`, `VERDICT_TEMPLATES.md`, `PROCESS_CARDS.md`, `EVAL.md`, `LIMITATIONS.md`, `docs/DATA_CATALOG.md`, plus the content of the validity slides and the science section of the project page.

- [ ] **H0–H0.5** Earthdata Login account and Giovanni open; read `docs/context/` and `PROJECT.md`; set up Claude Code desktop on the repo.
- [ ] **H0.5–H2: `METHODS.md v1`, the spec Coder B implements.** Start from this plan's engine section and decide every open parameter:
  - Minimum series length for a verdict (e.g. 10 years).
  - Missing-data rule (e.g. a season counts only with ≥2 of 3 months present).
  - DJF wrap convention.
  - CI level.
  - Verdict tiers and cutoffs (the 0.20 boundary).
  - Primary test (MK) vs corroborating test (OLS-AR(1)) and what to show when they disagree.
  - Years-until-significant formula and when to hide it.
  - Correlation method (anomalies, detrending, Bretherton n_eff, lag range).
  - Mirror rule.
  - Scanner FDR level.
  - Reporting units (per decade, % of mean).

  *Ask Claude:* "Draft METHODS.md from the plan's engine section; list every parameter I must decide, with the textbook default and its trade-off." **Done when:** reviewed with Coder B at H2.
- [ ] **H1–H4: hero series.** In Giovanni, make an area-averaged monthly time series of MODIS Aqua AOD 550 nm (MYD08_M3, the combined Dark Target + Deep Blue product) over Wisconsin, 2002-07 → latest. Download the CSV and record the product, version and DOI. Do the same for any other candidate case that needs a satellite series. Hand the files to Coder B.
- [ ] **H2–H5: golden cases** (the answer key for Coder B's tests).
  - Six small CSVs, each with an `expected.json`. Compute the expected values independently: Excel LINEST, R, or a Colab notebook Claude writes with pymannkendall/scipy.
    1. Linear trend + white noise, with a known slope.
    2. Pure noise (no trend).
    3. AR(1) noise with φ=0.6 and no trend: naive MK says significant, Hamed-Rao should not.
    4. A step change (for Pettitt).
    5. A DJF season-wrap example with explicit dates.
    6. The Wisconsin JJA AOD series, with Giovanni's or your own reference numbers.

  **Done when:** they're in `docs/science/golden_cases/` and Coder B has copied them to `tests/fixtures/`.
- [ ] **H3–H6: `DATA_CATALOG.md`.** For each variable Coder B confirms:
  - A student definition (≤25 words) and a scientist definition.
  - Units, source/instrument, satellite vs reanalysis/model, resolution, period, DOI.
  - "What a trend here could mean", in one line.
  - Known caveats (e.g. reanalysis precipitation is model-based where there are few gauges).

  The Story lead edits the tone. Claude converts the result to `variables.json`.
- [ ] **H6–H8: demo-case dry-run.**
  - Run every candidate case plus backups with `case_cli.py`.
  - For each, record a result table (slope/decade, MK p, OLS p, verdict, years until significant) and check it against the literature with 1–2 citations (*Ask Claude with deep-research:* "Does published research agree that … over …?").
  - Decide keep or swap; final pick is 3 cases + 2 backups in `DEMO_CASES.md`.

  **Done when:** handed to the Story lead for the script and tour.
- [ ] **H8–H10: process cards** (8–12, each 80–120 words, student + scientist versions, 1–2 citations):
  - Wildfire smoke and AOD.
  - Arctic amplification.
  - Hadley-cell expansion and subtropical drying.
  - Sahel rainfall recovery.
  - Aral Sea and irrigation.
  - Urban NO₂ and emission controls.
  - Wet-gets-wetter.
  - Snow-albedo feedback.
  - Natural variability and El Niño (why short records aren't significant).

  Claude converts them to `process_cards.json`. These are the only physical explanations the partner may use.
- [ ] **H8–H11: `VERDICT_TEMPLATES.md`.**
  - Wording for each tier × reading level, with placeholders (`{slope} {unit}/decade`, `{p}`, `{years_needed}`).
  - Misconceptions to avoid: "not significant" ≠ "no change"; correlation ≠ causation; what a p-value is and isn't.
  - Write the **partner grounding rules** for Claude's system prompt with Coder C.
- [ ] **H11–H14: engine review gate.**
  - Run the golden cases against the deployed `/analyze` or `case_cli`.
  - Spot-check 10 trend-map regions for plausible sign and size (e.g. the Arctic warming much faster than the global land average).
  - Log issues in STATUS as blockers for Coder B.
  - Observe the H13 user test and adjust the templates where students misread verdicts.

  **Done when:** STATUS reads "Validity checkpoint passed".
- [ ] **H14–H18** Sleep.
- [ ] **H18–H22 (pitch block with the Story lead):**
  - `EVAL.md`: 20 partner questions, each with the expected answer and a "must not say" list (e.g. *"Is this smoke caused by climate change?"* → must hedge and cite the process card).
  - **Validity slides:** the false-positive simulation figure (Coder B's export), "why we test yearly values", "why two tests", the years-until-significant explainer.
  - `LIMITATIONS.md`: reanalysis vs observation, regional means hide spatial patterns, linear trends only, short records, multiple testing.
  - The science section of the project page.
  - The science half of the judges' Q&A.
- [ ] **H22–H24** Run the eval with Coder C (number check + manual review) → score + fix list. Approve the 3 pre-generated demo explanations for accuracy.
- [ ] **H24–H26** Final science QA on production: every number, unit and label in the 3 cases and the tour. Attribution list (POWER, MERRA-2, CERES, MODIS, Natural Earth) on the About page and the project page.
- [ ] **H26–H29** Rehearse the Q&A twice; present the science part; final read of the project page's science text.

### Story & Submission lead
**Owns:** `docs/pitch/SUBMISSION_CHECKLIST.md`, `BRAND_BRIEF.md`, `COPY.md` (every word in the app), `PROJECT_PAGE.md`, `DEMO_SCRIPT.md`, `USER_TEST.md`, `JUDGES_QA.md`, the slides, the video and the banner/thumbnail.

- [ ] **H0–H1: submission recon.** Find this event's Space Apps rules and form fields:
  - Deadline + time zone.
  - Title, summary, demo link, video/slide limits.
  - Public repo, AI-use disclosure, NASA data used, team members.
  - Whether the URL must stay live.

  Write `SUBMISSION_CHECKLIST.md` with an owner and due hour for each item. Put the deadline at the top of STATUS. **Done when:** the Lead has read it.
- [ ] **H1–H2: `BRAND_BRIEF.md`** (one page):
  - 3 name options (team vote at H2).
  - A one-line pitch.
  - Tone of voice (curious and precise, not cartoonish).
  - 3–5 visual references (e.g. NASA Eyes, Windy, Our World in Data) and mood words.

  *Ask Claude with ui-ux-pro-max:brand.* Join the Lead's H3–H4 design session and choose between the directions.
- [ ] **H2–H5: `COPY.md`, co-written with the Methods lead for correctness.** Coder C pulls all text from here:
  - The partner's onboarding questions.
  - The 5 step labels + helper text.
  - The variable-card template.
  - Verdict tier names and badges.
  - Tooltips (p-value, Sen's slope, anomaly, significance, reanalysis).
  - Empty and error states ("No mirror found", "Not enough years yet").
- [ ] **H4–H8: `PROJECT_PAGE.md` v1** in the submission's structure: problem, what it does, the 5 steps, NASA data used, statistics (from Methods), how we used AI (the Claude partner + AI-assisted development disclosure), impact for students and teachers, future work. The Methods lead reviews it.
- [ ] **H8–H10: `DEMO_SCRIPT.md`.** A 3-minute live-demo flow and a 30–60 s video storyboard built on the final cases. Write the tour captions (1–2 sentences per step) for the 3 cases; Claude converts them to tour JSON for Coder C.
- [ ] **H10–H12: slides v1** (ui-ux-pro-max:slides, or a Slides artifact/pptx):
  - Title.
  - Problem: the 5 steps + "the same process, opposite trends".
  - How it works.
  - Demo screenshots (placeholders for now).
  - Validity (from Methods).
  - Impact, team, future.

  Use the brand tokens.
- [ ] **H12–H14: user test.**
  - Recruit 2–3 outsiders at the venue, students if possible.
  - Three tasks: "Are Wisconsin summers getting smokier? Is it significant? What does 'Not proven yet' mean?"
  - Observe silently while the Methods lead watches the statistical misreadings.
  - Write `USER_TEST.md` with the top 5 fixes, each posted to STATUS with an owner.
- [ ] **H14–H18** Sleep.
- [ ] **H18–H22 (pitch block with the Methods lead):**
  - Slides v2 with real production screenshots.
  - `JUDGES_QA.md`: 20 likely questions with answers.
  - Project page v2.
  - Banner/thumbnail (ui-ux-pro-max:banner-design).
  - Final video storyboard.
- [ ] **H22–H24: copy & consistency QA** on production against `COPY.md` and the brief: typos, inconsistent terms, unclear labels. The list goes to the Lead and Coder C **before the H26 freeze**.
- [ ] **H24–H27: video.** Screen-record the storyboard (OBS) and/or have the Lead run `brag` to make the launch video; voiceover optional. Export within the rules' limits.
- [ ] **H26–H28** Rehearse the live pitch twice with the Methods lead.
- [ ] **H27–H29** Finalize the project page, upload the video and slides, fill in the form, tick every item on `SUBMISSION_CHECKLIST.md` with the Lead. **Submit by H29** and confirm receipt.

**Candidate demo cases** (the Methods lead confirms them at H8, each with a citation):
1. Wisconsin summer smoke (MODIS Aqua AOD, NASA's own example).
2. Arctic amplification (T2M).
3. Mirror pair: Sahel getting wetter vs. Mediterranean drying.
4. Aral basin soil wetness.
5. Metro-area air quality.

## Progress tracking (so any new Claude chat understands everything)

Lean on purpose, so the Lead isn't stuck maintaining docs. **Claude writes the scaffold**; the `/handoff` command keeps it current.

```
CLAUDE.md               mission, stack, repo map, commands, rules, gotchas, SESSION PROTOCOL, read-first list
docs/context/           original challenge docs (moved out of public/, "team of 6" fixed to 5)
docs/PROJECT.md         vision, direction, judging map, MoSCoW scope, glossary, decisions log
docs/ARCHITECTURE.md    endpoints, contract, data shapes, folder map, front-end/back-end gotchas
docs/STATUS.md          live board: workstream ✅/🟡/⛔, current hour, next up, blockers
docs/TEAM.md            roles, owners, who is on what now, sleep waves, pairing points
docs/roles/             lead.md, coder-b.md, coder-c.md, methods-lead.md, story-lead.md (the playbooks above, as checklists)
docs/science/           METHODS.md, golden_cases/, DEMO_CASES.md, VERDICT_TEMPLATES.md, PROCESS_CARDS.md, EVAL.md, LIMITATIONS.md
docs/pitch/             SUBMISSION_CHECKLIST.md, BRAND_BRIEF.md, COPY.md, PROJECT_PAGE.md, DEMO_SCRIPT.md, USER_TEST.md, JUDGES_QA.md
docs/DATA_CATALOG.md    variables, source/instrument, satellite vs reanalysis, units, resolution, definition, DOI
docs/handoffs/          YYYY-MM-DD-HHMM-<who>-<topic>.md (short, written by /handoff)
docs/superpowers/specs/2026-11-14-earth-case-files-design.md
docs/superpowers/plans/ data-engine.md, frontend.md, partner.md
.claude/commands/resume.md   /resume: read STATUS, PROJECT, ARCHITECTURE, latest 3 handoffs → summarize + next step
.claude/commands/handoff.md  /handoff: update STATUS.md, write handoff, commit docs only
```

- **Session protocol** (lives in CLAUDE.md, written with `mattpocock:writing-for-agents`):
  - Start every chat with `/resume`; end every chat with `/handoff`.
  - Each coder's chat runs **its own** workstream plan.
- `docs/DESIGN.md` is added at H24 (impeccable-documenter). `graphify` gets one run at M2, optionally.
- **Git:**
  - Each coder works on feature branches in their own worktree.
  - Small PRs, with bodies written via `mattpocock:pr`.
  - `code-review` runs before merge; Vercel builds a preview per PR; the Lead merges to `main`.

## Plugin usage map

- **superpowers:** brainstorming (done) → writing-plans (next) → executing-plans/subagent-driven-development, TDD, systematic-debugging, verification-before-completion, code review, git worktrees, finishing-a-development-branch.
- **mattpocock-skills:** writing-for-agents (CLAUDE.md, handoffs), grilling (optional 15-min team stress test of this plan), tdd, prototype (globe spike), pr, code-review, diagnosing-bugs.
- **Design:** impeccable, ui-ux-pro-max, taste-skill, frontend-design, dataviz (as above).
- **vercel:** nextjs, vercel-functions, deploy, env, cdn-caching, shadcn, react-best-practices, vercel-firewall, the performance-optimizer and deployment-expert agents; the MCP server for runtime errors and logs.
- **playwright:** E2E on the demo cases. Launch with the swiftshader WebGL flags so the globe renders headless; also used for slide screenshots.
- **claude-api:** all Claude code. **brag:** the launch video. **graphify:** optional at M2.
- **Not used:** supabase (URL state removes the need for a DB), figma (unless authorized), cowork-plugin-management.

## Open for the team to personalize (H0–H1 huddle)

- Name and partner persona.
- A local "home" case: admin-1 regions for your country, about 10 minutes in the pipeline.
- A signature moment. Options:
  - Predict-before-reveal.
  - "Time machine" scrubber across years.
  - Sonification of the series.
  - Classroom challenge codes.

## Risks and fallbacks

- **POWER paths or variables differ, or downloads are slow** → H1 spike; run in Colab or Codespace; fall back to REST for the demo regions.
- **Python bundle or cold start** → keep to numpy + scipy.special + fastapi; lazy loads; keep-warm. Plan B is FastAPI on Render/Fly.
- **Globe performance or picking small regions** → simplified TopoJSON, one layer per zoom level, search box.
- **A demo case doesn't hold up** → the H8 dry-run swaps it for a backup.
- **Claude slow or down** → template verdict plus pre-generated demo explanations.
- **Running out of time** → cut order above; the H26 freeze is non-negotiable.
- **Key leak or cost spike** → server-only env, Firewall rule, spend cap, `max_tokens` caps, caching.

## Verification

- **`pytest`:** the engine tests listed above, plus a contract test that every endpoint response validates against its Pydantic model.
- **Types and build:** `npm run gen:types && npm run build` with no type errors (this also catches nuqs prerender and Suspense issues).
- **Playwright** (swiftshader, protection bypass) against the preview. Each demo case runs end to end, the trend map renders, the share link reproduces the same case, and the tour plays. Screenshots are saved.
- **Accuracy eval:** the number-check harness plus the Methods lead's 20-question accuracy eval (`docs/science/EVAL.md`) and the golden-case review gate at H11–H14.
- **After the production deploy:** Vercel MCP `get_runtime_errors` and logs are clean, and the performance-optimizer pass is done.
- `superpowers:verification-before-completion` runs before each milestone is called done; the impeccable finish review runs at M4.

## Immediate next steps after approval

1. **Claude (this session):**
   - Move `public/docs/*` → `docs/context/` and fix team size → 5.
   - Write CLAUDE.md, the lean docs set, **the five role playbooks in `docs/roles/`**, empty starter files with headings in `docs/science/` and `docs/pitch/` (so the non-coders start from a structure, not a blank page), `/resume` + `/handoff`, and the design spec under `docs/superpowers/specs/`.
   - Commit.
2. **Claude:** invoke `superpowers:writing-plans` for 3 workstream plans (data-engine, frontend, partner), each runnable from its coder's own chat.
3. **Team, in parallel:**
   - The Lead links GitHub to Vercel, adds `ANTHROPIC_API_KEY` and sets the spend cap.
   - Coder B starts the Zarr spike in Colab.
   - The non-coders create Earthdata accounts, check the submission rules and start the brand/design direction and the demo-case research.
