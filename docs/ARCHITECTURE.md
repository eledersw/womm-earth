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
lib/partner/  lib/copy/        Ekaitz (lib/copy/globe.ts: Eleder)
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

## Endpoints (summary; `api/_models.py` is the final word)

| Method | Path | Input | Output |
|---|---|---|---|
| GET | `/api/py/health` | — | `{ok, numpy, scipy, cold_start_ms}` |
| GET | `/api/py/variables` | — | The 16 reviewed POWER variables in `api/_data/approved_power_variables.json`, refreshed from the NASA POWER Manager monthly catalogue (canonical `AG` units and request community) |
| GET | `/api/py/regions` | — | `Region[]`: id, name, type (`country` \| `state` \| `subregion` \| `ocean` \| `named`), centroid, bbox, parent, nearest_cell_fallback, valid_variables[] |
| POST | `/api/py/analyze` | `Case` | Fetches POWER monthly regional grid cells at request time, masks country and subregion cells by their polygon, computes a cos(latitude)-weighted mean, then returns per region: `monthly[]`, `yearly[]`, `stats`, `verdict`, `provenance` |
| GET | `/api/py/trendmap` | `variable, start, end, season, months?` | Live eligible regions with `{slope_per_decade, p, q, tier}`; BH spans every eligible region type, with a one-hour cache |
| POST | `/api/py/correlate` | `{var_x, var_y, region, start, end, season, max_lag}` | `{pearson, spearman, raw, detrended, n_eff, p, best_lag, scatter[], warning?}` |
| POST | `/api/py/mirror` | `Case` (one region) | Opposite-trend regions selected from the same live map/BH family; `{mirrors: [{region, slope_per_decade, p, z}], none_found}` |
| POST | `/api/py/scan` | `{region, start, end}` | Live variable × season tests, ranked after one BH adjustment across the eligible scan family |

**`Case` in the URL:** `?v=T2M&r=US-WI,ESP&from=2002&to=2025&s=JJA&lvl=student`.
- `r` is kept in canonical sorted order so share links are stable.
- The slider commits on release, with `history: 'replace'`.

## Data shapes

- **`api/_data/series_<VAR>.npz`** (Oier):
  - `values`: float32 `[n_regions, n_months]`, with NaN for missing data.
  - `region_ids`: `[n_regions]`.
  - `t0`: `"1981-01"` (MERRA-2) or `"2001-01"` (CERES).
- **`regions.json`:** id, name, type, centroid, bbox, `nearest_cell_fallback`, `valid_variables`, and optional parent country ID.
- **`api/_data/admin1.geojson` / `public/geo/admin1.geojson`:** simplified Natural Earth Admin-1 geometries dissolved into 42 broader regions for large countries. A country’s regions are drawn when that country is selected, at any zoom level; the API uses each matching polygon to mask POWER grid cells.
- **`hero/<id>.json`:** `{variable, region, source, instrument, product, version, doi, t0, values[]}`.
- **`lib/partner/process-cards.json`** (Ekaitz): `{id, title, student, scientist, citations[], applies_to: {variables[], regions[]}}`.
- **`public/geo/*.geojson`** (Oier): features with `properties {id, name, type}`; the ids match `regions.json`.
- **Region ids:** countries use `ADM0_A3` (`USA`), US states `US-<postal>` (`US-WI`), oceans `OCN-<CODE>`, named regions `NR-<CODE>` (`NR-GLOBE`, `NR-SAHEL`).

## Runtime climate data and offline pipeline

**Case analysis uses live NASA POWER requests.** `GET /api/py/variables` reads the monthly POWER Manager catalogue and exposes only the 16 variables reviewed in `docs/DATA_CATALOG.md`; their approved names and definitions are packaged in `api/_data/approved_power_variables.json`. Units and the request community still come from POWER. Each `POST /api/py/analyze` fetches the selected parameter for every requested region and time range. POWER accepts regional rectangles of 2°–10° on each axis: larger bounding boxes are split into at most 12 valid tiles, and areas smaller than 2° on either axis use the point endpoint at the region centroid with a `nearest_cell_fallback` warning. Regions requiring more than 12 tiles return an error rather than an unrepresentative estimate. Python ignores annual `YYYY13` keys and calculates a per-month cos(latitude)-weighted mean across finite grid values, deduplicating cells on tile boundaries, before applying the existing seasonal and statistical engine. No `.npz` or hero series is used by `/api/py/analyze`.

`api/_data/regions.json` remains local lookup metadata (ids, names, centroids and bounding boxes); `public/geo/*.geojson` remains local map geometry. They do not contain climate time series. Natural Earth 1:10m Admin-1 boundaries are dissolved into 42 regional macroareas. These broader areas can require more POWER requests than the previous smaller subdivisions. Russia, Canada, China, Brazil, Australia, India, Greenland and Norway expose these regions; the United States keeps its existing state layer. The map draws a large country’s regions when that country is selected, at any zoom level. A selected region uses its own polygon for POWER analysis. Country and subregion means mask POWER grid cells to the polygon and weight them by cos(latitude); point fallback still applies to very small areas. The map, mirror and scanner fetch POWER series at request time and compute their BH families in Python. The map and mirror share an in-process one-hour cache. `/api/py/correlate` still uses a fixture.

Trend inference follows METHODS v1 Option B: the verdict uses the larger of capped Hamed–Rao MK and adjusted OLS p-values. If OLS effective sample size is at most two, its p-value, standard error and confidence bounds are null, the response warns `ols_unavailable`, and the verdict uses MK alone. Additional-years estimates appear only for eligible `not_proven` cases when the required OLS inputs exist. The nine golden cases are exercised by `tests/test_golden.py` in API CI.

The offline pipeline below can still build regional `.npz` libraries for research or offline work, but it is not the runtime source for case analysis.

1. **Open the POWER monthly Zarr stores** with `fsspec` + `xr.open_zarr(consolidated=True)`.
   - CERES grid: `https://nasa-power.s3.amazonaws.com/syn1deg/temporal/power_syn1deg_monthly_temporal_lst.zarr`.
   - MERRA-2 grid: `https://nasa-power.s3.us-west-2.amazonaws.com/merra2/temporal/power_merra2_monthly_temporal_utc.zarr` (confirmed consolidated metadata, 2026-11-14; T2M, PRECTOTCORR and GWETROOT present). Its time coordinate runs into 2029, so the pipeline trims trailing months with no values.
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
- **Model and settings:** `claude-sonnet-5-5` (was `claude-opus-5-5` until H7), adaptive thinking, an explicit `output_config.effort` (`low` for Explain and `medium` for Partner to start), and the server-side fallback (`fallbacks: "default"`).
- **Response handling:** handle the `refusal` and `max_tokens` stop reasons, and cap the number of tool-loop iterations.
- **Streaming:** stream our own SSE events to the browser: `text`, `tool_result`, `propose_case`, `error`.
- **Explain mode:**
  - The client posts the stats JSON it already has, so there is no server-to-server hop.
  - `VerdictStep.showExplanation=false` keeps Explain in the explanation pane and prevents duplicate requests.
  - The template verdict always renders, so the app works with Claude down.
- **Partner mode:**
  - Tool Runner with `betaZodTool` tools: `list_variables`, `analyze_case`, `correlate`, `find_mirror`, `scan_region`, `get_process_card`, `propose_case`.
  - Tools call `/api/py` by absolute URL. On protected previews, send the `x-vercel-protection-bypass` header.
  - Correlation is gated off in the panel and Partner by `lib/partner/capabilities.ts`: the Python endpoint still serves a fixture. The tool returns availability only, with no request or numerical evidence. Enable only after Oier delivers requested-Case results and Methods reviews them; no HTTP contract changes.
- **Grounding:**
  - Common scientific rules and separate mode prefixes come from `docs/science/VERDICT_TEMPLATES.md`; Explain has no tools, Partner retains its tool access.
  - Coder C’s internal display adapter checks actual valid yearly coverage (including DJF/custom boundaries), component availability and combined-p consistency. It preserves the API tier and flags discrepancies as provisional; it does not certify or replace Oier’s engine. Ineligible/unavailable inference is withheld and unsafe years estimates are suppressed.
  - Analysis tool envelopes retain Case IDs/custom months, labelled method constants and per-decade Sen CI bounds, and include only cards matching variable/region. Card conditions still apply. No Pydantic/HTTP seam fields were changed.
  - System prompt rules: only numbers from tool results; name the test; "not significant" ≠ "no change"; physical explanations only from process cards.
  - A **number check** compares every number in the output against the tool JSON. It flags mismatches in dev and doubles as the eval harness.
  - The EVAL CLI resolves all 20 rubric contexts during `--dry-run`, without tours/API calls. Real runs save full answers, named tool results, rubric and failure history under `lib/partner/eval-runs/` (new files only), alongside the Markdown excerpt. `--output NAME.json` selects a new filename; `--revision` records a caller-supplied revision. Remote model/settings are not exposed by SSE and must be verified during scientific review; no score is assigned automatically.
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
