# Graph Report - womm-earth  (2026-11-14)

## Corpus Check
- 168 files · ~87,906 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 18 file(s) not represented in the graph (top: (none) 6, .csv 4, .geojson 4)

## Summary
- 1116 nodes · 2050 edges · 91 communities (76 shown, 15 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 86 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `45dc58cb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- _models.py
- react
- command.tsx
- with
- export_geo.py
- devDependencies
- components.json
- dependencies
- compilerOptions
- check-ownership.mjs
- make_golden.py
- scripts
- Oier · Coder B
- layout.tsx
- numpy
- Earth Case Files (working name): Hackathon Plan
- sonner.tsx
- eslint.config.mjs
- types.ts
- api/index.py
- MASTER PROMPT PARA CODEX — CODER C (EKAITZ LAZKANO)
- METHODS: statistics spec (source of truth for `api/_engine/`)
- next
- @playwright/test
- PROJECT PAGE (submission text)
- TEAM.md
- PROCESS CARDS
- number-check.ts
- index.py
- ARCHITECTURE
- BRAND BRIEF
- COPY: every word in the app
- PROJECT: Earth Case Files (working name)
- Earth Case Files: NASA Space Apps 2026 (team WOMM)
- tour.ts
- import_giovanni.py
- CasePanel.tsx
- DEMO SCRIPT
- MERGING: branches, PRs and integration checkpoints
- DEMO CASES
- LIMITATIONS
- sheet.tsx
- test_api.py
- case-codec.ts
- sse.ts
- input-group.tsx
- Resources: NASA Space Apps 2026 - "Be An Earth System Trend Detective!"
- USER TEST
- Golden cases: the engine's answer key
- VERDICT TEMPLATES and partner grounding rules
- pull_request_template.md
- test_contract.py
- DATA CATALOG
- Handoff procedure (end of every session)
- FALSE-POSITIVE SIMULATION and power check
- PlotFigure.test.tsx
- Handoffs
- CLAUDE.md
- JUDGES_QA.md
- SUBMISSION_CHECKLIST.md
- process/resume.md
- EVAL.md
- Golden cases 1-3 (answer key for `api/_engine/`)
- TimelineStep.tsx
- Coder B · data engine · H2
- trend.py
- analyze
- MonthlyChart.tsx
- package.json
- LeadStep.tsx
- test_trend.py
- Review focus
- 6. PLAN DE IMPLEMENTACIÓN — ejecuta las Tasks 1–9 oficiales
- StepSection.tsx
- ui-store.ts
- CasePanel.test.tsx
- TrendMapRequest
- coder-c · Task 2 controls · H3.2
- coder-c · Task 3 Evidence + Verdict · H3.4
- Review focus
- CasePanel
- fpr_figure.py
- coder-c · Task 4 verification · H3.5
- 7. Requisitos transversales no negociables
- class-variance-authority
- TEAM

## God Nodes (most connected - your core abstractions)
1. `react` - 36 edges
2. `cn` - 26 edges
3. `analyze_yearly()` - 22 edges
4. `METHODS: statistics spec (source of truth for `api/_engine/`)` - 19 edges
5. `radix-ui` - 18 edges
6. `hamed_rao()` - 17 edges
7. `analyze()` - 17 edges
8. `CasePanelContent()` - 17 edges
9. `vitest` - 17 edges
10. `Earth Case Files (working name): Hackathon Plan` - 17 edges

## Surprising Connections (you probably didn't know these)
- `How to compute the expected values (pick one and say which in `recipe.md`)` --references--> `sens_slope()`  [INFERRED]
  docs/science/golden_cases/README.md → api/_engine/trend.py
- `Using it in pytest (sketch; `analyze_yearly` is whatever Oier exposes)` --references--> `analyze_yearly()`  [INFERRED]
  tests/fixtures/golden/GOLDEN_CASES.md → api/_engine/verdict.py
- `A. Partner chat con tool use` --references--> `correlate()`  [INFERRED]
  CODEX_CODER_C_EKAITZ_MASTER_PROMPT.md → api/index.py
- `Claude integration` --references--> `correlate()`  [INFERRED]
  docs/ARCHITECTURE.md → api/index.py
- `Claude integration (Coder C)` --references--> `correlate()`  [INFERRED]
  docs/superpowers/specs/2026-11-14-earth-case-files-design.md → api/index.py

## Import Cycles
- None detected.

## Communities (91 total, 15 thin omitted)

### Community 0 - "_models.py"
Cohesion: 0.17
Nodes (20): analyze_yearly(), tier_for(), years_until_significant(), AnalyzeResponse, FitPoint, LagPoint, MirrorBase, MirrorEntry (+12 more)

### Community 1 - "react"
Cohesion: 0.12
Nodes (5): ScrollArea(), ScrollBar(), cn, radix-ui, react

### Community 2 - "command.tsx"
Cohesion: 0.08
Nodes (18): CommandDialog(), CommandInput(), Dialog(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay() (+10 more)

### Community 3 - "with"
Cohesion: 0.09
Nodes (24): runs-on, steps, concurrency, cancel-in-progress, group, jobs, api, web (+16 more)

### Community 4 - "export_geo.py"
Cohesion: 0.07
Nodes (28): build(), main(), mask_weights(), preserve_existing_validity(), region_records(), weighted_means(), all_region_features(), country_feature() (+20 more)

### Community 5 - "devDependencies"
Cohesion: 0.09
Nodes (23): devDependencies, concurrently@^10.0.7, jsdom@^31.0.1, minimatch@^11.0.8, tailwindcss@4.3.3, @testing-library/react@^16.3.3, tsx@^4.23.15, @types/node@^22.20.5 (+15 more)

### Community 6 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 7 - "dependencies"
Cohesion: 0.09
Nodes (22): dependencies, @anthropic-ai/sdk@^1.8.0, class-variance-authority@^0.7.1, cmdk@^1.1.1, cn@^0.5.2, @observablehq/plot@^0.6.19, openapi-fetch@^0.17.0, radix-ui@^1.8.1 (+14 more)

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 9 - "check-ownership.mjs"
Cohesion: 0.36
Nodes (5): main(), outsideArea(), OWNERS, parseAreas(), areas

### Community 10 - "make_golden.py"
Cohesion: 0.10
Nodes (18): acf_biased(), analyse(), cross_check(), find_seed(), gen_ar1(), hamed_rao_factor(), main(), mk_score() (+10 more)

### Community 11 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, check, dev, dev:api, dev:web, gen:types, lint (+4 more)

### Community 12 - "Oier · Coder B"
Cohesion: 0.18
Nodes (11): Oier-owned API, pipeline, tests and geo files, Contract v1, stub API, countries geometry, Data and statistics engine, METHODS.md statistical specification, NASA data to reliable regional time series, Oier · Coder B, Real analyze, variables and regions endpoints, Task 1: contract, stub API and first geometry (+3 more)

### Community 13 - "layout.tsx"
Cohesion: 0.22
Nodes (5): geistMono, geistSans, metadata, RootLayout(), TooltipProvider()

### Community 14 - "numpy"
Cohesion: 0.16
Nodes (14): _month_index(), monthly_with_anomalies(), yearly_series(), test_annual_requires_10_months(), test_custom_wrap_ndj(), test_djf_assigns_december_to_next_year(), test_djf_drops_incomplete_edges(), test_monthly_anomalies_use_selected_period_climatology() (+6 more)

### Community 15 - "Earth Case Files (working name): Hackathon Plan"
Cohesion: 0.09
Nodes (22): Architecture and repo layout, Claude integration (Coder C), Coder B: data & stats engine, Coder C: panel, charts & partner, Context, Data pipeline (Coder B; spike in H1, finished by H6), Design approach (avoid the "vibe-coded" look), Earth Case Files (working name): Hackathon Plan (+14 more)

### Community 16 - "sonner.tsx"
Cohesion: 0.33
Nodes (4): next-themes@^0.4.6, sonner@^2.0.8, next-themes, sonner

### Community 17 - "eslint.config.mjs"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint@^9, eslint-config-next@16.4.6, eslint, eslint-config-next

### Community 18 - "types.ts"
Cohesion: 0.06
Nodes (46): Props, StatsTable(), base, context, VerdictStep(), AnalyzeResponse, CaseRequest, components (+38 more)

### Community 19 - "api/index.py"
Cohesion: 0.33
Nodes (5): excludeFiles, includeFiles, functions, api/index.py, $schema

### Community 20 - "MASTER PROMPT PARA CODEX — CODER C (EKAITZ LAZKANO)"
Cohesion: 0.14
Nodes (13): 0. Orden de ejecución: este es un encargo de implementación, no una consulta, 10. Prioridad inmediata y primera acción, 1. Primero inspecciona el repositorio y reanuda tu rol, 2. Contexto del producto: qué estamos construyendo y para quién, 3. Tu responsabilidad exacta y fronteras entre compañeros, 4. Reglas de colaboración, Git y checkpoints, 5. Contrato de datos: integra lo que existe; no inventes payloads, 8. Pruebas y definición objetiva de «terminado» (+5 more)

### Community 21 - "METHODS: statistics spec (source of truth for `api/_engine/`)"
Cohesion: 0.10
Nodes (19): 10. Years until significant, 11. Reporting magnitude, 12. Correlation between two variables, 13. Mirror rule, 14. Many regions at once: trend-map dots and the scanner, 15. Change point (Could), 16. Assumptions and limitations, 1. Regional averaging (fixed by the pipeline; for reference only) (+11 more)

### Community 22 - "next"
Cohesion: 0.50
Nodes (3): nextConfig, next@16.4.6, next

### Community 24 - "PROJECT PAGE (submission text)"
Cohesion: 0.15
Nodes (12): How it works, How we used AI, Impact, NASA data used, One-line summary, PROJECT PAGE (submission text), Statistical rigour (Methods lead), Team (+4 more)

### Community 25 - "TEAM.md"
Cohesion: 0.14
Nodes (10): If you're blocked, Playbook: Lead / integrator (Eleder, Claude Code), Timeline, Your merge duties (see MERGING.md), If you're blocked, Playbook: Methods & Validity lead (statistician), Steps, If you're blocked (+2 more)

### Community 26 - "PROCESS CARDS"
Cohesion: 0.17
Nodes (11): aral-irrigation: Irrigation and the shrinking Aral Sea, arctic-amplification: Why the Arctic warms faster, natural-variability: Natural variability and El Niño (why short records often aren't significant), PROCESS CARDS, sahel-recovery: The Sahel's rainfall recovery since the 1980s drought, smoke-aod: Wildfire smoke and aerosol optical depth, snow-albedo: Snow-albedo feedback, subtropical-drying: Hadley-cell expansion and drier subtropics (+3 more)

### Community 27 - "number-check.ts"
Cohesion: 0.50
Nodes (6): checkNumbers(), collectNumbers(), collectPValues(), ExtractedNumber, extractNumbers(), tokens()

### Community 28 - "index.py"
Cohesion: 0.17
Nodes (14): correlate(), _fixture(), health(), mirror(), scan(), trendmap(), CaseRequest, CorrelateResponse (+6 more)

### Community 29 - "ARCHITECTURE"
Cohesion: 0.20
Nodes (9): ARCHITECTURE, Claude integration, Data pipeline (offline; run in Colab or a Codespace, not over venue wifi), Data shapes, Endpoints (summary; the exact contract is Task 1 of `docs/superpowers/plans/2026-11-14-data-engine.md`, and `api/_models.py` is the final word), Front-end gotchas, Performance, Repo layout (target; owners per `docs/process/OWNERSHIP.md`) (+1 more)

### Community 30 - "BRAND BRIEF"
Cohesion: 0.20
Nodes (9): BRAND BRIEF, Mood words, Must avoid, Name: 3 options (vote at H2), One-line pitch, Partner persona (the Claude detective), Tone of voice, Visual references (3–5): link + what we like about each (+1 more)

### Community 31 - "COPY: every word in the app"
Cohesion: 0.20
Nodes (9): About / "How we test" page, Buttons and microcopy, COPY: every word in the app, Empty and error states, Onboarding: the partner's first questions, The 5 steps (label · helper text), Tooltips (statistical terms; the Methods lead checks each one), Variable card template (+1 more)

### Community 32 - "PROJECT: Earth Case Files (working name)"
Cohesion: 0.20
Nodes (9): Decisions log, Direction: hybrid A+B+C, Glossary, In one line, Judging map (each criterion scored 1–5), Personalization (decided at the H0–H1 huddle; record results in the Decisions log), PROJECT: Earth Case Files (working name), Scope (+1 more)

### Community 33 - "Earth Case Files: NASA Space Apps 2026 (team WOMM)"
Cohesion: 0.22
Nodes (8): Commands (after the scaffold lands), Earth Case Files: NASA Space Apps 2026 (team WOMM), Merging, Ownership (read before editing anything), Read when, Rules, Session protocol, This is NOT the Next.js you know

### Community 35 - "import_giovanni.py"
Cohesion: 0.24
Nodes (7): main(), convert_catalog(), _last_year(), main(), test_catalog_includes_only_confirmed_rows_and_uses_data_end_year(), test_catalog_reports_bad_in_store_row_by_name(), test_catalog_reports_unrecognized_status_by_name()

### Community 37 - "CasePanel.tsx"
Cohesion: 0.23
Nodes (13): CasePanelContent(), SceneStep(), TimelineStep(), createCatalogHook(), useCatalog, useRegions(), useCatalog, useVariables() (+5 more)

### Community 38 - "DEMO SCRIPT"
Cohesion: 0.25
Nodes (7): Case 1: _title_, Case 2: _title_, Case 3: _title_, DEMO SCRIPT, Live demo (3 minutes), Tour captions (become the tour JSON for Coder C), Video storyboard (30–60 s; check the length limit)

### Community 39 - "MERGING: branches, PRs and integration checkpoints"
Cohesion: 0.25
Nodes (7): Branches, CI (Eleder sets it up in the scaffold; `.github/workflows/ci.yml`), Integration checkpoints, MERGING: branches, PRs and integration checkpoints, Resolving conflicts, The PR loop (every coder, every task), Who merges

### Community 40 - "DEMO CASES"
Cohesion: 0.25
Nodes (7): Case 1: Are Wisconsin summers getting smokier?, Case 2: How fast is the Arctic warming compared with the rest of the world?, Case 3: Mirror pair: Sahel wetter, Mediterranean drier?, Case 4: Is the land around the Aral Sea drying out?, Case 5: Is a big city's air getting cleaner?, DEMO CASES, Local "home" case (optional, if the team adds your country's regions)

### Community 41 - "LIMITATIONS"
Cohesion: 0.25
Nodes (7): Data coverage and small regions (nearest-cell fallback), LIMITATIONS, Reanalysis is a model product, not a direct measurement, Regional averages hide what happens inside a region, Short records and natural variability, Testing many regions or variables at once, We test for steady (monotonic, roughly linear) trends

### Community 42 - "sheet.tsx"
Cohesion: 0.20
Nodes (5): Button(), buttonVariants, SheetContent(), SheetOverlay(), SheetPortal()

### Community 43 - "test_api.py"
Cohesion: 0.24
Nodes (10): case(), data_dir(), request(), test_analyze_real_series(), test_analyze_too_short(), test_case_cli_prints_stats_and_json(), test_hero_series_precedes_npz_and_supplies_provenance(), test_missing_known_series_is_too_short() (+2 more)

### Community 44 - "case-codec.ts"
Cohesion: 0.08
Nodes (44): Áreas que NO debes modificar, cache, Snapshot, useAnalysis(), If you're blocked, Playbook: Coder C, panel, charts & partner (Ekaitz, Codex), Timeline, Blockers (+36 more)

### Community 45 - "sse.ts"
Cohesion: 0.26
Nodes (8): Task 4: SSE helpers + number check (H8–H10), MAX_EVENT_BYTES, PartnerEvent, partnerEventSchema, readSse(), Emit, sseStream(), encode

### Community 46 - "input-group.tsx"
Cohesion: 0.31
Nodes (6): InputGroupButton(), inputGroupButtonVariants, InputGroupInput(), InputGroupTextarea(), Input(), Textarea()

### Community 47 - "Resources: NASA Space Apps 2026 - "Be An Earth System Trend Detective!""
Cohesion: 0.40
Nodes (4): CSA (Canadian Space Agency), NASA Data & Resources, Resources: NASA Space Apps 2026 - "Be An Earth System Trend Detective!", Space Agency Partner Resources

### Community 48 - "USER TEST"
Cohesion: 0.40
Nodes (4): Observations, Script (about 7 minutes per person), Top 5 fixes (each posted in `docs/STATUS.md` with an owner), USER TEST

### Community 49 - "Golden cases: the engine's answer key"
Cohesion: 0.40
Nodes (4): `expected.json` fields, Golden cases: the engine's answer key, How to compute the expected values (pick one and say which in `recipe.md`), The six cases

### Community 50 - "VERDICT TEMPLATES and partner grounding rules"
Cohesion: 0.40
Nodes (4): Misconceptions the wording must avoid, Partner grounding rules (go verbatim into Claude's system prompt), VERDICT TEMPLATES and partner grounding rules, Verdict wording (draft; edit freely)

### Community 51 - "pull_request_template.md"
Cohesion: 0.40
Nodes (4): Area, Checks, Seam change, What

### Community 52 - "test_contract.py"
Cohesion: 0.12
Nodes (8): main(), test_contract_fixtures_validate(), test_custom_season_months_must_be_cyclically_contiguous(), test_health_preserves_python_version(), test_invalid_trendmap_and_mirror_requests_return_422(), test_mirror_requires_exactly_one_region(), test_trendmap_rejects_invalid_period_and_custom_months(), test_golden_case()

### Community 53 - "DATA CATALOG"
Cohesion: 0.50
Nodes (3): Attribution list (for the About page and project page), DATA CATALOG, Variables

### Community 54 - "Handoff procedure (end of every session)"
Cohesion: 0.50
Nodes (3): Handoff procedure (end of every session), Steps, Where to make the edits

### Community 55 - "FALSE-POSITIVE SIMULATION and power check"
Cohesion: 0.20
Nodes (9): 1. False-positive rate under the null (nominal 5%), n = 24, 2. Power at n = 24 (true slope 0.004/yr, noise sd 0.03), 3. Alternatives I tested and do NOT recommend (n = 24, null), 4. Years-until-significant check (METHODS §10), 5. What a "Not proven yet" verdict means, Caveats, FALSE-POSITIVE SIMULATION and power check, Recommended decisions (+1 more)

### Community 56 - "PlotFigure.test.tsx"
Cohesion: 0.18
Nodes (4): observers, ResizeObserverMock, @testing-library/react, vitest

### Community 63 - "Golden cases 1-3 (answer key for `api/_engine/`)"
Cohesion: 0.25
Nodes (7): Files, Golden cases 1-3 (answer key for `api/_engine/`), Not covered yet (golden 4-8, next), Spec gaps the golden cases exposed (decide in METHODS v1, then tell Oier), Tolerances, Using it in pytest (sketch; `analyze_yearly` is whatever Oier exposes), What each case proves

### Community 64 - "TimelineStep.tsx"
Cohesion: 0.19
Nodes (13): maxDuration, POST(), contiguousMonths(), EvidenceStep(), Props, TimelineControls(), Slider(), ToggleGroup() (+5 more)

### Community 65 - "Coder B · data engine · H2"
Cohesion: 0.29
Nodes (6): Coder B · data engine · H2, Decisions made (also logged in PROJECT.md or METHODS.md), Done, For other roles, Next step for whoever continues, State of things

### Community 70 - "trend.py"
Cohesion: 0.26
Nodes (12): _clean(), hamed_rao(), mann_kendall(), _mk_fit(), _mk_score_variance(), MkFit, _pairwise_slopes(), _ranks() (+4 more)

### Community 71 - "analyze"
Cohesion: 0.24
Nodes (11): get_series(), hero_metadata(), _json_file(), _npz_file(), regions(), variables(), analyze(), regions() (+3 more)

### Community 72 - "MonthlyChart.tsx"
Cohesion: 0.32
Nodes (9): base, MonthlyChart(), monthlyOptions(), PlotFigure(), PlotFigureProps, SeriesChart(), seriesColors, yearlyOptions() (+1 more)

### Community 73 - "package.json"
Cohesion: 0.14
Nodes (13): allowScripts, esbuild@0.28.2, react-globe.gl@^2.38.0, openapi-typescript@^7.13.0, @tailwindcss/turbopack@4.3.3, engines, node, name (+5 more)

### Community 74 - "LeadStep.tsx"
Cohesion: 0.32
Nodes (9): availableHere(), CaseControls, clampPeriod(), LeadStep(), Props, StepProps, Region, Variable (+1 more)

### Community 75 - "test_trend.py"
Cohesion: 0.26
Nodes (8): ols_ar1(), OlsFit, test_constant_series(), test_hamed_rao_matches_pymannkendall(), test_known_slope_recovered(), test_mk_matches_pymannkendall(), test_ols_matches_linregress_when_phi_zero(), test_sen_matches_pymannkendall_slope()

### Community 76 - "Review focus"
Cohesion: 0.17
Nodes (11): Command(), Done when (whole plan), Frontend Shell, Globe & Infra Implementation Plan (Eleder, Claude Code), Global constraints, Review focus, Task 3: Design direction + tokens + shell (H2–H4), Task 4: Globe: render, layers, select, hover, search (H4–H8), Task 5: Trend map colouring + legend (H8–H12) (+3 more)

### Community 77 - "6. PLAN DE IMPLEMENTACIÓN — ejecuta las Tasks 1–9 oficiales"
Cohesion: 0.18
Nodes (11): 6. PLAN DE IMPLEMENTACIÓN — ejecuta las Tasks 1–9 oficiales, A. Partner chat con tool use, B. Correlación, Mirror, years meter y predict-before-reveal, C. Tours de los tres casos de demostración, TASK 1 — Panel shell y contenedor de gráficas (`PlotFigure`), TASK 2 — Flujo de investigación Lead / Scene / Timeline, TASK 3 — Evidence: visualizaciones científicas y Verdict, TASK 4 — Infraestructura del partner: SSE, herramientas auxiliares y comprobación de números (+3 more)

### Community 78 - "StepSection.tsx"
Cohesion: 0.31
Nodes (6): StepSection(), Alert(), AlertDescription(), alertVariants, Skeleton(), CaseStep

### Community 79 - "ui-store.ts"
Cohesion: 0.20
Nodes (9): Focus, Highlight, HighlightKind, NO_HIGHLIGHT, initial, UiState, useUiStore, zustand@^5.1.0 (+1 more)

### Community 81 - "TrendMapRequest"
Cohesion: 0.28
Nodes (4): CorrelateRequest, _months_are_contiguous(), ScanRequest, TrendMapRequest

### Community 82 - "coder-c · Task 2 controls · H3.2"
Cohesion: 0.29
Nodes (6): coder-c · Task 2 controls · H3.2, Decisions made, Done, For other roles, Next step for whoever continues, State of things

### Community 83 - "coder-c · Task 3 Evidence + Verdict · H3.4"
Cohesion: 0.29
Nodes (6): coder-c · Task 3 Evidence + Verdict · H3.4, Decisions made, Done, For other roles, Next step for whoever continues, State of things

### Community 84 - "Review focus"
Cohesion: 0.29
Nodes (7): Review focus, Task 3: Evidence charts + verdict card (H5–H8, the M1 checkpoint), Task 5: Explain mode (H10–H14, M2), Task 6: Partner chat with tools (H14–H18), Task 7: Correlation, mirror, years meter, predict-before-reveal (H14–H18), Task 8: Guided tours (H16–H18), Task 9: Demo explanations, eval harness, E2E (H22–H26)

### Community 85 - "CasePanel"
Cohesion: 0.40
Nodes (5): Home(), CasePanel(), setup(), Task 1: Scaffold, deps, CI, deploy (H0.5–H1.5, merged before anyone branches), Task 1: Panel shell + PlotFigure (H0.5–H2, merged at the H2 checkpoint)

### Community 87 - "coder-c · Task 4 verification · H3.5"
Cohesion: 0.40
Nodes (4): coder-c · Task 4 verification · H3.5, Done, Next step for whoever continues, State of things

### Community 88 - "7. Requisitos transversales no negociables"
Cohesion: 0.50
Nodes (4): 7. Requisitos transversales no negociables, Diseño e interacción, Ingeniería y seguridad, Rigor estadístico

### Community 89 - "class-variance-authority"
Cohesion: 0.67
Nodes (3): Badge(), badgeVariants, class-variance-authority

### Community 90 - "TEAM"
Cohesion: 0.50
Nodes (4): How to work with your AI agent, Rhythm, TEAM, Who works with whom

## Knowledge Gaps
- **8 isolated node(s):** `Oier-owned API, pipeline, tests and geo files`, `Data and statistics engine`, `NASA data to reliable regional time series`, `Real analyze, variables and regions endpoints`, `Task 1: contract, stub API and first geometry` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 503 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `correlate()` connect `index.py` to `import_giovanni.py`, `6. PLAN DE IMPLEMENTACIÓN — ejecuta las Tasks 1–9 oficiales`, `Earth Case Files (working name): Hackathon Plan`, `TrendMapRequest`, `Review focus`, `ARCHITECTURE`?**
  _High betweenness centrality (0.264) - this node is a cross-community bridge._
- **What connects `Oier-owned API, pipeline, tests and geo files`, `Data and statistics engine`, `NASA data to reliable regional time series` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.11666666666666667 - nodes in this community are weakly interconnected._
- **Why does `Task 6: Partner chat with tools (H14–H18)` connect `Review focus` to `index.py`, `case-codec.ts`?**
  _High betweenness centrality (0.245) - this node is a cross-community bridge._
- **Should `command.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08253968253968254 - nodes in this community are weakly interconnected._
- **Why does `normalizeCase()` connect `case-codec.ts` to `Review focus`?**
  _High betweenness centrality (0.230) - this node is a cross-community bridge._
- **Should `with` be split into smaller, more focused modules?**
  _Cohesion score 0.09333333333333334 - nodes in this community are weakly interconnected._