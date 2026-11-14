# ARCHITECTURE

The living technical reference. Update it in the same PR as the change it describes.

## Repo layout (target; owners per `docs/process/OWNERSHIP.md`)

```
AGENTS.md  CLAUDE.md                      agent instructions (Codex reads AGENTS.md; CLAUDE.md imports it)
app/                                      Next.js App Router (Eleder)
  layout.tsx                              NuqsAdapter, fonts, tokens
  page.tsx                                AppShell -> GlobeArea + <CasePanel/>
  tokens.css  globals.css  about/
  api/partner/route.ts                    Claude partner, SSE (Ekaitz)
components/ui|shell|globe/                Eleder
components/panel|charts|partner|tour/     Ekaitz
lib/state/                                case-codec.ts, use-case.ts, ui-store.ts (Eleder; seams)
lib/api/                                  client.ts, types.ts (Eleder; seams)
lib/api-types.ts                          generated from api/openapi.json (Oier)
lib/partner/  lib/tour/  lib/copy/        Ekaitz (lib/copy/globe.ts: Eleder)
api/                                      Vercel Python function (Oier)
  index.py                                the ONLY entrypoint; routes /api/py/*
  _models.py                              Pydantic contract
  _engine/                                pure stats functions
  _data/                                  series_<VAR>.npz, regions.json, variables.json, hero/*.json
  _fixtures/                              stub responses (H2)
  openapi.json                            generated
pipeline/                                 offline, run in Colab (Oier)
public/geo/                               GeoJSON from the pipeline (Oier)
public/textures/                          globe textures (Eleder)
scripts/                                  per-file owners (see OWNERSHIP)
tests/                                    pytest; fixtures/golden/ = Sergio's golden cases (Oier)
e2e/                                      Playwright (infra: Eleder; specs per owner)
docs/                                     see AGENTS.md "Read when"
```

**Why `_` prefixes in `api/`:** Vercel turns every `.py` file under `api/` into its own function unless its name or folder starts with `_`. `api/index.py` adds its own folder to `sys.path` and imports `_engine`. Tests do the same via `pythonpath = api` in `pytest.ini`.

## Wiring: Next.js + FastAPI on one Vercel project

- **Template.** Copy Vercel's Next.js + FastAPI template exactly, including the production rewrite destination. Create the app with `FastAPI(openapi_url="/api/py/openapi.json")`.
- **Dev rewrite.** `/api/py/:path*` goes to `http://127.0.0.1:8000/api/py/:path*`. Use **127.0.0.1, not localhost**: on Windows, Node resolves localhost to `::1` and uvicorn won't answer.
- **`vercel.json`.** Set `functions["api/index.py"].includeFiles: "api/_data/**"`, and set `excludeFiles` for `.next`, `node_modules`, `public`, `pipeline`, `tests`, `docs` and `e2e`. Pin Python 3.12.
- **Python dependencies.** fastapi, numpy, scipy only. Use `scipy.special` (`ndtr`, `stdtr`) at runtime; importing `scipy.stats` costs about 1 s of cold start. pymannkendall is a test-only dependency.
- **Types.** `npm run gen:types` dumps `app.openapi()` to `api/openapi.json`, then runs `openapi-typescript` to produce `lib/api-types.ts`. No running server is needed.

## Endpoints (summary; the exact contract is Task 1 of `docs/superpowers/plans/2026-11-14-data-engine.md`, and `api/_models.py` is the final word)

| Method | Path | Input | Output |
|---|---|---|---|
| GET | `/api/py/health` | — | `{ok, numpy, scipy, cold_start_ms}` |
| GET | `/api/py/variables` | — | `Variable[]`: id, name, unit, source, kind (`satellite` \| `reanalysis`), period, definitions (student, scientist) |
| GET | `/api/py/regions` | — | `Region[]`: id, name, type (`country` \| `state` \| `ocean` \| `named`), centroid, bbox, nearest_cell_fallback, valid_variables[] |
| POST | `/api/py/analyze` | `Case` | Per region: `monthly[]`, `anomalies[]`, `yearly[]`, `stats` {ols{slope, se, p, ci, r2, n_eff}, mk{p, tau}, sen{slope, ci}, phi, agree, change_per_decade, pct_of_mean}, `verdict` {tier, years_needed?}, `provenance` |
| GET | `/api/py/trendmap` | `variable, start, end, season` | `{region_id: {slope, p, verdict}}`, with a Cache-Control header |
| POST | `/api/py/correlate` | `{var_x, var_y, region, start, end, season, max_lag}` | `{pearson, spearman, raw, detrended, n_eff, p, best_lag, scatter[], warning?}` |
| POST | `/api/py/mirror` | `Case` (one region) | `{mirrors: [{region, slope, p, z}], none_found}` |
| POST | `/api/py/scan` | `{region, start, end}` | ranked `[{variable, season, slope, p, q, verdict}]` |

**`Case` in the URL:** `?v=T2M&r=US-WI,ESP&from=2002&to=2025&s=JJA&lvl=student`.
- `r` is kept in canonical sorted order so share links are stable.
- The slider commits on release, with `history: 'replace'`.

## Data shapes

- **`api/_data/series_<VAR>.npz`** (Oier):
  - `values`: float32 `[n_regions, n_months]`, with NaN for missing data.
  - `region_ids`: `[n_regions]`.
  - `t0`: `"1981-01"` (MERRA-2) or `"2001-01"` (CERES).
- **`regions.json`:** id, name, type, centroid, bbox, `nearest_cell_fallback`, `valid_variables`, `contains`/`within` (needed for the mirror rule).
- **`hero/<id>.json`:** `{variable, region, source, instrument, product, version, doi, t0, values[]}`.
- **`lib/partner/process-cards.json`** (Ekaitz): `{id, title, student, scientist, citations[], applies_to: {variables[], regions[]}}`.
- **`lib/partner/demo-explanations.json`** (Ekaitz): `{caseKey: {student, scientist, generated_at}}`.
- **`lib/tour/tours.json`** (Ekaitz): `Tour{id, title, steps: [{query, caption, focus?, highlight?, reveal?}]}`.
- **`public/geo/*.geojson`** (Oier): features with `properties {id, name, type}`; the ids match `regions.json`.
- **Region ids:** countries use `ADM0_A3` (`USA`), US states `US-<postal>` (`US-WI`), oceans `OCN-<CODE>`, named regions `NR-<CODE>` (`NR-GLOBE`, `NR-SAHEL`).

## Data pipeline (offline; run in Colab or a Codespace, not over venue wifi)

1. **Open the POWER monthly Zarr stores** with `fsspec` + `xr.open_zarr(consolidated=True)`.
   - CERES grid: `https://nasa-power.s3.amazonaws.com/syn1deg/temporal/power_syn1deg_monthly_temporal_lst.zarr`.
   - MERRA-2 grid: find the matching `merra2/…monthly…` path in the H1 spike.
   - Mask the −999 fill value and check that the latest months are populated.
2. **Expect about 440 MB per variable** for the full grid. Use dask, and do the demo variables first (T2M, PRECTOTCORR, GWETROOT, AOD if present).
3. **Masks with `regionmask`:**
   - Sources: Natural Earth admin-0 at 50m (with a mainland override list for France, Norway and similar), US admin-1, ocean-basin boxes and the named regions.
   - Normalise longitudes to −180..180 and handle the antimeridian (Russia, Fiji, Alaska).
   - Weight by cos(lat).
   - Regions too small to contain a cell centre fall back to the nearest cell. Flag them.
4. **Write** a variable×region validity matrix, then the `.npz` files and `regions.json`.
5. **Import the hero series:** `import_giovanni.py` converts the Methods lead's Giovanni CSVs into `hero/*.json`.
6. **Fallback:** if a store or variable is missing, use the POWER REST monthly API for the demo regions only.

## Claude integration

- **Before coding,** load the `claude-api` skill and read `typescript/claude-api/README.md`, `tool-use.md` and `streaming.md`.
- **Model and settings:** `claude-opus-5-5`, adaptive thinking, an explicit `output_config.effort` (`low` for Explain and `medium` for Partner to start), and the server-side fallback (`fallbacks: "default"`).
- **Response handling:** handle the `refusal` and `max_tokens` stop reasons, and cap the number of tool-loop iterations.
- **Streaming:** stream our own SSE events to the browser: `text`, `tool_result`, `propose_case`, `error`.
- **Explain mode:**
  - The client posts the stats JSON it already has, so there is no server-to-server hop.
  - Demo cases read `lib/partner/demo-explanations.json`.
  - The template verdict always renders, so the app works with Claude down.
- **Partner mode:**
  - Tool Runner with `betaZodTool` tools: `list_variables`, `analyze_case`, `correlate`, `find_mirror`, `scan_region`, `get_process_card`, `propose_case`.
  - Tools call `/api/py` by absolute URL. On protected previews, send the `x-vercel-protection-bypass` header.
- **Grounding:**
  - System prompt rules: only numbers from tool results; name the test; "not significant" ≠ "no change"; physical explanations only from process cards.
  - A **number check** compares every number in the output against the tool JSON. It flags mismatches in dev and doubles as the eval harness.
- **Cost:**
  - Prompt caching on the frozen system prompt, catalog and process cards. Confirm `cache_read_input_tokens` > 0.
  - Set `max_tokens` caps.
  - A Vercel Firewall rate-limit rule on `/api/partner`. In-memory limits do nothing on serverless.
  - An Anthropic Console spend cap.

## Front-end gotchas

- **Globe:** `react-globe.gl` sits in a `'use client'` wrapper that calls `dynamic(() => import(...), {ssr:false})`. Keep `polygonsData` referentially stable and change only the cap-colour accessor. Show one polygon layer per zoom level. Self-host the textures.
- **Charts:** Observable Plot goes in a single `<PlotFigure>` client wrapper with `useRef`, effect cleanup, `ResizeObserver`, and colours taken from CSS variables.
- **nuqs** is the only home of case state. Zustand holds hover and chat state only.
- **Playwright** needs the swiftshader WebGL launch flags to render the globe headless, and the protection-bypass header for previews.

## Performance

- Load `.npz` files lazily, with `lru_cache` per variable.
- The trend map is vectorised across all regions and cached.
- Run a keep-warm ping before judging.
