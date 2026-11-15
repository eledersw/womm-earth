# Graph Report - womm-earth  (2026-11-15)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1257 nodes · 3444 edges · 60 communities (51 shown, 9 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 110 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4a5e35e4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59

## God Nodes (most connected - your core abstractions)
1. `react` - 57 edges
2. `vitest` - 37 edges
3. `analyze_yearly()` - 34 edges
4. `Region` - 26 edges
5. `cn` - 26 edges
6. `fetch_monthly_region()` - 25 edges
7. `Button()` - 25 edges
8. `Variable` - 24 edges
9. `CasePanelContent()` - 24 edges
10. `PowerUpstreamError` - 23 edges

## Surprising Connections (you probably didn't know these)
- `map_family()` --calls--> `MapRecord`  [INFERRED]
  tests/test_contract.py → api/_engine/map.py
- `test_custom_season_months_must_be_cyclically_contiguous()` --uses--> `CaseRequest`  [INFERRED]
  tests/test_contract.py → api/_models.py
- `test_health_preserves_python_version()` --uses--> `Health`  [INFERRED]
  tests/test_contract.py → api/_models.py
- `test_mirror_requires_exactly_one_region()` --uses--> `MirrorRequest`  [INFERRED]
  tests/test_contract.py → api/_models.py
- `test_trendmap_rejects_invalid_period_and_custom_months()` --uses--> `TrendMapRequest`  [INFERRED]
  tests/test_contract.py → api/_models.py

## Import Cycles
- None detected.

## Communities (60 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (68): GlobeView(), prefersReducedMotion(), readTokens(), START_POV, TIER_WORD, CentroidIndex, highlightIds(), MirrorArc (+60 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (36): About(), metadata, Section(), SOURCES, TIERS, headline, metadata, mono (+28 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (29): acf_biased(), analyse(), build_yearly_cases(), cross_check(), find_seed(), fnum(), gen_ar1(), hamed_rao_factor() (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (26): _axis_tiles(), _country_geometries(), fetch_monthly_region(), fetch(), _inside_country(), _load_monthly_parameters(), _manager_url(), _monthly_region_series() (+18 more)

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (30): list_monthly_parameters(), regions(), analyze(), correlate(), health(), mirror(), regions(), scan() (+22 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (33): loadRegions(), Snapshot, api, AnalyzeResponse, CaseRequest, components, CorrelateRequest, CorrelateResponse (+25 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (24): cells(), evalMain(), contextFor(), escapeCell(), EvalQuestion, EvalResult, evaluateQuestion(), formatEvalReport() (+16 more)

### Community 7 - "Community 7"
Cohesion: 0.16
Nodes (27): displayUnit(), CasePanelContent(), noSubscribe(), Pane(), availableHere(), LeadStep(), SceneStep(), TimelineStep() (+19 more)

### Community 8 - "Community 8"
Cohesion: 0.14
Nodes (24): CaseControls, contiguousMonths(), EvidenceStep(), MonthlyChart, Props, SeriesChart, Props, StepProps (+16 more)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (19): _clean(), hamed_rao(), mann_kendall(), _mk_fit(), _mk_score_variance(), MkFit, OlsFit, _pairwise_slopes() (+11 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (20): one(), one(), ols_ar1(), analyze_yearly(), tier_for(), years_until_significant(), FitPoint, Mk (+12 more)

### Community 11 - "Community 11"
Cohesion: 0.16
Nodes (15): bh(), build_family(), family_for(), MapRecord, select_mirrors(), _point_url(), _regional_url(), build_scan() (+7 more)

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (8): Badge(), badgeVariants, ScrollArea(), ScrollBar(), class-variance-authority, cn, radix-ui, react

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (16): country_feature(), export_countries(), export_remaining(), _fetch(), _from_geojson(), _from_shapefile(), load_50m_sources(), load_admin1_sources() (+8 more)

### Community 14 - "Community 14"
Cohesion: 0.11
Nodes (7): base, setup(), regionFixtures, makeTools(), normalized(), setup(), vitest

### Community 15 - "Community 15"
Cohesion: 0.16
Nodes (12): main(), parse_giovanni(), convert_catalog(), _last_year(), main(), test_catalog_includes_only_confirmed_rows_and_uses_data_end_year(), test_catalog_reports_bad_in_store_row_by_name(), test_catalog_reports_unrecognized_status_by_name() (+4 more)

### Community 16 - "Community 16"
Cohesion: 0.16
Nodes (21): CaseState, caseToQuery(), cyclicRun(), DEFAULT_CASE, encode(), isLevel(), isSeason(), MAX_REGIONS (+13 more)

### Community 17 - "Community 17"
Cohesion: 0.09
Nodes (24): runs-on, steps, concurrency, cancel-in-progress, group, jobs, api, web (+16 more)

### Community 18 - "Community 18"
Cohesion: 0.15
Nodes (17): input, conciseExplanation(), streamExplain(), ExplainInput, explainInputSchema, kind, number, p (+9 more)

### Community 19 - "Community 19"
Cohesion: 0.19
Nodes (13): compare(), load(), main(), actual_fields(), archive_case(), check_production_case(), clean(), expected_fields() (+5 more)

### Community 20 - "Community 20"
Cohesion: 0.21
Nodes (16): correlate_anomalies(), Correlation, _detrend(), _lag1(), _n_eff(), _p_value(), _pair(), _pearson() (+8 more)

### Community 21 - "Community 21"
Cohesion: 0.19
Nodes (13): _month_index(), monthly_with_anomalies(), yearly_series(), close(), test_bh_golden(), test_monthly_golden(), test_yearly_golden(), test_annual_requires_10_months() (+5 more)

### Community 22 - "Community 22"
Cohesion: 0.16
Nodes (15): GROUPS, RegionSearch(), choose(), useRegionIndex(), useRegionToggle(), Command(), CommandEmpty(), CommandGroup() (+7 more)

### Community 23 - "Community 23"
Cohesion: 0.19
Nodes (20): clampPeriod(), axisAngle(), Cell, cellFor(), MAX_VARIABLES, MIN_REGIONS, MIN_VARIABLES, pointFor() (+12 more)

### Community 24 - "Community 24"
Cohesion: 0.09
Nodes (8): test_contract_fixtures_validate(), test_custom_season_months_must_be_cyclically_contiguous(), test_health_preserves_python_version(), test_invalid_trendmap_and_mirror_requests_return_422(), test_live_and_remaining_stub_endpoints_match_contract(), map_family(), test_mirror_requires_exactly_one_region(), test_trendmap_rejects_invalid_period_and_custom_months()

### Community 25 - "Community 25"
Cohesion: 0.20
Nodes (15): RegionAnalysis, EvidencePeriod, inspectEvidence(), METHOD, base, tierFor(), validP(), fmtSlope() (+7 more)

### Community 26 - "Community 26"
Cohesion: 0.13
Nodes (10): build(), main(), mask_weights(), preserve_existing_validity(), region_records(), weighted_means(), admin1_region_features(), all_region_features() (+2 more)

### Community 27 - "Community 27"
Cohesion: 0.19
Nodes (16): maxDuration, POST(), serverApi(), FALLBACK, getClient(), MODEL, ChatInput, chatInputSchema (+8 more)

### Community 28 - "Community 28"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 29 - "Community 29"
Cohesion: 0.19
Nodes (15): CorrelationChart, CorrelationView(), LiveCorrelationView(), Props, result, state, Props, StatsTable() (+7 more)

### Community 30 - "Community 30"
Cohesion: 0.09
Nodes (22): dependencies, @anthropic-ai/sdk@^1.8.0, class-variance-authority@^0.7.1, cn@^0.5.2, lucide-react@^1.73.0, nuqs@^2.10.3, openapi-fetch@^0.17.0, radix-ui@^1.8.1 (+14 more)

### Community 31 - "Community 31"
Cohesion: 0.16
Nodes (12): CorrelationChart(), MonthlyChart(), monthlyOptions(), PlotFigure(), PlotFigureProps, observers, ResizeObserverMock, SeriesChart() (+4 more)

### Community 32 - "Community 32"
Cohesion: 0.10
Nodes (21): devDependencies, concurrently@^10.0.7, jsdom@^31.0.1, minimatch@^11.0.8, openapi-typescript@^7.13.0, @playwright/test@^1.65.1, @tailwindcss/turbopack@4.3.3, @types/react@^19 (+13 more)

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (12): main(), case(), data_dir(), power_api(), request(), test_analyze_too_short(), test_analyze_uses_fresh_power_series(), test_case_cli_prints_stats_and_json() (+4 more)

### Community 34 - "Community 34"
Cohesion: 0.21
Nodes (10): body, partnerCopy, MAX_EVENT_BYTES, PartnerEvent, partnerEventSchema, input, mockStream(), readSse() (+2 more)

### Community 35 - "Community 35"
Cohesion: 0.20
Nodes (8): get_json(), main(), probe(), main(), run(), load(), main(), run_candidate()

### Community 36 - "Community 36"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 37 - "Community 37"
Cohesion: 0.23
Nodes (10): CommandDialog(), Dialog(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogPortal() (+2 more)

### Community 38 - "Community 38"
Cohesion: 0.22
Nodes (8): aggregate(), bh(), build(), build_golden_08(), build_golden_09(), label_pairs(), make_monthly(), mirrors()

### Community 39 - "Community 39"
Cohesion: 0.14
Nodes (13): allowScripts, esbuild@0.28.2, cmdk@^1.1.1, tsx@^4.23.15, @types/node@^22.20.5, engines, node, name (+5 more)

### Community 40 - "Community 40"
Cohesion: 0.23
Nodes (9): InputGroup(), InputGroupAddon(), inputGroupAddonVariants, InputGroupButton(), inputGroupButtonVariants, InputGroupInput(), InputGroupTextarea(), Input() (+1 more)

### Community 41 - "Community 41"
Cohesion: 0.18
Nodes (10): MAX_LOOKUPS_PER_QUESTION, caseFields, DATA_TOOLS, id, months, period, season, year (+2 more)

### Community 42 - "Community 42"
Cohesion: 0.17
Nodes (12): scripts, build, check, dev, dev:api, dev:web, gen:types, lint (+4 more)

### Community 43 - "Community 43"
Cohesion: 0.31
Nodes (6): admin1_geometries(), get_series(), hero_metadata(), _json_file(), _npz_file(), variables()

### Community 44 - "Community 44"
Cohesion: 0.22
Nodes (3): SelectContent(), SelectScrollDownButton(), SelectScrollUpButton()

### Community 45 - "Community 45"
Cohesion: 0.22
Nodes (3): SheetContent(), SheetOverlay(), SheetPortal()

### Community 46 - "Community 46"
Cohesion: 0.42
Nodes (5): addBySearch(), mockApi(), openCase(), regionsInUrl(), @playwright/test

### Community 47 - "Community 47"
Cohesion: 0.29
Nodes (5): base, context, createCatalogHook(), @testing-library/react@^16.3.3, @testing-library/react

### Community 49 - "Community 49"
Cohesion: 0.43
Nodes (5): Block, blocks(), GaiaText(), inline(), Item

### Community 52 - "Community 52"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint@^9, eslint-config-next@16.4.6, eslint, eslint-config-next

### Community 54 - "Community 54"
Cohesion: 0.33
Nodes (5): excludeFiles, includeFiles, functions, api/index.py, $schema

## Knowledge Gaps
- **1 isolated node(s):** `PATH`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 358 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Community 12` to `Community 0`, `Community 1`, `Community 5`, `Community 7`, `Community 8`, `Community 16`, `Community 18`, `Community 22`, `Community 23`, `Community 29`, `Community 30`, `Community 31`, `Community 37`, `Community 39`, `Community 40`, `Community 44`, `Community 45`, `Community 47`, `Community 48`, `Community 49`, `Community 51`, `Community 55`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **What connects `PATH` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.050140056022408966 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `Community 14` to `Community 0`, `Community 1`, `Community 34`, `Community 32`, `Community 5`, `Community 6`, `Community 39`, `Community 47`, `Community 16`, `Community 49`, `Community 18`, `Community 22`, `Community 23`, `Community 25`, `Community 27`, `Community 29`, `Community 31`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06848357791754019 - nodes in this community are weakly interconnected._
- **Why does `scripts` connect `Community 42` to `Community 39`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09725158562367865 - nodes in this community are weakly interconnected._