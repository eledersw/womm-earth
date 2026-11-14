# Case Panel, Charts & Claude Partner Implementation Plan (Ekaitz, Codex)

> **For agentic workers:** work this plan one task at a time and tick each checkbox as you go. Codex: follow the steps. Claude Code: use superpowers:executing-plans. **Edit only files in Ekaitz's area** (`docs/process/OWNERSHIP.md`). Merge as described in `docs/process/MERGING.md`. The SDK snippets below were verified against the current Anthropic TypeScript SDK docs. Use them as written, and don't substitute patterns remembered from older SDK versions.

**Goal:** build the 5-step case panel (Lead → Scene → Timeline → Evidence → Verdict), its charts, the correlation, mirror, years-meter and predict features, the guided tours, and the Claude partner (Explain + Chat with tools) behind `POST /api/partner`.

**Architecture:**
- **Panel:** `<CasePanel />` is a self-contained client component mounted by Eleder's page. It reads and writes the case only through `useCase()` and talks to the globe only through `useUiStore`.
- **Data:** it calls the Python API through the typed `api` client.
- **Partner:** a Node route that streams our own SSE events to the browser. Claude reaches our data only through tools that call `/api/py/*`.

**Tech stack:**
- Next.js App Router (TS), React client components.
- shadcn primitives from `components/ui/`, Tailwind with Eleder's tokens.
- Observable Plot for charts.
- `@anthropic-ai/sdk` (installed: 1.8.0) + `zod` (installed: 4.x) for the partner.
- vitest for unit tests, Playwright for E2E.

**Spec:** `docs/superpowers/specs/2026-11-14-earth-case-files-design.md`. Source docs to convert: `docs/pitch/COPY.md`, `docs/science/VERDICT_TEMPLATES.md`, `docs/science/PROCESS_CARDS.md`, `docs/pitch/DEMO_SCRIPT.md`.

## Global constraints

- **Model and fallback:** model id `claude-opus-5-5`, exactly. Every request uses the beta endpoint with `betas: ["server-side-fallback-2026-07-01"]` and `fallbacks: "default"`, which reroutes a refused request automatically.
- **Thinking:** don't send a `thinking` parameter (Opus 5.5 is adaptive by default, and `disabled` returns a 400). Control depth with `output_config.effort`: `"low"` for Explain, `"medium"` for Chat.
- **Key:** read only server-side, from `process.env.ANTHROPIC_API_KEY`, via `new Anthropic()`. Never ship a `NEXT_PUBLIC_` key.
- **Route:** `app/api/partner/route.ts` exports `maxDuration = 60` and **no `runtime`**: `cacheComponents` is on, and Next 16.4 rejects any `runtime` export (Node.js is already the default; see `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/runtime.md`). This is Next 16, so check the bundled docs in `node_modules/next/dist/docs/` before relying on older Next.js knowledge.
- **Prompt caching:** the system prompt is one frozen string (no dates, ids or reading level inside it), sent as a text block with `cache_control: { type: "ephemeral" }`. The reading level and case context go in the user message.
- **Tool results sent to Claude** never include the `monthly` or `fit` arrays. Use `summarizeAnalysis()` (Task 5) to keep tokens small.
- **Text:** all UI text comes from `lib/copy/case.ts`, `partner.ts` and `tour.ts`, which follow `docs/pitch/COPY.md`. Verdict tier labels are exactly **Confirmed / Not proven yet / No case / Too short to judge**.
- **Charts:** colours come from CSS variables in `app/tokens.css`, read with `getComputedStyle`. No hard-coded hex.
- **Seams you consume** (Eleder publishes them at H2; never edit them):
  - `lib/state/case-codec.ts`:
    - types `CaseState{variable, regions, from, to, season, months, level}`, `Season`, `ReadingLevel`;
    - constants `DEFAULT_CASE`, `MAX_REGIONS = 4`;
    - functions `normalizeCase(c)`, `caseToQuery(c): string`, `caseFromQuery(q): CaseState`, and `caseKey(c): string` (canonical, without `level`).
  - `lib/state/use-case.ts`: `useCase(): { state: CaseState; setCase(patch: Partial<CaseState>): void; replaceCase(next: CaseState): void }`
  - `lib/state/ui-store.ts`: `useUiStore` with:
    - `hoveredRegion`, `setHoveredRegion(id|null)`;
    - `highlight{kind: "mirror"|"tour"|null, regions: string[], arcFrom: string|null}`, `setHighlight(h)`, `clearHighlight()`;
    - `focus{lat,lng,altitude}|null`, `flyTo(f)`;
    - `predictMode`, `setPredictMode(b)`, `reveal`, `setReveal(b)`.
  - `lib/api/client.ts`: `api` (openapi-fetch, browser) and `serverApi(origin: string, headers?: Record<string,string>)`.
  - `lib/api/types.ts`: named aliases (`AnalyzeResponse`, `RegionAnalysis`, `Region`, `Variable`, `CorrelateResponse`, `MirrorResponse`, …).

## Review focus

1. **The user changes the case quickly** (slider drags, fast clicks) → only the latest `/analyze` result renders, older requests are aborted, and nothing flickers through stale verdicts. *(Task 2 test `useAnalysis aborts stale requests`)*
2. **Claude, or the API key, is unavailable** → the template verdict still shows and the partner shows `partnerOffline` copy; nothing throws in the UI. *(Task 5 test `explain route returns error event without key`)*
3. **Claude states a number that isn't in any tool result** → the number check flags it (shown in dev, counted in the eval). *(Task 4 tests)*
4. **The `too_short` tier, or `stats === null`** → the chart shows the raw series, the verdict card shows "Too short to judge" with its reason, and the Explain button is hidden. *(Task 3 test `renderVerdict too_short`)*
5. **A user asks the partner to compare 5+ regions, or names an unknown region** → `propose_case` clamps the case to 4 known regions, or answers that it can't find the region; it never opens a broken case. *(Task 6 test `propose_case clamps and validates`)*

---

### Task 1: Panel shell + PlotFigure (H0.5–H2, merged at the H2 checkpoint)

**Files:**
- Create: `components/charts/PlotFigure.tsx`, `components/panel/steps/{LeadStep,SceneStep,TimelineStep,EvidenceStep,VerdictStep}.tsx`, `lib/copy/case.ts`, `lib/copy/partner.ts`, `lib/copy/tour.ts`
- Modify: `components/panel/CasePanel.tsx` (Eleder's stub; yours from H2)

**Interfaces:**
- `PlotFigure({ options: (width: number) => Plot.PlotOptions; className?: string })`
  - It renders `Plot.plot(options(width))` into a `div` ref, with width from a `ResizeObserver`, and calls `.remove()` on the node in the effect cleanup.
- `CasePanel()`: no props. Tabs **Case** and **Partner**. The Case tab stacks the 5 step sections in order.
- `lib/copy/case.ts` exports `caseCopy`: step labels and helpers, tier labels, tooltips, empty and error states (placeholders from the glossary until `COPY.md` is filled in).

- [x] **Step 1: Build the shells.** Build `PlotFigure` and the 5 step components as presentational shells with props. Until the H2 merges land, feed them from `api/_fixtures/analyze.json`, imported read-only inside `CasePanel.tsx`; remove that import in Task 2. Don't create pages under `app/`, which is Eleder's area.
- [x] **Step 2: Verify.** `npm run check` passes, and the panel renders all 5 sections at `/`.
- [x] **Step 3: Merge at H2.** Commit `feat(panel): case panel shell + PlotFigure`, rebase after Oier's and Eleder's H2 merges, then self-merge.

### Task 2: Lead, Scene, Timeline wired to case state (H2–H5)

**Files:**
- Create: `components/panel/useAnalysis.ts`, `components/panel/useRegions.ts`, `components/panel/useVariables.ts`, `components/panel/useAnalysis.test.ts`
- Modify: `components/panel/steps/LeadStep.tsx`, `SceneStep.tsx`, `TimelineStep.tsx`

**Interfaces:**
- `useVariables(): { variables: Variable[]; byId: Record<string, Variable> }` (`GET /api/py/variables`, fetched once)
- `useRegions(): { regions: Region[]; byId: Record<string, Region> }` (`GET /api/py/regions`, fetched once)
- `useAnalysis(state: CaseState): { data: AnalyzeResponse|null; error: string|null; loading: boolean }`
  - Uses `api.POST("/api/py/analyze", { body: { variable, regions, start: from, end: to, season, months } })`.
  - Results are cached in memory by `caseKey(state)`.
  - A new case aborts the in-flight request (`AbortController`).
  - Skips the request when `regions.length === 0`.

- [x] **Step 1: Write the abort test.** `useAnalysis.test.ts` (first line `// @vitest-environment jsdom`; use `renderHook` from `@testing-library/react`): test `useAnalysis aborts stale requests` (mock `api.POST`; two rapid cases → the first signal is aborted and only the second result is returned). Run `npx vitest run components/panel/useAnalysis.test.ts` → FAIL.
- [x] **Step 2: Implement the hooks.** Run the test → PASS.
- [x] **Step 3: Wire the three steps.**
  - **LeadStep:** a variable select grouped by `kind` (satellite / reanalysis), plus a definition card with `definition_student` or `definition_scientist` depending on `state.level`. Variables not valid for every selected region are disabled, with the `notAvailableHere` copy.
  - **SceneStep:** chips for `state.regions` (names via `useRegions`) with remove buttons. Show the `nearestCellFallback` hint when `Region.nearest_cell_fallback`. Max 4. Adding happens on the globe or in its search box (Eleder's area).
  - **TimelineStep:** a shadcn `Slider` (range) over the variable's `[start_year, end_year]`, committing only in `onValueCommit` → `setCase({from, to})`. A season `ToggleGroup` (ANN/DJF/MAM/JJA/SON/Custom); Custom shows start/end month selects → contiguous `months`.
- [x] **Step 4: Verify and commit.** Manually: changing each control updates the URL, and reloading restores it. Run `npm run check`. Commit `feat(panel): lead/scene/timeline steps`, then self-merge.

Task 2 local verification: `npm run check`, 66 Vitest tests and 4 Chromium E2E pass. Browser checks use official HTTP fixtures, not real scientific data. Merged to main via PR #9 (Task 2 code commit `1ccc4fb`).

### Task 3: Evidence charts + verdict card (H5–H8, the M1 checkpoint)

**Files:**
- Create: `components/charts/SeriesChart.tsx`, `components/charts/MonthlyChart.tsx`, `lib/partner/verdict-templates.ts`, `lib/partner/verdict-templates.test.ts`, `lib/partner/format.ts`
- Modify: `components/panel/steps/EvidenceStep.tsx`, `VerdictStep.tsx`

**Interfaces:**
- `SeriesChart({ results: RegionAnalysis[]; unit: string })` draws, for each region:
  - the yearly values as `Plot.dot` + `Plot.line`;
  - the OLS line from `fit[].ols`, with `Plot.areaY(fit, {x:"year", y1:"ols_low", y2:"ols_high"})` at 0.2 opacity;
  - the Sen line from `fit[].sen`, dashed.
  
  Colours: `--series-1` … `--series-4`.
- `MonthlyChart({ results; mode: "raw" | "anomaly" })`
- `format.ts`:
  - `fmtSlope(x): string`: 2 significant figures, with sign.
  - `fmtP(p): string`: `"< 0.001"` or 2 significant figures.
- `renderVerdict(r: RegionAnalysis, ctx: { variableName: string; unit: string; regionName: string; period: string; seasonLabel: string }, level: ReadingLevel): { badge: string; title: string; body: string }`
  - The wording comes from `docs/science/VERDICT_TEMPLATES.md`; copy its table into this file as template strings.

- [x] **Step 1: Write the verdict tests.** In `verdict-templates.test.ts`:
  - `renderVerdict confirmed student` (badge === "Confirmed"; the body contains `fmtSlope(stats.change_per_decade)` and "per decade");
  - `renderVerdict not_proven shows years` (the body contains `String(verdict.years_needed)`);
  - `renderVerdict no_case never says no change` (the body doesn't match `/no change/i`);
  - `renderVerdict too_short` (badge === "Too short to judge"; works with `stats === null`);
  - `tests_disagree warning surfaces` (when `warnings` includes `"tests_disagree"`, the body includes the caution line).

  Run `npx vitest run lib/partner` → FAIL.
- [x] **Step 2: Implement** `format.ts` and `verdict-templates.ts`. Run → PASS.
- [x] **Step 3: Build the Evidence and Verdict steps.**
  - **EvidenceStep:** `SeriesChart` plus a Yearly/Monthly toggle (Monthly → `MonthlyChart` with a raw/anomaly switch), and a source badge from `provenance` (`kind` is shown as "Satellite" or "Reanalysis (model)").
  - **VerdictStep:** one card per region with `renderVerdict`. The Scientist level adds an Ols/Mk/Sen numbers table.
- [x] **Step 4: Verify and merge (M1).**
  - With the H2 stubs (or the real API once Oier merges), Case `?v=T2M&r=US-WI&from=1981&to=2024&s=ANN` shows the chart and a verdict.
  - Run `npm run check`.
  - Commit `feat(panel): evidence chart + verdict card`, then self-merge at the **H8 checkpoint**. You merge last (after Oier, then Eleder).

Task 3 local verification: check + 78 Vitest tests + 6 Chromium E2E pass, using official HTTP fixtures. Light/dark screenshots reviewed, including four-region Scientist layout and widths 1280/768/390. Publication and merge completed in PR #10; current main is `e772a5b`.

### Task 4: SSE helpers + number check (H8–H10)

**Files:**
- Create: `lib/partner/sse.ts`, `lib/partner/sse-client.ts`, `lib/partner/number-check.ts`, plus `lib/partner/sse.test.ts` and `lib/partner/number-check.test.ts`

**Interfaces:**
- `type PartnerEvent =`
  - `{type:"text"; text:string}`
  - `{type:"tool_call"; name:string}`
  - `{type:"tool_result"; name:string; data:unknown}`
  - `{type:"propose_case"; query:string; title:string}`
  - `{type:"error"; message:string}`
  - `{type:"done"}`
- `sseStream(run: (emit: (e: PartnerEvent) => void) => Promise<void>): Response`
  - Returns a `text/event-stream` response with `Cache-Control: no-cache, no-transform`.
  - Each event is written as `data: <json>\n\n`.
  - Always emits `done` last, and turns a thrown error into an `error` event.
- `readSse(res: Response, onEvent: (e: PartnerEvent) => void): Promise<void>`
- `extractNumbers(text: string): { raw: string; value: number; decimals: number }[]`
  - Handles `−`/`-`, `,` decimals, `%` and thousands separators.
  - Skips 4-digit integers between 1900 and 2100 (years).
- `collectNumbers(data: unknown): number[]` (recursive)
- `checkNumbers(text: string, toolResults: unknown[]): { ok: boolean; unmatched: string[] }`
  - A match is any tool number within `max(0.5·10^(−decimals), 0.01·|v|)`.
  - For values written with `%`, also compare `v/100`.

- [x] **Step 1: Write the tests.**
  - `extracts signed decimals and percents`;
  - `skips years`;
  - `matches rounded numbers` ("about 0.04 per decade" vs `0.0412` → ok);
  - `flags invented number` ("0.9" vs `[0.04]` → unmatched `["0.9"]`);
  - `sse roundtrip` (`sseStream` → `readSse` yields the same events, ending in `done`).

  Run `npx vitest run lib/partner` → FAIL.
- [x] **Step 2: Implement.** Run → PASS.
- [x] **Step 3: Commit and merge.** `feat(partner): sse + number check`, then self-merge. Verified: commit `4d95598` is an ancestor of current `main`.

### Task 5: Explain mode (H10–H14, M2)

**Files:**
- Create: `lib/partner/anthropic.ts`, `lib/partner/prompts.ts`, `lib/partner/explain.ts`, `lib/partner/summarize.ts`, `lib/partner/prompts.test.ts`, `components/partner/ExplainBox.tsx`, `lib/partner/demo-explanations.json` (initially `{}`)
- Modify: `app/api/partner/route.ts` (Eleder's stub; yours from H2), `components/panel/steps/VerdictStep.tsx`

**Interfaces:**
- `anthropic.ts` exports:
  - `getClient(): Anthropic`, which builds `new Anthropic()` lazily on first call and caches it. The SDK constructor throws when the key is missing; constructing it lazily inside the route's try block turns that into an `error` event instead of a crash at import.
  - `MODEL = "claude-opus-5-5"`
  - `FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } as const`
- `prompts.ts` exports:
  - `SYSTEM: string`, frozen. It contains:
    - the persona (from `docs/pitch/BRAND_BRIEF.md`);
    - the grounding rules (verbatim from `docs/science/VERDICT_TEMPLATES.md`);
    - the reading-level rules;
    - the process cards (`JSON.stringify` of `process-cards.json`, keys sorted).
  - `explainUserMessage(input: ExplainInput): string`, carrying the level + the summarized analysis JSON + the instruction "3–5 sentences".
- `summarizeAnalysis(r: RegionAnalysis, v: Variable, regionName: string)` → `{region, variable, unit, period, season, n_years, stats (without arrays), verdict, provenance, warnings}`
- `streamExplain(input: ExplainInput, emit): Promise<void>`
- **Route body** (zod):
  - `{mode:"explain", level, analysis: RegionAnalysis, variable: Variable, regionName: string, period: string, seasonLabel: string}`
  - or `{mode:"chat", …}` (Task 6).

  The route answers with `sseStream(...)`.
- `ExplainBox({ result, variable, regionName, level })`
  - If `demo-explanations.json[caseKey(state)]?.[level]` exists, render it directly (no API call).
  - Otherwise POST and stream the text.
  - On an `error` event, show `partnerCopy.offline` under the template verdict.

**The SDK call (use as written):**

```ts
const stream = getClient().beta.messages.stream({
  model: MODEL,
  max_tokens: 4000,
  ...FALLBACK,
  output_config: { effort: "low" },
  system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
  messages: [{ role: "user", content: explainUserMessage(input) }],
});
for await (const event of stream) {
  if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
    emit({ type: "text", text: event.delta.text });
  }
}
const final = await stream.finalMessage();
if (final.stop_reason === "refusal") emit({ type: "error", message: partnerCopy.refused });
```

Errors: catch `Anthropic.RateLimitError` → the `partnerCopy.busy` message, `Anthropic.APIError` → `partnerCopy.offline`. Check them in that order and never match error strings.

- [x] **Step 1: Write the tests.**
  - `prompts.test.ts`: `SYSTEM is deterministic` (importing twice gives the same string; it doesn't contain the current year or `Date`); `summarizeAnalysis drops arrays` (no `monthly`/`fit` keys).
  - `explain route returns error event without key` (call the route handler with `ANTHROPIC_API_KEY` unset → the stream contains an `error` event, then `done`).

  Run → FAIL.
- [x] **Step 2: Implement** `anthropic.ts`, `prompts.ts`, `summarize.ts`, `explain.ts` and the explain branch of the route. Run → PASS.
- [ ] **Step 3: Live check.** With a real key in `.env.local`, an Explain request streams text. Log `final.usage.cache_read_input_tokens`; it must be > 0 on the second identical request. If it stays 0, the prefix is changing between requests.
- [x] **Step 4: Wire it into the UI.** Add `ExplainBox` under each verdict card, hidden for `too_short`. Add a Student/Scientist switch in the panel header → `setCase({level})`.
- [ ] **Step 5: Merge (M2).** Commit `feat(partner): explain mode`, then self-merge at the **H14 checkpoint**. Case #1 must explain end to end on production.

Task 5 local implementation: check + 93 Vitest tests + 10 Chromium E2E pass with mocked SDK/HTTP fixtures. Steps 3 and 5 remain pending: user confirmed the key is only in Vercel and requested deferring the real streaming/cache check; user handles publication/PR/merge. Process cards are empty pending Methods content, so Explain makes no physical claims.

### Task 6: Partner chat with tools (H14–H18)

**Files:**
- Create: `lib/partner/tools.ts`, `lib/partner/chat.ts`, `lib/partner/tools.test.ts`, `components/partner/PartnerChat.tsx`
- Modify: `app/api/partner/route.ts`, `components/panel/CasePanel.tsx` (the Partner tab)

**Interfaces:**
- `makeTools(py: ReturnType<typeof serverApi>, emit)` returns the array passed as `tools`, with these tools:

  | Tool | Input | Calls / returns |
  |---|---|---|
  | `list_variables` | `{}` | id, name, unit, kind |
  | `analyze_case` | `{variable, regions (1–4), from, to, season, months?}` | `/analyze` → `summarizeAnalysis` per region |
  | `correlate` | `{var_x, var_y, region, from, to}` | `/correlate` without `scatter` |
  | `find_mirror` | `{variable, region, from, to, season}` | `/mirror` |
  | `scan_region` | `{region, from, to}` | `/scan` |
  | `get_process_card` | `{id}` | the card from `process-cards.json`, or the list of ids |
  | `propose_case` | `{variable, regions, from, to, season, months?, title}` | `normalizeCase` + checks the regions exist in `/regions` and clamps to 4 → emits `propose_case{query: caseToQuery(...), title}`, returns `"proposed"`; unknown regions → returns an error string naming them |

  Every `run` emits `tool_call` before and `tool_result` after, and returns `JSON.stringify(result)`.
- **Chat body:** `{mode:"chat", level, case: CaseState, messages: {role:"user"|"assistant"; content:string}[]}`, with at most 20 messages (text only). The current case and level are prepended to the last user message as a short context line.
- **Server API for tools:** `serverApi(new URL(req.url).origin, process.env.VERCEL_AUTOMATION_BYPASS_SECRET ? { "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET } : {})`

**Tool definition and runner (use as written):**

```ts
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

const analyzeCase = betaZodTool({
  name: "analyze_case",
  description: "Run the trend analysis for a variable over 1-4 regions and a period. Returns slope per decade, p-values (Mann-Kendall Hamed-Rao, OLS AR(1)), verdict tier and years until significant.",
  inputSchema: z.object({
    variable: z.string(), regions: z.array(z.string()).min(1).max(4),
    from: z.number().int(), to: z.number().int(),
    season: z.enum(["ANN", "DJF", "MAM", "JJA", "SON", "CUSTOM"]),
    months: z.array(z.number().int().min(1).max(12)).optional(),
  }),
  run: async (input) => { /* emit tool_call → py.POST → summarize → emit tool_result → return JSON */ },
  eager_input_streaming: true,
});

const runner = getClient().beta.messages.toolRunner({
  model: MODEL,
  max_tokens: 16000,
  max_iterations: 6,
  stream: true,
  ...FALLBACK,
  output_config: { effort: "medium" },
  system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
  tools: makeTools(py, emit),
  messages,
});
for await (const messageStream of runner) {
  for await (const event of messageStream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      emit({ type: "text", text: event.delta.text });
    }
  }
  const message = await messageStream.finalMessage();
  if (message.stop_reason === "refusal") { emit({ type: "error", message: partnerCopy.refused }); break; }
  if (message.stop_reason === "max_tokens" && message.content.some((b) => b.type === "tool_use")) {
    emit({ type: "error", message: partnerCopy.tooLong }); break;
  }
}
```

The runner validates each tool input against its Zod schema before calling `run`. If iterating throws a non-`Anthropic.APIError` (unparseable tool JSON), emit `partnerCopy.retry` once; don't loop.

- [ ] **Step 1: Write the tests.** In `tools.test.ts`, with mocked `py`:
  - `propose_case clamps and validates` (6 regions → the emitted query has 4; an unknown id → an error string, no `propose_case` event);
  - `analyze_case result has no arrays`;
  - `tools emit call and result events`.

  Run → FAIL.
- [ ] **Step 2: Implement** `tools.ts`, `chat.ts` and the chat branch of the route. Run → PASS.
- [ ] **Step 3: Build `PartnerChat`.**
  - Message list and input box, plus 3 starter questions from `partnerCopy.starters`.
  - The `tool_call` event shows "Checking the data…".
  - The `propose_case` event shows an **Open this case** button → `replaceCase(caseFromQuery(query))`.
  - In dev, run `checkNumbers(text, toolResults)` and show a small warning if not ok.
- [ ] **Step 4: Verify.** Manually: "Is Wisconsin getting smokier in summer?" → it runs `analyze_case` and offers to open the case. Commit `feat(partner): chat with tools`, then self-merge.

### Task 7: Correlation, mirror, years meter, predict-before-reveal (H14–H18)

**Files:**
- Create: `components/panel/CorrelationView.tsx`, `components/charts/CorrelationChart.tsx`, `components/panel/MirrorList.tsx`, `components/panel/YearsMeter.tsx`, `components/panel/PredictPrompt.tsx`
- Modify: `components/panel/steps/VerdictStep.tsx`, `components/panel/CasePanel.tsx`

**Interfaces:**
- `CorrelationView`:
  - second-variable select → `api.POST("/api/py/correlate", ...)` for `state.regions[0]`;
  - `CorrelationChart` with a scatter (`Plot.dot`) + `Plot.linearRegressionY`, and lag bars (`Plot.barY` over `lags`);
  - the `bothTrending` callout when `warning === "both_trending"`;
  - the numbers: raw r, detrended r, n_eff, p.
- `MirrorList`:
  - `api.POST("/api/py/mirror", ...)` for the first region, then the top 3 with slope/decade.
  - **Show on globe** → `setHighlight({kind:"mirror", regions: ids, arcFrom: base})`.
  - **Compare** → `setCase({regions: [base, id]})`.
  - The `noMirror` copy when `none_found`.
- `YearsMeter({ nYears, yearsNeeded })`: a bar showing `nYears / (nYears + yearsNeeded)`, with the label "≈N more years at this rate". Rendered only for `not_proven`.
- `PredictPrompt`:
  - When `predictMode && !reveal`, the Verdict step shows **Up / Down / No clear trend** instead of the verdict.
  - Answering calls `setReveal(true)` and shows "You guessed X; the data says Y".
  - The switch lives in the panel header: `setPredictMode`. When predict mode is turned on, call `setReveal(false)`.

- [ ] **Step 1: Build** the four components and wire them into VerdictStep and CasePanel.
- [ ] **Step 2: Verify.** Manually: the Sahel/Mediterranean mirror highlights on the globe, the correlation warning appears for two co-trending temperature variables, and predict mode hides the verdict and the globe colours until you answer. Run `npm run check`. Commit `feat(panel): correlation, mirror, years meter, predict`, then self-merge.

### Task 8: Guided tours (H16–H18)

**Files:**
- Create: `lib/tour/types.ts`, `lib/tour/tours.json`, `lib/tour/tours.test.ts`, `components/tour/TourPlayer.tsx`, `components/tour/TourLauncher.tsx`
- Modify: `components/panel/CasePanel.tsx`

**Interfaces:**
- `Tour{id, title, steps: TourStep[]}`
- `TourStep{query: string; caption: string; focus?: {lat, lng, altitude}; highlight?: string[]; reveal?: boolean}`
- Each step runs, in order:
  1. `replaceCase(caseFromQuery(step.query))`;
  2. `flyTo(step.focus ?? centroid of the first region)`;
  3. `setHighlight({kind:"tour", regions: step.highlight ?? [], arcFrom: null})`;
  4. show the caption.
- The player has Prev/Next/Play (6 s per step) and Exit, which calls `clearHighlight()`.
- `TourLauncher`: a **Watch this case** button per tour, shown in the panel's empty state and in the Partner tab.

- [ ] **Step 1: Write the tour test.** `tours.test.ts`: `every tour step parses` (each `caseFromQuery(step.query)` round-trips through `caseToQuery`, and each region id exists in `api/_fixtures/regions.json` or `api/_data/regions.json`). Run → FAIL.
- [ ] **Step 2: Implement** the tours with the captions from `docs/pitch/DEMO_SCRIPT.md` (Edur, H10) and the cases from `docs/science/DEMO_CASES.md` (Sergio, H8). Run → PASS. Commit `feat(tour): guided demo tours`, then self-merge.

### Task 9: Demo explanations, eval harness, E2E (H22–H26)

**Files:**
- Create: `scripts/gen-demo-explanations.ts`, `scripts/run-eval.ts`, `e2e/case-flow.spec.ts`, `e2e/partner.spec.ts`
- Modify: `lib/partner/demo-explanations.json`

**Interfaces:**
- `npx tsx scripts/gen-demo-explanations.ts` (env `ANTHROPIC_API_KEY`, `BASE_URL`):
  - for each tour's final step: `/analyze`, then `streamExplain` collected into a string, for **both** levels;
  - writes `{ [caseKey]: { student, scientist, generated_at } }` with sorted keys.
- `npx tsx scripts/run-eval.ts --base $BASE_URL`:
  - reads the question rows of `docs/science/EVAL.md`;
  - POSTs each one in chat mode and collects the text + `tool_result` data;
  - runs `checkNumbers`;
  - prints a markdown table `| # | question | numbers ok | unmatched | answer (first 200 chars) |` for Sergio.

- [ ] **Step 1: Generate the demo explanations** and have Sergio approve each text. If he edits one, edit the JSON by hand and keep `generated_at`.
- [ ] **Step 2: Run the eval** with Sergio. Fix the prompts and record the score in STATUS.
- [ ] **Step 3: Write the E2E tests.**
  - `case-flow.spec.ts`: `case from URL shows verdict` (open `/?v=T2M&r=US-WI&from=1981&to=2024&s=ANN` → a verdict badge is visible within 10 s); `season change updates URL` (click JJA → the URL contains `s=JJA`).
  - `partner.spec.ts` (skipped unless `E2E_PARTNER=1`): `partner proposes a case`.

  Run `npm run test:e2e` → PASS.
- [ ] **Step 4: Merge before the freeze.** Commit `chore(partner): demo explanations, eval harness, e2e`, then self-merge **before H26**. After the freeze, P0 fixes only, merged by Eleder.

## Done when (whole plan)

- The 3 demo cases run end to end on production with instant cached explanations.
- Partner chat answers with tool-grounded numbers, and the eval score is recorded in STATUS.
- `npx vitest run` and `npm run test:e2e` are green.
