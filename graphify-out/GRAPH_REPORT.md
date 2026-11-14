# Graph Report - womm-earth  (2026-11-14)

## Corpus Check
- 212 files · ~109,919 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: .csv 9, (none) 6, .geojson 4)

## Summary
- 1051 nodes · 2320 edges · 79 communities (46 shown, 33 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 66 edges (avg confidence: 0.92)
- Token cost: not tracked for host-agent semantic extraction

## Community Hubs (Navigation)
- Regional data pipeline
- Partner explanations
- Methods and merge docs
- Case state and globe
- Live NASA POWER data
- FastAPI contracts
- Frontend tooling
- Frontend API types
- Trend statistics
- Globe application shell
- React components and tests
- Case panel controls
- Panel tests and analysis
- UI primitives
- Workflow configuration
- Numerical series engine
- JavaScript dependencies
- Python API tests
- Component configuration
- Region search UI
- Golden method validation
- False positive simulation
- Application layout
- Case steps and buttons
- TypeScript configuration
- Evidence and verdict
- Command dialog UI
- Extended golden cases
- Form input components
- Verdict engine
- Package scripts
- Region metadata store
- Select UI components
- Sheet UI components
- Ownership tests
- API contract tests
- UI state store
- Period validation
- ESLint configuration
- Vercel API runtime
- Architecture documentation
- False positive rates
- Agent workflow commands
- Coder C master prompt
- Resize observer mock
- Challenge science context
- Golden case validation
- Data pipeline plan
- Live POWER analysis
- Playwright test setup
- Ownership boundaries
- Variable catalogue
- Verdict grounding rules
- Panel and globe plan
- Tour types
- Python dependencies
- Oier API ownership
- Contract and geometry
- Data and statistics engine
- NASA data resources
- Earth challenge context
- Coder B handoff
- Coder C evidence handoff
- Coder C audit handoff
- Handoff conventions
- Partner panel plan
- Team roles
- Case workspace design
- Methods specification
- Regional data pipeline
- Coder B role
- Pipeline requirements
- Product definition
- Live analysis endpoints
- API contract and geometry plan
- Statistical engine plan
- Advanced endpoints roadmap
- MERRA-2 Zarr spike

## God Nodes (most connected - your core abstractions)
1. `react` - 45 edges
2. `cn` - 26 edges
3. `vitest` - 22 edges
4. `analyze_yearly()` - 21 edges
5. `RegionSearch()` - 19 edges
6. `CasePanelContent()` - 19 edges
7. `radix-ui` - 18 edges
8. `hamed_rao()` - 17 edges
9. `analyze()` - 17 edges
10. `Button()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `test_custom_season_months_must_be_cyclically_contiguous()` --uses--> `CaseRequest`  [INFERRED]
  tests/test_contract.py → api/_models.py
- `test_mirror_requires_exactly_one_region()` --uses--> `MirrorRequest`  [INFERRED]
  tests/test_contract.py → api/_models.py
- `test_trendmap_rejects_invalid_period_and_custom_months()` --uses--> `TrendMapRequest`  [INFERRED]
  tests/test_contract.py → api/_models.py
- `test_health_preserves_python_version()` --uses--> `Health`  [INFERRED]
  tests/test_contract.py → api/_models.py
- `test_power_error_does_not_fall_back_to_local_series()` --uses--> `PowerUpstreamError`  [INFERRED]
  tests/test_api.py → api/_engine/power.py

## Import Cycles
- None detected.

## Communities (79 total, 33 thin omitted)

### Community 0 - "Regional data pipeline"
Cohesion: 0.05
Nodes (38): build(), main(), mask_weights(), preserve_existing_validity(), region_records(), weighted_means(), all_region_features(), country_feature() (+30 more)

### Community 1 - "Partner explanations"
Cohesion: 0.07
Nodes (41): maxDuration, POST(), body, ExplainBox(), Props, StreamedExplanation(), partnerCopy, FALLBACK (+33 more)

### Community 2 - "Methods and merge docs"
Cohesion: 0.05
Nodes (53): Brand brief, App copy, Demo script, Judges Q&A, Project page submission text, Submission checklist, User test script, Handoff procedure (+45 more)

### Community 3 - "Case state and globe"
Cohesion: 0.08
Nodes (45): GlobeView(), prefersReducedMotion(), readTokens(), START_POV, allPoints(), cache, capCache, CapRing (+37 more)

### Community 4 - "Live NASA POWER data"
Cohesion: 0.10
Nodes (19): fetch_monthly_region(), list_monthly_parameters(), _load_monthly_parameters(), _manager_url(), _monthly_region_series(), PowerUpstreamError, _regional_url(), _request_json() (+11 more)

### Community 5 - "FastAPI contracts"
Cohesion: 0.17
Nodes (27): analyze(), correlate(), _fixture(), mirror(), scan(), trendmap(), AnalyzeResponse, CaseRequest (+19 more)

### Community 6 - "Frontend tooling"
Cohesion: 0.08
Nodes (32): allowScripts, esbuild@0.28.2, devDependencies, concurrently@^10.0.7, jsdom@^31.0.1, openapi-typescript@^7.13.0, tailwindcss@4.3.3, @tailwindcss/turbopack@4.3.3 (+24 more)

### Community 7 - "Frontend API types"
Cohesion: 0.06
Nodes (30): CaseRequest, components, CorrelateRequest, CorrelateResponse, $defs, FitPoint, Health, LagPoint (+22 more)

### Community 8 - "Trend statistics"
Cohesion: 0.16
Nodes (20): _clean(), hamed_rao(), mann_kendall(), _mk_fit(), _mk_score_variance(), MkFit, ols_ar1(), OlsFit (+12 more)

### Community 9 - "Globe application shell"
Cohesion: 0.14
Nodes (18): metadata, Home(), Globe(), GlobeStatus(), GlobeView, hasWebGL(), noop(), GlobeArea() (+10 more)

### Community 10 - "React components and tests"
Cohesion: 0.16
Nodes (17): base, MonthlyChart(), monthlyOptions(), PlotFigure(), PlotFigureProps, observers, SeriesChart(), seriesColors (+9 more)

### Community 11 - "Case panel controls"
Cohesion: 0.20
Nodes (20): CasePanelContent(), availableHere(), CaseControls, clampPeriod(), contiguousMonths(), EvidenceStep(), LeadStep(), Props (+12 more)

### Community 12 - "Panel tests and analysis"
Cohesion: 0.13
Nodes (12): loadRegions(), useRegionIndex(), Snapshot, useAnalysis(), createCatalogHook(), useCatalog, useRegions(), useCatalog (+4 more)

### Community 13 - "UI primitives"
Cohesion: 0.13
Nodes (10): Badge(), badgeVariants, ScrollArea(), ScrollBar(), ToggleGroupContext, Toggle(), toggleVariants, class-variance-authority (+2 more)

### Community 14 - "Workflow configuration"
Cohesion: 0.09
Nodes (24): runs-on, steps, concurrency, cancel-in-progress, group, jobs, api, web (+16 more)

### Community 15 - "Numerical series engine"
Cohesion: 0.16
Nodes (14): _month_index(), monthly_with_anomalies(), yearly_series(), test_annual_requires_10_months(), test_custom_wrap_ndj(), test_djf_assigns_december_to_next_year(), test_djf_drops_incomplete_edges(), test_monthly_anomalies_use_selected_period_climatology() (+6 more)

### Community 16 - "JavaScript dependencies"
Cohesion: 0.08
Nodes (24): dependencies, @anthropic-ai/sdk@^1.8.0, class-variance-authority@^0.7.1, cmdk@^1.1.1, cn@^0.5.2, lucide-react@^1.73.0, @observablehq/plot@^0.6.19, openapi-fetch@^0.17.0 (+16 more)

### Community 17 - "Python API tests"
Cohesion: 0.14
Nodes (11): main(), case(), data_dir(), power_api(), request(), test_analyze_too_short(), test_analyze_uses_fresh_power_series(), test_case_cli_prints_stats_and_json() (+3 more)

### Community 18 - "Component configuration"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 19 - "Region search UI"
Cohesion: 0.16
Nodes (14): GROUPS, RegionSearch(), choose(), Command(), CommandEmpty(), CommandGroup(), CommandInput(), CommandItem() (+6 more)

### Community 20 - "Golden method validation"
Cohesion: 0.12
Nodes (13): acf_biased(), build_yearly_cases(), cross_check(), find_seed(), fnum(), gen_ar1(), hamed_rao_factor(), main() (+5 more)

### Community 21 - "False positive simulation"
Cohesion: 0.20
Nodes (16): analyse(), mk_score(), mk_var(), ols_block(), p_two_sided(), pair_slopes(), tie_groups(), years_needed() (+8 more)

### Community 22 - "Application layout"
Cohesion: 0.12
Nodes (13): azeretMono, barlow, barlowCondensed, metadata, RootLayout(), Toaster(), TooltipProvider(), next-themes@^0.4.6 (+5 more)

### Community 23 - "Case steps and buttons"
Cohesion: 0.21
Nodes (12): SceneStep(), StepSection(), TimelineStep(), Alert(), AlertDescription(), alertVariants, Button(), buttonVariants (+4 more)

### Community 24 - "TypeScript configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 25 - "Evidence and verdict"
Cohesion: 0.32
Nodes (12): Props, StatsTable(), VerdictStep(), fmtNumber(), fmtP(), fmtSlope(), renderVerdict(), base (+4 more)

### Community 26 - "Command dialog UI"
Cohesion: 0.26
Nodes (9): CommandDialog(), Dialog(), DialogContent(), DialogDescription(), DialogHeader(), DialogOverlay(), DialogPortal(), DialogTitle() (+1 more)

### Community 27 - "Extended golden cases"
Cohesion: 0.22
Nodes (8): aggregate(), bh(), build(), build_golden_08(), build_golden_09(), label_pairs(), make_monthly(), mirrors()

### Community 28 - "Form input components"
Cohesion: 0.23
Nodes (9): InputGroup(), InputGroupAddon(), inputGroupAddonVariants, InputGroupButton(), inputGroupButtonVariants, InputGroupInput(), InputGroupTextarea(), Input() (+1 more)

### Community 29 - "Verdict engine"
Cohesion: 0.29
Nodes (9): analyze_yearly(), tier_for(), years_until_significant(), FitPoint, Mk, Ols, Sen, TrendStats (+1 more)

### Community 30 - "Package scripts"
Cohesion: 0.17
Nodes (12): scripts, build, check, dev, dev:api, dev:web, gen:types, lint (+4 more)

### Community 31 - "Region metadata store"
Cohesion: 0.31
Nodes (6): get_series(), hero_metadata(), _json_file(), _npz_file(), regions(), variables()

### Community 32 - "Select UI components"
Cohesion: 0.22
Nodes (3): SelectContent(), SelectScrollDownButton(), SelectScrollUpButton()

### Community 33 - "Sheet UI components"
Cohesion: 0.22
Nodes (3): SheetContent(), SheetOverlay(), SheetPortal()

### Community 34 - "Ownership tests"
Cohesion: 0.27
Nodes (7): minimatch@^11.0.8, minimatch, main(), outsideArea(), OWNERS, parseAreas(), areas

### Community 35 - "API contract tests"
Cohesion: 0.20
Nodes (6): test_contract_fixtures_validate(), test_custom_season_months_must_be_cyclically_contiguous(), test_health_preserves_python_version(), test_invalid_trendmap_and_mirror_requests_return_422(), test_mirror_requires_exactly_one_region(), test_trendmap_rejects_invalid_period_and_custom_months()

### Community 37 - "UI state store"
Cohesion: 0.25
Nodes (6): Focus, Highlight, HighlightKind, NO_HIGHLIGHT, initial, UiState

### Community 39 - "ESLint configuration"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint@^9, eslint-config-next@16.4.6, eslint, eslint-config-next

### Community 40 - "Vercel API runtime"
Cohesion: 0.33
Nodes (5): excludeFiles, includeFiles, functions, api/index.py, $schema

### Community 41 - "Architecture documentation"
Cohesion: 0.40
Nodes (4): Cited process cards for physical explanations, Live NASA POWER case analysis, Technical architecture, Coder C Explain handoff

### Community 42 - "False positive rates"
Cohesion: 0.40
Nodes (5): AR(1)-noise no-trend scenario, False-positive rate in 1,000 no-trend series: ordinary Mann–Kendall 5.1% (white noise) and 31.2% (AR(1)); Hamed–Rao 9.7% and 24.6%; nominal alpha 5%, Hamed–Rao corrected Mann–Kendall test, Ordinary Mann–Kendall test, White-noise no-trend scenario

### Community 43 - "Agent workflow commands"
Cohesion: 0.50
Nodes (4): Claude Code project instructions, Slash commands delegate to shared resume and handoff processes, Handoff slash command, Resume slash command

### Community 44 - "Coder C master prompt"
Cohesion: 0.50
Nodes (3): Canonical URL case state, Coder C implementation master prompt, Coder C controls handoff

### Community 46 - "Challenge science context"
Cohesion: 0.67
Nodes (3): NASA challenge explanation, Nonsignificance does not mean no change, Wisconsin MODIS Aqua AOD example

### Community 48 - "Data pipeline plan"
Cohesion: 0.67
Nodes (3): Data & Stats Engine Implementation Plan, Regional trend statistics and verdict pipeline, Earth Case Files design spec

### Community 49 - "Live POWER analysis"
Cohesion: 0.67
Nodes (3): NASA POWER Live Analysis Implementation Plan, NASA POWER live analysis design, Request-time NASA POWER monthly regional data

## Ambiguous Edges - Review These
- `GitHub requires green web and api checks before code merges` → `Only Eleder may bypass for P0 or to unblock a fix PR, with STATUS notice`  [AMBIGUOUS]
  docs/STATUS.md · relation: conceptually_related_to

## Knowledge Gaps
- **74 isolated node(s):** `Handoff procedure`, `Coder C Evidence Verdict handoff`, `Earth Case Files product definition`, `Live NASA POWER case analysis`, `Coder C Explain handoff` (+69 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 360 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `React components and tests` to `Select UI components`, `Partner explanations`, `Sheet UI components`, `Case state and globe`, `Card UI components`, `Frontend tooling`, `Globe application shell`, `Case panel controls`, `Panel tests and analysis`, `UI primitives`, `JavaScript dependencies`, `Region search UI`, `Application layout`, `Case steps and buttons`, `Command dialog UI`, `Form input components`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **What connects `Handoff procedure`, `Coder C Evidence Verdict handoff`, `Earth Case Files product definition` to the rest of the system?**
  _74 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Regional data pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.05171907140758154 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `React components and tests` to `Partner explanations`, `Ownership tests`, `Case state and globe`, `UI state store`, `Frontend tooling`, `Panel tests and analysis`, `Region search UI`, `Evidence and verdict`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `Partner explanations` be split into smaller, more focused modules?**
  _Cohesion score 0.06760316066725197 - nodes in this community are weakly interconnected._
- **Why does `cn` connect `UI primitives` to `Select UI components`, `Sheet UI components`, `Card UI components`, `Frontend tooling`, `Case panel controls`, `JavaScript dependencies`, `Region search UI`, `Application layout`, `Case steps and buttons`, `Command dialog UI`, `Form input components`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `GitHub requires green web and api checks before code merges` and `Only Eleder may bypass for P0 or to unblock a fix PR, with STATUS notice`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._