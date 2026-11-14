# Frontend Shell, Globe & Infra Implementation Plan (Eleder, Claude Code)

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:executing-plans (or superpowers:subagent-driven-development for Tasks 4–6). Steps use checkbox (`- [ ]`) syntax. **Edit only files in Eleder's area** (`docs/process/OWNERSHIP.md`); the two exceptions are the one-time stubs handed over in Task 1. Merge as described in `docs/process/MERGING.md`.

**Goal:** the repo scaffold, CI and Vercel deploy; the frozen seams the other coders build on; the app shell; the 3D globe with selection, search, trend colouring, mirror arcs and tour fly-to; the design system; and the final polish and launch.

**Architecture:**
- **One Next.js App Router app.** `app/page.tsx` composes `AppShell` → `RegionSearch` + `Globe` (yours) and `<CasePanel />` (Ekaitz's).
- **Case state** lives only in the URL (nuqs, `lib/state/use-case.ts`).
- **Cross-component UI state** (hover, highlight, focus, predict/reveal) lives in a zustand store (`lib/state/ui-store.ts`).
- **The Python API** is reached through openapi-fetch typed by Oier's generated `lib/api-types.ts`.

**Tech stack:**
- Next.js (latest, App Router, TS), React 19, Tailwind v4, shadcn/ui.
- `react-globe.gl` + `three`, nuqs v2, zustand, openapi-fetch.
- vitest, Playwright, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-11-14-earth-case-files-design.md`. Also read `docs/process/OWNERSHIP.md` and `docs/process/MERGING.md`.

## Global constraints

- **Seam names** (Ekaitz's plan and Oier's plan use these exact names; changing one after H2 is a breaking seam change):
  - `CaseState{variable, regions, from, to, season, months, level}`
  - `useCase(): {state, setCase, replaceCase}`
  - `useUiStore` fields: `hoveredRegion`, `setHoveredRegion`, `highlight{kind, regions, arcFrom}`, `setHighlight`, `clearHighlight`, `focus`, `flyTo`, `predictMode`, `setPredictMode`, `reveal`, `setReveal`
  - `api`, `serverApi(origin, headers?)`
  - `lib/api/types.ts` aliases
- **URL keys:** `v`, `r` (comma list), `from`, `to`, `s` (`ANN|DJF|MAM|JJA|SON|CUSTOM`), `m` (comma list, only when `s=CUSTOM`), `lvl` (`student|scientist`).
- **Defaults:** `DEFAULT_CASE = {variable:"T2M", regions:[], from:1981, to:2025, season:"ANN", months:null, level:"student"}`. `MAX_REGIONS = 4`.
- **Dev rewrite:** `/api/py/:path*` → `http://127.0.0.1:8000/api/py/:path*` (**127.0.0.1, not localhost**). In production it goes to `/api/`.
- **Python bundle:** `vercel.json` includes `api/_data/**` and excludes `.next`, `node_modules`, `public`, `pipeline`, `tests`, `docs`, `e2e` from the Python function.
- **Colours** are CSS variables in `app/tokens.css`: `--bg`, `--surface`, `--surface-2`, `--text`, `--muted`, `--border`, `--accent`, `--series-1..4`, `--trend-up-3..1`, `--trend-neutral`, `--trend-down-1..3`, `--font-sans`, `--font-mono`. Ekaitz's charts read these names.
- **Globe:** `react-globe.gl` is imported only through `next/dynamic` with `{ ssr: false }` inside a `'use client'` file. `polygonsData` stays referentially stable (memoised per layer); only the accessors change. Textures are self-hosted in `public/textures/`.
- **Region ids and geometry** come from Oier (`public/geo/*.geojson`, `properties {id, name, type}`). Never hand-edit them.

## Review focus

1. **A 5th region clicked on the globe** → it isn't added, and a toast shows `globeCopy.maxRegions`. *(Task 2 codec test + Task 4 manual check)*
2. **A hand-edited share URL** (`r=usa,,US-WI,US-WI`, `from>to`, unknown `s`) → it normalises to a valid case (deduped, sorted, swapped years, `ANN`) and never crashes. *(Task 2 tests)*
3. **The trend map for a variable missing in many regions** (land-only over the oceans) → those polygons render neutral with a "no data" tooltip, not as zero-trend colours. *(Task 5 test `colorFor no-data`)*
4. **WebGL unavailable or slow** (old laptop, headless CI) → the panel still works and the globe area shows a static fallback message; Playwright runs with the swiftshader flags. *(Task 4 + Task 7)*
5. **Python cold start on the first judge click** → `scripts/warm.sh` runs before judging, and the globe shows a skeleton while `/trendmap` loads. *(Task 8)*

---

### Task 1: Scaffold, deps, CI, deploy (H0.5–H1.5, merged before anyone branches)

**Files:**
- Create:
  - Next.js app files: `package.json`, lockfile, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
  - shadcn: `components.json`, `components/ui/*`, `lib/utils.ts`
  - Deploy and env: `vercel.json`, `.env.example`
  - Tests: `vitest.config.ts`, `playwright.config.ts`
  - CI and process: `.github/workflows/ci.yml`, `.github/pull_request_template.md`, `scripts/check-ownership.mjs`
  - **One-time handover stubs:** `api/index.py` and `requirements.txt` (→ Oier), `components/panel/CasePanel.tsx` and `app/api/partner/route.ts` (→ Ekaitz)
- Modify: `.gitignore` (merge in the Next.js entries)

- [ ] **Step 1: Scaffold.** The repo isn't empty, so scaffold in a temp folder and copy:
  - `npx create-next-app@latest ../_scaffold --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm`
  - Copy everything except `.git`, `README.md` and `.gitignore` into the repo. Merge the `.gitignore` lines by hand.
- [ ] **Step 2: Install every known dependency now**, so nobody touches `package.json` later:
  - Runtime: `npm i react-globe.gl three @observablehq/plot nuqs zustand zod @anthropic-ai/sdk openapi-fetch sonner`
  - Dev: `npm i -D openapi-typescript vitest jsdom @testing-library/react @types/three tsx concurrently @playwright/test minimatch`
  - Check that `@anthropic-ai/sdk` is ≥ 0.136.0 (`npm ls @anthropic-ai/sdk`).
- [ ] **Step 3: shadcn.**
  - `npx shadcn@latest init`
  - `npx shadcn@latest add button card tabs slider select toggle-group tooltip dialog command popover badge scroll-area sheet skeleton separator input textarea switch label hover-card alert sonner`
- [ ] **Step 4: `package.json` scripts.**

  | Script | Command |
  |---|---|
  | `dev` | `concurrently -n web,api "next dev" "python -m uvicorn api.index:app --reload --host 127.0.0.1 --port 8000"` |
  | `typecheck` | `tsc --noEmit` |
  | `check` | `npm run typecheck && npm run lint && next build` |
  | `test` | `vitest run` |
  | `test:e2e` | `playwright test` |
  | `gen:types` | `python scripts/gen_openapi.py && openapi-typescript api/openapi.json -o lib/api-types.ts` |

- [ ] **Step 5: Config and stubs.**
  - `next.config.ts` rewrites (see Global constraints).
  - `vercel.json` `functions["api/index.py"]` with `includeFiles` and `excludeFiles` as constrained.
  - Stub `api/index.py`: `FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")` with `GET /api/py/health` returning numpy/scipy versions.
  - `requirements.txt`: `fastapi`, `pydantic>=2.7`, `numpy>=2.0`, `scipy>=1.13`.
  - Stub `CasePanel` (renders "Case panel"), and a stub `app/api/partner/route.ts` (POST → 501 JSON, `maxDuration = 60`, no `runtime` export, since cacheComponents rejects it).
  - `vitest.config.ts`: `environment: "node"`, alias `@` → root. Hook tests opt in with `// @vitest-environment jsdom`.
  - `playwright.config.ts`:
    - `baseURL: process.env.BASE_URL ?? "http://localhost:3000"`;
    - `use.launchOptions.args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--use-gl=swiftshader"]`;
    - `extraHTTPHeaders` with `x-vercel-protection-bypass` when `VERCEL_AUTOMATION_BYPASS_SECRET` is set.
- [ ] **Step 6: CI, PR template and ownership check.**
  - **`.github/workflows/ci.yml`:** two jobs on `pull_request` + push to `main`.
    - `web`: Node 22, `npm ci`, `npm run check`, `npm test`.
    - `api`: Python 3.12, `pip install -r requirements-dev.txt || pip install -r requirements.txt pytest`, `python -m pytest -q || [ $? -eq 5 ]` (exit code 5 = no tests yet).
  - **`scripts/check-ownership.mjs`:**
    - Parse the three fenced blocks under **Eleder / Oier / Ekaitz** in `docs/process/OWNERSHIP.md` (first token of each line = glob).
    - Map the branch prefix (`GITHUB_HEAD_REF`) to its owner, and list the files from `git diff --name-only origin/main...HEAD` that match none of that owner's globs (`minimatch`).
    - Print a warning and always exit 0. Add it as a step in the `web` job.
  - **PR template:** area touched, seam change (none / additive / breaking), checks run, preview URL checked.
- [ ] **Step 7: Deploy.**
  - `vercel link`, then add `ANTHROPIC_API_KEY` (Production + Preview) with the `vercel:env` skill.
  - Enable **Protection Bypass for Automation** in the project settings (this provides `VERCEL_AUTOMATION_BYPASS_SECRET`).
  - Set a spend cap in the Anthropic Console.
  - Push to `main`.
- [ ] **Step 8: Smoke-test production** and tick the smoke checklist in STATUS:
  - `/` loads;
  - `/api/py/health?x=1` returns versions (nested route + query);
  - `/api/partner` returns 501 JSON (proves Next's `app/api` and the Python `api/` coexist);
  - record the cold-start time.
  
  Commit `chore: scaffold, deps, CI, deploy` straight to `main`, then post "scaffold merged; branch from main now" in STATUS. **Done when** Oier and Ekaitz have both branched from it.

### Task 2: Seams: case codec, URL hook, UI store, API client (TDD; merged at the H2 checkpoint, after Oier's contract)

**Files:**
- Create: `lib/state/case-codec.ts`, `lib/state/case-codec.test.ts`, `lib/state/use-case.ts`, `lib/state/ui-store.ts`, `lib/state/ui-store.test.ts`, `lib/api/client.ts`, `lib/api/types.ts`
- Modify: `app/layout.tsx` (wrap the children in `<NuqsAdapter>` from `nuqs/adapters/next/app`)

**Interfaces (produces; this is the seam):**
- `case-codec.ts` (pure, safe to import server-side):
  - Types: `type Season = "ANN"|"DJF"|"MAM"|"JJA"|"SON"|"CUSTOM"`, `type ReadingLevel = "student"|"scientist"`, `interface CaseState { variable: string; regions: string[]; from: number; to: number; season: Season; months: number[]|null; level: ReadingLevel }`
  - Constants: `SEASONS`, `DEFAULT_CASE`, `MAX_REGIONS`
  - `normalizeCase(c: Partial<CaseState>): CaseState`:
    - trims the regions, dedupes them, sorts them by code unit and caps them at 4;
    - swaps `from` and `to` if reversed;
    - falls back to `ANN` for an unknown season;
    - sets `months = null` unless `CUSTOM`, in which case it keeps the cyclic order starting from the first month and requires contiguity, else falls back to `ANN`.
  - `caseToQuery(c): string`: keys in the order `v, r, from, to, s, m, lvl`.
  - `caseFromQuery(q: string|URLSearchParams): CaseState` (via `normalizeCase`)
  - `caseKey(c): string`: `caseToQuery` without `lvl`.
- `use-case.ts` (`'use client'`):
  - `useCase(): { state: CaseState; setCase(patch: Partial<CaseState>): void; replaceCase(next: CaseState): void }`
  - Built on `useQueryStates` with `parseAsString`, `parseAsArrayOf(parseAsString, ",")`, `parseAsInteger`, `parseAsStringLiteral(SEASONS)` and `parseAsArrayOf(parseAsInteger, ",")`, plus `{ history: "replace" }`.
  - Every write goes through `normalizeCase`.
- `ui-store.ts`: `useUiStore = create<UiState>()(...)` with:
  - `hoveredRegion: string|null`, `setHoveredRegion`
  - `highlight: { kind: "mirror"|"tour"|null; regions: string[]; arcFrom: string|null }`, `setHighlight`, `clearHighlight`
  - `focus: { lat: number; lng: number; altitude: number }|null`, `flyTo`
  - `predictMode: boolean`, `setPredictMode`, `reveal: boolean` (initially `true`), `setReveal`
- `client.ts`:
  - `export const api = createClient<paths>({ baseUrl: "" })`
  - `export function serverApi(origin: string, headers: Record<string,string> = {})` returns `createClient<paths>({ baseUrl: origin, headers })`
- `types.ts`: `export type X = components["schemas"]["X"]` for every model in Oier's contract (`Variable`, `Region`, `CaseRequest`, `AnalyzeResponse`, `RegionAnalysis`, `TrendStats`, `Verdict`, `FitPoint`, `TrendMapResponse`, `TrendMapEntry`, `CorrelateResponse`, `MirrorResponse`, `ScanResponse`).

- [ ] **Step 1: Write the codec tests.** In `case-codec.test.ts`:
  - `roundtrip` (`caseFromQuery(caseToQuery(c))` deep-equals `normalizeCase(c)`);
  - `dedupes, sorts, caps regions` (`["US-WI","USA","US-WI","ESP","FRA","DEU"]` → `["DEU","ESP","FRA","US-WI"]`);
  - `swaps reversed years`;
  - `unknown season → ANN`;
  - `months only for CUSTOM`;
  - `non-contiguous custom → ANN`;
  - `caseKey ignores level`.

  Run `npx vitest run lib/state` → FAIL.
- [ ] **Step 2: Implement `case-codec.ts`.** Run → PASS.
- [ ] **Step 3: Write the store test.** `ui-store.test.ts`: `clearHighlight resets kind and regions`; `setPredictMode(true) leaves reveal unchanged` (Ekaitz's panel sets `reveal` itself). Implement `ui-store.ts` and `use-case.ts`. Run → PASS.
- [ ] **Step 4: Rebase on Oier's contract merge** (`lib/api-types.ts` now exists), then write `client.ts` and `types.ts`. Run `npm run check` → PASS.
- [ ] **Step 5: Merge at H2** (after Oier, before Ekaitz). Commit `feat(state): case codec, url hook, ui store, api client`, self-merge, and post "seams frozen" in STATUS.

### Task 3: Design direction + tokens + shell (H2–H4)

**Files:**
- Create: `app/tokens.css`, `components/shell/AppShell.tsx`, `components/shell/Header.tsx`, `components/shell/ShareButton.tsx`, `lib/copy/globe.ts`
- Modify: `app/globals.css` (import the tokens; map them in Tailwind v4 `@theme inline`), `app/layout.tsx` (fonts via `next/font`), `app/page.tsx`

**Interfaces:**
- `AppShell({ panel: ReactNode; globe: ReactNode })`:
  - a CSS grid with a 440 px panel column on the left and the globe filling the rest;
  - below 900 px, the panel stacks under the globe;
  - the header shows the app name (from `docs/pitch/BRAND_BRIEF.md`), an About link and `ShareButton` (copies `window.location.href`, then a sonner toast).
- `app/page.tsx` renders `<AppShell panel={<Suspense><CasePanel/></Suspense>} globe={<Suspense><GlobeArea/></Suspense>} />`. Both children read nuqs state, so both need `Suspense`, or `next build` fails at prerender.

- [ ] **Step 1: Direction session (H3–H4)** with Edur's `BRAND_BRIEF.md`:
  - run the `impeccable` skill for the direction contract (brief: "scientific instrument at night");
  - `ui-ux-pro-max` design-system for the font pairing and palette;
  - the `dataviz` skill for a colourblind-safe diverging trend ramp (3 up, neutral, 3 down) and 4 series colours, checked with its validator.

  Edur picks between the options. Record the choice in PROJECT's Decisions log.
- [ ] **Step 2: Implement** `tokens.css` with every variable named in Global constraints (dark theme first), the Tailwind mapping, the fonts and the shell. Run the `taste-skill` pre-flight on the shell.
- [ ] **Step 3: Verify.** `npm run check` passes, and the shell looks intentional, not like default shadcn. Commit `feat(shell): tokens + app shell`, then self-merge.

### Task 4: Globe: render, layers, select, hover, search (H4–H8)

**Files:**
- Create:
  - Globe: `components/globe/Globe.tsx` (`'use client'`, dynamic wrapper), `components/globe/GlobeView.tsx`, `components/globe/useGeo.ts`, `components/globe/layers.ts`, `components/globe/layers.test.ts`
  - Globe area: `components/globe/RegionSearch.tsx`, `components/globe/GlobeArea.tsx`
  - Textures: `public/textures/earth-night.jpg`, `public/textures/earth-topology.png` (downloaded once from the `three-globe` example images)

**Interfaces:**
- `useGeo(): { countries: Feature[]; states: Feature[]; oceans: Feature[]; named: Feature[]; ready: boolean }` fetches `/geo/*.geojson` once.
- `layers.ts`:
  - `visibleFeatures(geo, altitude: number): Feature[]`: if `altitude > 1.4`, countries + oceans; otherwise countries without `USA` + states + oceans. The result is memoised per layer key, so the same array is returned for the same key.
  - `isSelected(id, state)`
- `GlobeView`:
  - **Props:** `polygonsData = visibleFeatures(...)`, `polygonCapColor` (accessor; Task 5), `polygonAltitude` (0.02 if selected or highlighted, else 0.006), `polygonStrokeColor`, `polygonLabel` (name + the trend value from Task 5).
  - **Handlers:** `onPolygonClick` toggles the region via `setCase({regions})` and toasts `globeCopy.maxRegions` at 4. `onPolygonHover` → `setHoveredRegion`. `onZoom` → altitude state for the layers.
  - **Behaviour:** auto-rotates while `regions.length === 0`.
  - **WebGL fallback:** if WebGL isn't available, render `globeCopy.noWebgl` instead of the globe.
- `RegionSearch`: a shadcn `Command` in a popover at the top-left of the globe area, searching every `/api/py/regions` entry (named regions and `NR-GLOBE` included). Selecting one adds it via `setCase` and calls `flyTo(centroid)`.

- [ ] **Step 1: Write the layer tests.** In `layers.test.ts`:
  - `zoomed out shows countries not states`;
  - `zoomed in swaps USA for states`;
  - `same key returns same array reference`.

  Run → FAIL. Implement `layers.ts`. Run → PASS.
- [ ] **Step 2: Implement** `Globe`, `GlobeView`, `useGeo`, `RegionSearch` and `GlobeArea`.
- [ ] **Step 3: Verify (M1, H8).**
  - Clicking France adds `FRA` to the URL; zooming into the US shows the states and clicking Wisconsin adds `US-WI`.
  - Searching "Sahel" adds `NR-SAHEL`.
  - A 5th click toasts.
  - Reloading restores the selection.
  
  Run `npm run check`. Commit `feat(globe): render, layers, select, search`, then self-merge at the **H8 checkpoint** (merge order: Oier → you → Ekaitz).

### Task 5: Trend map colouring + legend (H8–H12)

**Files:**
- Create: `components/globe/useTrendMap.ts`, `components/globe/palette.ts`, `components/globe/palette.test.ts`, `components/globe/Legend.tsx`
- Modify: `components/globe/GlobeView.tsx`

**Interfaces:**
- `useTrendMap(state): { entries: Record<string, TrendMapEntry>|null; loading: boolean }` calls `api.GET("/api/py/trendmap", { params: { query: {variable, start: from, end: to, season, months} } })`.
- `palette.ts`:
  - `domainFor(entries): number` = the 95th percentile of `|slope_per_decade|` (minimum 1e-6).
  - `colorFor(entry: TrendMapEntry|undefined, domain, upIsWet: boolean, hidden: boolean): string` returns a CSS variable reference:
    - `hidden` (predict mode before reveal) or no entry → `var(--trend-neutral)`;
    - otherwise the bin is `|slope|/domain` clipped to 1 and split into 3 steps, and the sign picks the up or down ramp (swapped for `upIsWet` variables);
    - `q >= 0.05` → the colour mixed 60% toward neutral (`color-mix`).
  - `UP_IS_WET = new Set(["PRECTOTCORR","GWETROOT","GWETTOP","RH2M","QV2M"])`
- `Legend`: a gradient with `±domain` labels (unit/decade), the line "Solid = significant (FDR q < 0.05)", and a "no data" swatch.

- [ ] **Step 1: Write the palette tests.** In `palette.test.ts`:
  - `colorFor no-data` (undefined → `var(--trend-neutral)`);
  - `hidden overrides`;
  - `wet variables flip the ramp`;
  - `non-significant is muted` (the string contains `color-mix`);
  - `domain ignores outliers`.

  Run → FAIL. Implement. Run → PASS.
- [ ] **Step 2: Wire it into `GlobeView`.** The `polygonCapColor` accessor reads a `Map` built from `entries`; the hidden flag is `predictMode && !reveal`. Show the skeleton overlay while loading. The label shows the formatted slope/decade.
- [ ] **Step 3: Verify (M2, H14).**
  - `T2M` 1981–2025 ANN makes the Arctic deep warm; a land-only variable leaves the oceans neutral.
  - Playwright smoke for Case #1 on production (Task 7 test) passes.
  - Commit `feat(globe): trend map + legend`, then self-merge at the **H14 checkpoint**.

### Task 6: Mirror arcs, tour fly-to, predict hide (H14–H18)

**Files:**
- Modify: `components/globe/GlobeView.tsx`
- Create: `components/globe/useRegionIndex.ts` (id → `{centroid, name}` from `/regions`)

**Interfaces:**
- `highlight.kind === "mirror"` → `arcsData` from the `arcFrom` centroid to each highlighted region's centroid (`arcColor` `var(--accent)`, dashed and animated), with those regions outlined.
- `highlight.kind === "tour"` → highlighted regions outlined only.
- `focus` changes → `globeRef.current.pointOfView(focus, 1200)`.
- Predict mode hides the trend colours (already in Task 5).

- [ ] **Step 1: Implement**, then verify manually with Ekaitz's `MirrorList` (Sahel ↔ Mediterranean) and the tour player once they're on `main`. Before your H18 sleep, have Playwright save screenshots of the 3 demo cases to `docs/pitch/screenshots/` for Edur.
- [ ] **Step 2: Commit and merge.** `feat(globe): mirror arcs, focus, highlight`, then self-merge before sleeping. **Nobody sleeps with an unmerged branch.**

### Task 7: E2E infra + globe/smoke specs (H12–H14, extended at H22)

**Files:**
- Create: `e2e/fixtures/case.ts` (helper `openCase(page, query)`), `e2e/globe.spec.ts`, `e2e/smoke.spec.ts`

- [ ] **Step 1: Write the specs.**
  - `smoke.spec.ts`: `home loads and api answers` (`/` shows the header and `/api/py/health` returns ok).
  - `globe.spec.ts`:
    - `search adds region to url` (search "Wisconsin" → the URL contains `US-WI`);
    - `share link restores case` (open `?v=T2M&r=US-WI&from=1981&to=2024&s=JJA`, reload → the same chips in the panel);
    - `fifth region is refused`.
- [ ] **Step 2: Run.** `npm run test:e2e` → PASS locally, then against the preview with `BASE_URL=<preview>` (the bypass header is set from the env). Commit `test(e2e): smoke + globe`, then self-merge.

### Task 8: Polish, About page, launch (H22–H29)

**Files:**
- Create: `app/about/page.tsx` (text from `docs/pitch/COPY.md` → About, plus the attribution list from `docs/DATA_CATALOG.md`)
- Modify: your own files, as the review lists require.

- [ ] **Step 1: Finish review.** Dispatch the `impeccable:impeccable-finish-reviewer` agent on production and fix its ordered list. Then run a `taste-skill` pass and the `vercel:performance-optimizer` agent (bundle, fonts, textures).
- [ ] **Step 2: Copy QA.** Apply Edur's copy & consistency QA list for your files. Forward the rest to Ekaitz and Oier via STATUS.
- [ ] **Step 3: Rate limit.** Add a Vercel Firewall rate-limit rule on `/api/partner` (e.g. 20 requests/min per IP) with the `vercel:vercel-firewall` skill, and verify that a burst gets a 429.
- [ ] **Step 4: Freeze (H26).** Run full E2E on production (yours + Ekaitz's specs). Dispatch `impeccable:impeccable-documenter` → `docs/DESIGN.md`. **From here on, merge only reviewed P0 fixes.**
- [ ] **Step 5: Launch (H26–H29).**
  - Run `scripts/warm.sh <prod-url>` (Oier's) right before judging.
  - Take fresh Playwright screenshots for Edur.
  - Make the launch video with the `brag` skill, with Edur.
  - Tick `docs/pitch/SUBMISSION_CHECKLIST.md` with Edur, then submit by H29.

## Done when (whole plan)

- Production serves the shell, globe, trend map and every seam, with Ekaitz's panel mounted.
- CI is green on `main`.
- E2E is green on production.
- The submission is confirmed.
