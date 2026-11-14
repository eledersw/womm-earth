# Graph Report - womm-earth (2026-11-14)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 690 nodes · 958 edges · 70 communities (50 shown, 20 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Code indexed from worktree commit: `7fb3272b` (`oier/contract-v1`); project docs from baseline `9628b028`.
- This snapshot combines the code graph with Oier/Coder B responsibilities extracted from the project Markdown files.
- Rerun Graphify after source changes to refresh the snapshot.

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
- package.json
- scripts
- Oier · Coder B
- layout.tsx
- select.tsx
- Earth Case Files (working name): Hackathon Plan
- sonner.tsx
- eslint.config.mjs
- api-types.ts
- api/index.py
- CasePanel
- METHODS: statistics spec (source of truth for `api/_engine/`)
- Task 2: Lead, Scene, Timeline wired to case state (H2–H5)
- @playwright/test
- PROJECT PAGE (submission text)
- TEAM.md
- PROCESS CARDS
- Review focus
- input-group.tsx
- ARCHITECTURE
- BRAND BRIEF
- COPY: every word in the app
- PROJECT: Earth Case Files (working name)
- Earth Case Files: NASA Space Apps 2026 (team WOMM)
- Review focus
- Playbook: Lead / integrator (Eleder, Claude Code)
- DEMO SCRIPT
- MERGING: branches, PRs and integration checkpoints
- DEMO CASES
- LIMITATIONS
- cn
- toggle-group.tsx
- STATUS: live board
- alert.tsx
- tabs.tsx
- Resources: NASA Space Apps 2026 - "Be An Earth System Trend Detective!"
- USER TEST
- Golden cases: the engine's answer key
- VERDICT TEMPLATES and partner grounding rules
- pull_request_template.md
- DATA CATALOG
- Handoff procedure (end of every session)
- Playbook: Story & Submission lead
- vitest
- Handoffs
- CLAUDE.md
- JUDGES_QA.md
- SUBMISSION_CHECKLIST.md
- process/resume.md
- EVAL.md
- three@^0.187.0
- jsdom@^31.0.1
- @testing-library/react@^16.3.3

## God Nodes (most connected - your core abstractions)
1. `cn` - 26 edges
2. `react` - 24 edges
3. `METHODS: statistics spec (source of truth for `api/_engine/`)` - 19 edges
4. `radix-ui` - 18 edges
5. `Earth Case Files (working name): Hackathon Plan` - 17 edges
6. `compilerOptions` - 16 edges
7. `Task 2: Seams: case codec, URL hook, UI store, API client (TDD; merged at the H2 checkpoint, after Oier's contract)` - 14 edges
8. `test_stub_endpoints_match_contract_fixtures()` - 12 edges
9. `scripts` - 12 edges
10. `PROJECT PAGE (submission text)` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Claude integration` --references--> `correlate()`  [INFERRED]
  docs/ARCHITECTURE.md → api/index.py
- `Task 6: Partner chat with tools (H14–H18)` --references--> `correlate()`  [INFERRED]
  docs/superpowers/plans/2026-11-14-partner-panel.md → api/index.py
- `Claude integration (Coder C)` --references--> `correlate()`  [INFERRED]
  docs/superpowers/specs/2026-11-14-earth-case-files-design.md → api/index.py
- `Task 1: Scaffold, deps, CI, deploy (H0.5–H1.5, merged before anyone branches)` --references--> `CasePanel()`  [INFERRED]
  docs/superpowers/plans/2026-11-14-frontend-shell.md → components/panel/CasePanel.tsx
- `Task 1: Panel shell + PlotFigure (H0.5–H2, merged at the H2 checkpoint)` --references--> `CasePanel()`  [INFERRED]
  docs/superpowers/plans/2026-11-14-partner-panel.md → components/panel/CasePanel.tsx

## Import Cycles
- None detected.

## Communities (70 total, 20 thin omitted)

### Community 0 - "_models.py"
Cohesion: 0.07
Nodes (48): analyze(), correlate(), _fixture(), health(), mirror(), regions(), scan(), trendmap() (+40 more)

### Community 1 - "react"
Cohesion: 0.23
Nodes (4): Badge(), badgeVariants, radix-ui, react

### Community 2 - "command.tsx"
Cohesion: 0.08
Nodes (20): Button(), buttonVariants, CommandDialog(), CommandInput(), Dialog(), DialogContent(), DialogDescription(), DialogFooter() (+12 more)

### Community 3 - "with"
Cohesion: 0.09
Nodes (24): runs-on, steps, concurrency, cancel-in-progress, group, jobs, api, web (+16 more)

### Community 4 - "export_geo.py"
Cohesion: 0.14
Nodes (13): country_feature(), export_countries(), _fetch(), _from_geojson(), _from_shapefile(), load_countries(), main(), _point_segment_distance() (+5 more)

### Community 5 - "devDependencies"
Cohesion: 0.10
Nodes (21): devDependencies, concurrently@^10.0.7, minimatch@^11.0.8, openapi-typescript@^7.13.0, tailwindcss@4.3.3, @tailwindcss/turbopack@4.3.3, tsx@^4.23.15, @types/node@^22.20.5 (+13 more)

### Community 6 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 7 - "dependencies"
Cohesion: 0.09
Nodes (23): dependencies, @anthropic-ai/sdk@^1.8.0, class-variance-authority@^0.7.1, cmdk@^1.1.1, cn@^0.5.2, nuqs@^2.10.3, radix-ui@^1.8.1, react@19.3.0 (+15 more)

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 9 - "check-ownership.mjs"
Cohesion: 0.36
Nodes (5): main(), outsideArea(), OWNERS, parseAreas(), areas

### Community 10 - "package.json"
Cohesion: 0.14
Nodes (13): allowScripts, esbuild@0.28.2, @observablehq/plot@^0.6.19, openapi-fetch@^0.17.0, @types/three@^0.187.0, engines, node, name (+5 more)

### Community 11 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, check, dev, dev:api, dev:web, gen:types, lint (+4 more)

### Community 12 - "Oier · Coder B"
Cohesion: 0.18
Nodes (11): Oier-owned API, pipeline, tests and geo files, Contract v1, stub API, countries geometry, Data and statistics engine, METHODS.md statistical specification, NASA data to reliable regional time series, Oier · Coder B, Real analyze, variables and regions endpoints, Task 1: contract, stub API and first geometry (+3 more)

### Community 13 - "layout.tsx"
Cohesion: 0.15
Nodes (8): geistMono, geistSans, metadata, RootLayout(), TooltipProvider(), nextConfig, next@16.4.6, next

### Community 14 - "select.tsx"
Cohesion: 0.22
Nodes (3): SelectContent(), SelectScrollDownButton(), SelectScrollUpButton()

### Community 15 - "Earth Case Files (working name): Hackathon Plan"
Cohesion: 0.09
Nodes (22): Architecture and repo layout, Claude integration (Coder C), Coder B: data & stats engine, Coder C: panel, charts & partner, Context, Data pipeline (Coder B; spike in H1, finished by H6), Design approach (avoid the "vibe-coded" look), Earth Case Files (working name): Hackathon Plan (+14 more)

### Community 16 - "sonner.tsx"
Cohesion: 0.33
Nodes (4): next-themes@^0.4.6, sonner@^2.0.8, next-themes, sonner

### Community 17 - "eslint.config.mjs"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint@^9, eslint-config-next@16.4.6, eslint, eslint-config-next

### Community 18 - "api-types.ts"
Cohesion: 0.33
Nodes (5): components, $defs, operations, paths, webhooks

### Community 19 - "api/index.py"
Cohesion: 0.33
Nodes (5): excludeFiles, includeFiles, functions, api/index.py, $schema

### Community 20 - "CasePanel"
Cohesion: 0.60
Nodes (3): Home(), CasePanel(), Task 1: Panel shell + PlotFigure (H0.5–H2, merged at the H2 checkpoint)

### Community 21 - "METHODS: statistics spec (source of truth for `api/_engine/`)"
Cohesion: 0.10
Nodes (19): 10. Years until significant, 11. Reporting magnitude, 12. Correlation between two variables, 13. Mirror rule, 14. Many regions at once: trend-map dots and the scanner, 15. Change point (Could), 16. Assumptions and limitations, 1. Regional averaging (fixed by the pipeline; for reference only) (+11 more)

### Community 22 - "Task 2: Lead, Scene, Timeline wired to case state (H2–H5)"
Cohesion: 0.33
Nodes (5): maxDuration, POST(), Slider(), ToggleGroup(), Task 2: Lead, Scene, Timeline wired to case state (H2–H5)

### Community 24 - "PROJECT PAGE (submission text)"
Cohesion: 0.15
Nodes (12): How it works, How we used AI, Impact, NASA data used, One-line summary, PROJECT PAGE (submission text), Statistical rigour (Methods lead), Team (+4 more)

### Community 25 - "TEAM.md"
Cohesion: 0.15
Nodes (10): If you're blocked, Playbook: Coder C, panel, charts & partner (Ekaitz, Codex), Timeline, If you're blocked, Playbook: Methods & Validity lead (statistician), Steps, How to work with your AI agent, Rhythm (+2 more)

### Community 26 - "PROCESS CARDS"
Cohesion: 0.17
Nodes (11): aral-irrigation: Irrigation and the shrinking Aral Sea, arctic-amplification: Why the Arctic warms faster, natural-variability: Natural variability and El Niño (why short records often aren't significant), PROCESS CARDS, sahel-recovery: The Sahel's rainfall recovery since the 1980s drought, smoke-aod: Wildfire smoke and aerosol optical depth, snow-albedo: Snow-albedo feedback, subtropical-drying: Hadley-cell expansion and drier subtropics (+3 more)

### Community 27 - "Review focus"
Cohesion: 0.18
Nodes (10): Case Panel, Charts & Claude Partner Implementation Plan (Ekaitz, Codex), Done when (whole plan), Review focus, Task 3: Evidence charts + verdict card (H5–H8, the M1 checkpoint), Task 4: SSE helpers + number check (H8–H10), Task 5: Explain mode (H10–H14, M2), Task 6: Partner chat with tools (H14–H18), Task 7: Correlation, mirror, years meter, predict-before-reveal (H14–H18) (+2 more)

### Community 28 - "input-group.tsx"
Cohesion: 0.31
Nodes (6): InputGroupButton(), inputGroupButtonVariants, InputGroupInput(), InputGroupTextarea(), Input(), Textarea()

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

### Community 34 - "Review focus"
Cohesion: 0.22
Nodes (9): Command(), Review focus, Task 1: Scaffold, deps, CI, deploy (H0.5–H1.5, merged before anyone branches), Task 3: Design direction + tokens + shell (H2–H4), Task 4: Globe: render, layers, select, hover, search (H4–H8), Task 5: Trend map colouring + legend (H8–H12), Task 6: Mirror arcs, tour fly-to, predict hide (H14–H18), Task 7: E2E infra + globe/smoke specs (H12–H14, extended at H22) (+1 more)

### Community 35 - "Playbook: Lead / integrator (Eleder, Claude Code)"
Cohesion: 0.22
Nodes (7): If you're blocked, Playbook: Lead / integrator (Eleder, Claude Code), Timeline, Your merge duties (see MERGING.md), Done when (whole plan), Frontend Shell, Globe & Infra Implementation Plan (Eleder, Claude Code), Global constraints

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

### Community 42 - "cn"
Cohesion: 0.33
Nodes (3): ScrollArea(), ScrollBar(), cn

### Community 43 - "toggle-group.tsx"
Cohesion: 0.48
Nodes (5): ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants, class-variance-authority

### Community 44 - "STATUS: live board"
Cohesion: 0.29
Nodes (6): Blockers, Checkpoints, Clock (H0 = Sat 12:00), Milestones, STATUS: live board, Workstreams

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

### Community 53 - "DATA CATALOG"
Cohesion: 0.50
Nodes (3): Attribution list (for the About page and project page), DATA CATALOG, Variables

### Community 54 - "Handoff procedure (end of every session)"
Cohesion: 0.50
Nodes (3): Handoff procedure (end of every session), Steps, Where to make the edits

### Community 55 - "Playbook: Story & Submission lead"
Cohesion: 0.50
Nodes (3): If you're blocked, Playbook: Story & Submission lead, Steps

## Knowledge Gaps
- **8 isolated node(s):** `Oier-owned API, pipeline, tests and geo files`, `Data and statistics engine`, `NASA data to reliable regional time series`, `Real analyze, variables and regions endpoints`, `Task 1: contract, stub API and first geometry` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 370 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Review focus` connect `Review focus` to `_models.py`, `Playbook: Lead / integrator (Eleder, Claude Code)`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **What connects `Oier-owned API, pipeline, tests and geo files`, `Data and statistics engine`, `NASA data to reliable regional time series` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `_models.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06801093643198906 - nodes in this community are weakly interconnected._
- **Why does `Review focus` connect `Review focus` to `CasePanel`, `Task 2: Lead, Scene, Timeline wired to case state (H2–H5)`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Should `command.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08250355618776671 - nodes in this community are weakly interconnected._
- **Why does `Command()` connect `Review focus` to `command.tsx`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Should `with` be split into smaller, more focused modules?**
  _Cohesion score 0.09333333333333334 - nodes in this community are weakly interconnected._
