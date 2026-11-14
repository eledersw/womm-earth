# Data & Stats Engine Implementation Plan (Oier, Codex)

> **For agentic workers:** work this plan one task at a time and tick each checkbox as you go. Codex: just follow the steps. Claude Code: use superpowers:executing-plans. **Edit only files in Oier's area** (`docs/process/OWNERSHIP.md`). Merge as described in `docs/process/MERGING.md`.

**Goal:** turn NASA POWER monthly grids (plus Giovanni hero series) into per-region series, and serve statistically rigorous trend, correlation, mirror and scan results over `/api/py/*`.

**Architecture:**
- **Offline:** the pipeline (run in Colab) averages each variable over ~300 regions and writes small `.npz` files plus `regions.json` and GeoJSON.
- **Runtime:** one Vercel Python function (`api/index.py`, FastAPI) loads those files lazily and runs a pure-numpy engine (`api/_engine/`).
- **Contract:** the Pydantic models in `api/_models.py`, exported to `lib/api-types.ts` for the front end.

**Tech stack:**
- Runtime: Python 3.12, FastAPI, Pydantic v2, numpy, `scipy.special` (never `scipy.stats` at runtime).
- Tests: pytest + pymannkendall (test-only reference).
- Pipeline: xarray, zarr, fsspec, dask, regionmask, geopandas.

**Spec:** `docs/superpowers/specs/2026-11-14-earth-case-files-design.md`, plus `docs/science/METHODS.md`, which wins on every statistical detail.

## Global constraints

- **Vercel layout:** every `.py` file under `api/` becomes its own Vercel function **unless its name or folder starts with `_`**. The only entrypoint is `api/index.py`; everything else lives in `api/_engine/`, `api/_data/`, `api/_fixtures/` and `api/_models.py`.
- **Imports:** `api/index.py` starts with `sys.path.insert(0, str(Path(__file__).parent))` and imports `from _engine... import`. Tests use the same import style via `pythonpath = api` in `pytest.ini`.
- **Routes:** every route is prefixed `/api/py`. Create the app as `FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")`.
- **Runtime dependencies** (`requirements.txt`): `fastapi`, `pydantic>=2.7`, `numpy>=2.0`, `scipy>=1.13`. Nothing else.
- **Dev dependencies** (`requirements-dev.txt`): `-r requirements.txt`, `pytest`, `pymannkendall`, `httpx2`, `uvicorn[standard]`. Starlette's TestClient now asks for `httpx2`; plain `httpx` still works but warns.
- **Local Python:** Eleder's scaffold uses a git-ignored `.venv/`. Vercel runs Python 3.12 (`.python-version`); write 3.12-compatible code even if your local Python is newer.
- **Pipeline dependencies:** `pipeline/requirements.txt`, never deployed.
- **Region ids:**

  | Region type | Id format | Examples |
  |---|---|---|
  | Countries | Natural Earth `ADM0_A3` | `USA`, `ESP`, `FRA` |
  | US states | `US-` + postal code | `US-WI` |
  | Oceans | `OCN-<CODE>` | — |
  | Named regions | `NR-<CODE>` | `NR-GLOBE`, `NR-LAND`, `NR-SAHEL` |

  These ids are a **seam**: they must match across `regions.json`, the `.npz` files and `public/geo/*.geojson`.
- **Verdict tier codes:** `confirmed | not_proven | no_case | too_short` (glossary: Confirmed / Not proven yet / No case / Too short to judge).
- **Statistical defaults** live in `api/_engine/config.py` as named constants mirroring METHODS.md, so a changed decision is a one-line edit:

  | Constant | Default |
  |---|---|
  | `MIN_YEARS` | 10 |
  | `SEASON_MIN_FRACTION` | 2/3 |
  | `ANNUAL_MIN_MONTHS` | 10 |
  | `SERIES_MIN_VALID_FRACTION` | 0.8 |
  | `ALPHA` | 0.05 |
  | `NOT_PROVEN_MAX_P` | 0.20 |
  | `YEARS_NEEDED_HIDE_P` | 0.5 |
  | `YEARS_NEEDED_MAX` | 50 |
  | `PHI_CLIP` | (0.0, 0.9) |
  | `MAX_LAG` | 6 |
  | `FDR_Q` | 0.05 |
  | `CORR_WARN_RAW` | 0.5 |
  | `CORR_WARN_DETRENDED` | 0.3 |

- **Sync after `METHODS.md` v1 (H2) and every later change:** update `config.py` and note it in your handoff.
- **Contract freeze at H2.** After that, only additive changes (new optional fields, new endpoints) with a heads-up in STATUS.

## Review focus

1. **All-NaN or very short series** (a small region, a land-only variable over the ocean) → `tier="too_short"` with a `reason`, `stats=None`, never a 500. *(Task 4 test `test_analyze_too_short`)*
2. **Season wrap at the period edges** (DJF when `start=2002`) → the first incomplete DJF is dropped, not half-averaged. *(Task 3 test `test_djf_drops_incomplete_edges`)*
3. **A zero-variance series** (constant values) → MK p=1 and slope 0, with no division by zero. *(Task 3 test `test_constant_series`)*
4. **Unknown variable or region id** → 422 with a clear message, not 500. *(Task 4 test `test_unknown_ids_422`)*
5. **The hero variable requested for a region without hero data** (MODIS AOD for ESP) → `too_short` with reason `"no_data"`, and `/regions` does not list it as valid. *(Task 6 test `test_hero_validity`)*

---

### Task 1: Contract + stub API + first geometry (due H2, blocks everyone)

**Files:**
- Create: `api/_models.py`, `api/_fixtures/{variables,regions,analyze,trendmap,correlate,mirror,scan}.json`, `scripts/gen_openapi.py`, `pytest.ini`, `requirements-dev.txt`, `tests/test_contract.py`, `pipeline/export_geo.py`, `public/geo/countries.geojson`
- Modify: `api/index.py`, `requirements.txt` (Eleder creates the minimal versions in his scaffold; from that merge on, they are yours)

**Interfaces (the seam; exact names):**
- Enums (Literal):
  - `Season = "ANN"|"DJF"|"MAM"|"JJA"|"SON"|"CUSTOM"`
  - `Tier = "confirmed"|"not_proven"|"no_case"|"too_short"`
  - `RegionType = "country"|"state"|"ocean"|"named"`
  - `VariableKind = "satellite"|"reanalysis"`
- `Variable{id, name, unit, source, instrument: str|None, kind, start_year: int, end_year: int, land_only: bool, ratio_scale: bool, definition_student, definition_scientist, doi: str|None, signed_off: bool}`
- `Region{id, name, type, centroid: tuple[float,float]` (lat, lng)`, bbox: tuple[float,float,float,float]` (min_lng, min_lat, max_lng, max_lat)`, nearest_cell_fallback: bool, valid_variables: list[str], parent: str|None}`
- `CaseRequest{variable, regions: list[str]` (1–4)`, start: int, end: int` (years)`, season: Season="ANN", months: list[int]|None}`
  - `months` is required when `CUSTOM`, and must be contiguous in cyclic order.
- **Result pieces:**
  - `MonthlyPoint{t: str` ("YYYY-MM")`, value: float|None, anomaly: float|None}`
  - `YearlyPoint{year: int, value: float|None}`
  - `FitPoint{year, ols, ols_low, ols_high, sen}`
  - `Ols{slope, intercept, se, p, ci_low, ci_high, r2, n_eff}`
  - `Mk{p, p_naive, z, tau}`
  - `Sen{slope, intercept, ci_low, ci_high}`
- `TrendStats{n_years, phi, resid_sd, ols, mk, sen, tests_agree: bool, period_mean, change_per_decade, total_change, pct_of_mean_per_decade: float|None}` (all slopes per **year**; "per decade" fields ×10)
- `Verdict{tier, years_needed: int|None, reason: str|None}`
- `Provenance{source, instrument|None, product|None, doi|None, kind}`
- `RegionAnalysis{region, monthly: list[MonthlyPoint], yearly: list[YearlyPoint], fit: list[FitPoint], stats: TrendStats|None, verdict, provenance, warnings: list[str]}`
  - Warning codes: `nearest_cell_fallback`, `tests_disagree`, `partial_coverage`.
- `AnalyzeResponse{case: CaseRequest, results: list[RegionAnalysis]}`
- `TrendMapEntry{slope_per_decade, p, q, tier}`, `TrendMapResponse{variable, start, end, season, entries: dict[str, TrendMapEntry]}`
- `CorrelateRequest{var_x, var_y, region, start, end, season: Season="ANN", months: list[int]|None, max_lag: int=6}`
- `CorrelateResponse{n, n_eff, pearson_raw, pearson_detrended, spearman_raw, spearman_detrended, p_raw, p_detrended, best_lag, best_lag_r, lags: list[{lag, r}], scatter: list[{t, x, y}], warning: Literal["both_trending"]|None}`
- `MirrorResponse{base: {region, slope_per_decade, p, z, tier}, mirrors: list[{region, slope_per_decade, p, z}], none_found: bool}`
  - The request is a `CaseRequest` with exactly 1 region.
- `ScanRequest{region, start, end}`, `ScanResponse{region, entries: list[{variable, season, slope_per_decade, p, q, tier}]}`
- `Health{ok, numpy, scipy, cold_start_ms}`
- **Endpoints:**
  - `GET /api/py/health`
  - `GET /api/py/variables` → `list[Variable]`
  - `GET /api/py/regions` → `list[Region]`
  - `POST /api/py/analyze`
  - `GET /api/py/trendmap?variable&start&end&season[&months]`
  - `POST /api/py/correlate`
  - `POST /api/py/mirror`
  - `POST /api/py/scan`
- **GeoJSON:** each feature has `properties: {id, name, type}`.

- [ ] **Step 1: Write `tests/test_contract.py`.** It loads each fixture with the matching model (`AnalyzeResponse.model_validate_json(...)`, etc.) and, via `fastapi.testclient.TestClient`, asserts that every endpoint returns 200 and validates against its `response_model`. It must cover `"US-WI"` in `/regions` and an `/analyze` result with `tier == "confirmed"`.
- [ ] **Step 2: Run it.** `python -m pytest tests/test_contract.py -q` → FAIL (models missing).
- [ ] **Step 3: Implement the contract.** Write the models in `api/_models.py` and the stub endpoints in `api/index.py` (each returns its fixture, typed with `response_model`). The fixtures cover `USA`, `US-WI`, `ESP` and `NR-SAHEL`, with ~24 synthetic years. `cold_start_ms` = the time from module import to the first request.
- [ ] **Step 4: Run the tests.** `python -m pytest -q` → PASS.
- [ ] **Step 5: Wire up type generation.** `scripts/gen_openapi.py` imports `app` from `api/index.py` (adding `api/` to `sys.path`) and writes `api/openapi.json` with `json.dumps(app.openapi(), indent=2, sort_keys=True)`. Run `npm run gen:types` (Eleder's script) → `lib/api-types.ts` is created.
- [ ] **Step 6: First geometry.** `pipeline/export_geo.py --countries` reads Natural Earth 110m admin-0 (`https://naciscdn.org/naturalearth/110m/cultural/ne_110m_admin_0_countries.zip`; fallback: the GeoJSON in the GitHub repo `nvkelso/natural-earth-vector`), keeps `{id: ADM0_A3, name: NAME, type: "country"}` and writes `public/geo/countries.geojson`. **Done when** the file is < 1.5 MB and contains `USA`, `FRA` and `ESP`.
- [ ] **Step 7: Verify on a preview deploy.** Push and open a PR. On the preview, `/api/py/health?x=1` and `/api/py/regions` return JSON, which proves that `_` folders are bundled and the sibling imports work.
- [ ] **Step 8: Merge and announce.** Self-merge once CI is green. Post "contract v1 live" in STATUS. Commit message `feat(api): contract v1 + stub endpoints + countries geojson`.

### Task 2: Pipeline: masks, region library, geometry (H2–H6, runs in Colab)

**Files:**
- Create: `pipeline/requirements.txt`, `pipeline/named_regions.py`, `pipeline/build_library.py`, `pipeline/import_giovanni.py`
- Modify: `pipeline/export_geo.py` (adds `--states --oceans --named`)
- Output: `api/_data/series_<VAR>.npz`, `api/_data/regions.json`, `public/geo/{us-states,oceans,named}.geojson`

**Interfaces:**
- **Produces `series_<VAR>.npz`:**
  - `values`: float32 `[n_regions, n_months]`, NaN for missing;
  - `region_ids`: str `[n_regions]`;
  - `t0`: `"YYYY-MM"`.
- **Produces `regions.json`:** a list of `Region` dicts (same fields as the model).

- [ ] **Step 1: Named regions.** `pipeline/named_regions.py` defines `NAMED: list[dict(id, name, bbox, land_only: bool)]`:

  | Id | Area |
  |---|---|
  | `NR-GLOBE` | all cells |
  | `NR-LAND` | every country cell |
  | `NR-OCEAN` | every non-country cell |
  | `NR-ARCTIC` | lat ≥ 66.5 |
  | `NR-SAHEL` | (−18, 10, 38, 20), land |
  | `NR-MED` | (−10, 30, 37, 46), land |
  | `NR-ARAL` | (55, 41, 65, 48), land |
  | `NR-AMAZON` | (−75, −15, −48, 5), land |
  | `NR-CONGO` | (12, −8, 32, 6), land |
  | `NR-TIBET` | (78, 28, 103, 38), land |
  | `NR-SIBERIA` | (60, 50, 140, 72), land |

  Plus 3 metro boxes about 2° wide, confirmed with Sergio by H6 (default: `NR-METRO-LA`, `NR-METRO-DELHI`, `NR-METRO-BEIJING`).
  - **Ocean basins** (`OCN-NATL`, `OCN-SATL`, `OCN-NPAC`, `OCN-SPAC`, `OCN-IND`, `OCN-SO` for lat < −50, `OCN-ARC` for lat > 66.5): a box minus every country cell.
- [ ] **Step 2: `build_library.py --vars T2M PRECTOTCORR GWETROOT ...`.**
  - **Open the stores** with `xr.open_zarr(fsspec.get_mapper(URL), consolidated=True)`.
    - CERES: `https://nasa-power.s3.amazonaws.com/syn1deg/temporal/power_syn1deg_monthly_temporal_lst.zarr`.
    - MERRA-2: the path found in your H0.5 spike. Record it in ARCHITECTURE → Data pipeline.
  - **Clean the data:** mask values ≤ −990 as NaN and normalise longitude to −180..180.
  - **Build a mask matrix per grid:**
    - Countries via `regionmask.from_geopandas(gdf_50m, names="NAME", abbrevs="ADM0_A3", overlap=False).mask_3D(lon, lat)`, using NE 50m.
    - Mainland override for `FRA`, `NLD` and `NOR`: keep only the polygon parts inside their European bbox.
    - US states from NE 50m admin-1 where `iso_a2=="US"` (id `US-` + `postal`).
    - Named regions and oceans from Step 1.
  - **Weights:** `W = mask × cos(lat)`, flattened to `[cells, regions]`.
  - **Regional mean** (per month, cells flattened):

    ```python
    # V: [months, cells] float32
    num = np.nan_to_num(V) @ W
    den = (~np.isnan(V)).astype(np.float32) @ W
    mean = np.where(den > 0, num / den, np.nan)
    ```

  - **Small regions:** a region with no cell centres uses the cell nearest its centroid and gets `nearest_cell_fallback=True`.
  - **Validity:** `valid_variables` = the variables whose series isn't all-NaN, excluding land-only variables over `OCN-*`/`NR-OCEAN`.
  - **Done when** 3 demo variables are written and `regions.json` lists ≥ 280 regions, including `US-WI` and `NR-SAHEL`.
- [ ] **Step 3: Run it in Colab** (not over venue wifi). Clone your branch, `pip install -r pipeline/requirements.txt`, run `python pipeline/build_library.py --vars T2M PRECTOTCORR GWETROOT`, then download `api/_data/` and commit it. Then run the remaining variables from `docs/DATA_CATALOG.md` that are marked `in store`.
- [ ] **Step 4: Remaining geometry.** `export_geo.py --states --oceans --named` writes simplified GeoJSON (`gdf.simplify(0.05)`), with ids identical to `regions.json`. **Done when** each file is < 2 MB.
- [ ] **Step 5: Hero series.** `import_giovanni.py docs/science/hero/<file>.csv --variable MODIS_AQUA_AOD --region US-WI` writes `api/_data/hero/MODIS_AQUA_AOD__US-WI.json` = `{variable, region, source, instrument, product, version, doi, t0, values[]}` (provenance from the CSV header and DATA_CATALOG).
- [ ] **Step 6: Test that region ids agree.** Write `tests/test_library.py::test_region_ids_consistent`, asserting that the ids in every `.npz`, in `regions.json` and in all `public/geo/*.geojson` files agree (every GeoJSON id is in `regions.json`). Run `python -m pytest tests/test_library.py -q` → PASS.
- [ ] **Step 7: Commit, merge, announce.** `feat(data): region library + geometry`, self-merge, then tell Eleder that the geometry is in.

### Task 3: Engine core: series construction, trend tests, verdict (TDD; H2–H8)

**Files:**
- Create:
  - `api/_engine/__init__.py`
  - `api/_engine/config.py`
  - `api/_engine/series.py`
  - `api/_engine/trend.py`
  - `api/_engine/verdict.py`
  - `tests/test_series.py`
  - `tests/test_trend.py`
  - `tests/test_verdict.py`
  - `tests/test_golden.py`
  - `tests/fixtures/golden/` (copied from `docs/science/golden_cases/` once Sergio delivers)

**Interfaces (produces):**
- `series.yearly_series(values: np.ndarray, t0: str, start: int, end: int, season: str, months: list[int]|None) -> tuple[np.ndarray, np.ndarray]` returns `(years, yearly_values)`, with NaN where a year fails the missing-data rule.
- `series.monthly_with_anomalies(values, t0, start, end) -> tuple[list[str], np.ndarray, np.ndarray]` returns `(labels, values, anomalies)`.
- `trend.ols_ar1(x, y, alpha=ALPHA) -> OlsFit(slope, intercept, se, p, ci_low, ci_high, r2, n_eff, phi, resid_sd)` (dataclass)
- `trend.mann_kendall(y) -> MkFit(s, var_s, z, p, tau)`
- `trend.hamed_rao(y, alpha=ALPHA) -> MkFit`
- `trend.sens_slope(x, y, alpha=ALPHA) -> SenFit(slope, intercept, ci_low, ci_high)`
- `verdict.analyze_yearly(years, y, ratio_scale: bool) -> tuple[TrendStats|None, Verdict, list[FitPoint]]` (returns the Pydantic models)
- `verdict.years_until_significant(slope, resid_sd, phi, n, p_mk) -> int|None`

**Algorithms:**

| Function | Algorithm |
|---|---|
| Seasons (`yearly_series`) | DJF = Dec(y−1)+Jan(y)+Feb(y), labelled y. MAM/JJA/SON are within one year. CUSTOM: contiguous cyclic months; if they wrap (start month > end month), months ≥ the start month count toward the next year. A year is valid if ≥ `SEASON_MIN_FRACTION` of its months are present (`ANNUAL_MIN_MONTHS` for ANN). Years whose season reaches outside `[start, end]` are dropped. |
| `ols_ar1` | OLS on x = year. φ = lag-1 autocorrelation of the residuals, clipped to `PHI_CLIP`. n_eff = n(1−φ)/(1+φ). se_adj = se·√((n−2)/(n_eff−2)). df = n_eff−2. p = 2·`stdtr(df, −|t|)`. CI = slope ± `stdtrit(df, 1−α/2)`·se_adj. Fit band at year x: ŷ ± t_crit·s_adj·√(1/n + (x−x̄)²/Sxx), with s_adj = resid_sd·√((n−2)/(n_eff−2)). |
| `mann_kendall` | S, a tie-corrected var(S), continuity-corrected z, p = 2·(1−`ndtr`(\|z\|)), τ = S/(n(n−1)/2). |
| `hamed_rao` | **Port it from pymannkendall:** run `python -c "import inspect, pymannkendall as m; print(inspect.getsource(m.hamed_rao_modification_test))"`. Swap `norm.cdf`/`norm.ppf` for `scipy.special.ndtr`/`ndtri`. Keep its significant-lag rule and its correction factor exactly. |
| `sens_slope` | Median of the pairwise slopes. CI: C = `ndtri(1−α/2)`·√var(S) (naive var); lower index = ⌊(N−C)/2⌋, upper = ⌈(N+C)/2⌉ over the sorted slopes, clipped. Intercept = median(y − slope·x). |
| `years_until_significant` | None if p_mk < α or p_mk ≥ `YEARS_NEEDED_HIDE_P` or the slope is 0. For m in n+1 … n+`YEARS_NEEDED_MAX`: var_b = 12σ²/(m(m²−1))·(1+φ)/(1−φ), n_eff = m(1−φ)/(1+φ). Return m−n at the first m where \|b\|/√var_b ≥ `stdtrit(n_eff−2, 1−α/2)`; else None. |
| Tier | Fewer than `MIN_YEARS` valid years, or valid fraction < `SERIES_MIN_VALID_FRACTION` → `too_short`. Else MK (Hamed-Rao) p < α → `confirmed`; p < `NOT_PROVEN_MAX_P` → `not_proven`; else `no_case`. `tests_agree` = (OLS p < α) == (MK p < α). |
| Magnitude | Per decade = slope × 10. Total = slope × (last year − first year). % of mean per decade only if `ratio_scale` and \|mean\| > 1e-9. |

- [ ] **Step 1: Series tests.** `tests/test_series.py`:
  - `test_djf_assigns_december_to_next_year` (monthly value = month number → DJF 2001 = mean(12, 1, 2) = 5.0);
  - `test_djf_drops_incomplete_edges`;
  - `test_annual_requires_10_months`;
  - `test_custom_wrap_ndj`.
  
  Run → FAIL. Implement `series.py`. Run → PASS. Commit.
- [ ] **Step 2: Trend tests.** `tests/test_trend.py`:
  - `test_hamed_rao_matches_pymannkendall` (50 random series, n=30–45: p within 1e-9 of `pymannkendall.hamed_rao_modification_test`);
  - `test_mk_matches_pymannkendall`;
  - `test_sen_matches_pymannkendall_slope`;
  - `test_ols_matches_linregress_when_phi_zero` (the slope matches `scipy.stats.linregress` in the test only);
  - `test_known_slope_recovered` (y = 0.05t + N(0, 0.3), n=30, seed 1 → 0.05 lies within the Sen CI and the OLS CI);
  - `test_constant_series` (p == 1, slope == 0, no warnings).
  
  Run → FAIL. Implement `trend.py`. Run → PASS. Commit.
- [ ] **Step 3: False-positive tests** (also slide material), in `tests/test_false_positives.py`:
  - `test_white_noise_fpr`: 1000 series of N(0, 1), n=30, seed 7 → the share with Hamed-Rao p < 0.05 lies in [0.03, 0.08].
  - `test_ar1_naive_inflates_hamed_rao_controls`: 1000 series of AR(1) with φ=0.6, n=40, seed 8 → naive FPR > 0.12, Hamed-Rao FPR < 0.10, and Hamed-Rao < naive. Expect Hamed-Rao around 6–8%; it won't be exactly 5% at this n, and that is the honest claim for the slide.
  - Also write `scripts/fpr_figure.py`, which saves `docs/science/figures/fpr.csv` + `fpr.png` (matplotlib, offline only). That's a cross-area *output file* for Sergio; tell him when it's written.
  
  Run → PASS. Commit.
- [ ] **Step 4: Verdict tests.** `tests/test_verdict.py`:
  - `test_tiers` (p 0.01 → confirmed, 0.10 → not_proven, 0.5 → no_case, 8 years → too_short);
  - `test_years_needed_monte_carlo` (for slope 0.02, σ=0.3, φ=0.2, n=15: simulate 500 series of length n + years_needed; ≥ 35% reach OLS-AR(1) p < 0.05; a loose check that the formula is in the right range);
  - `test_pct_hidden_for_temperature`.
  
  Run → FAIL. Implement `verdict.py`. Run → PASS. Commit.
- [ ] **Step 5: Golden tests.** `tests/test_golden.py` is parametrised over the `tests/fixtures/golden/*/` folders and **skips if none exist**. For each one, run the engine on `series.csv` and compare with `expected.json` within its `tolerance`. Copy Sergio's cases in as they arrive (cases 1–3 by H5). **Done when** gc1–gc3 pass.

### Task 4: Real `/analyze`, `/variables`, `/regions` + `case_cli.py` (H6–H8)

**Files:**
- Create: `api/_engine/store.py`, `scripts/case_cli.py`, `scripts/catalog_to_json.py`, `tests/test_api.py`
- Modify: `api/index.py`

**Interfaces:**
- `store.get_series(variable: str, region: str) -> tuple[np.ndarray, str] | None` returns `(values, t0)`. It checks hero files first (`hero/<VAR>__<REGION>.json`), then `series_<VAR>.npz`; it is `lru_cache`d per file.
- `store.regions() -> dict[str, Region]`
- `store.variables() -> dict[str, Variable]`
- `case_cli.py --var T2M --region US-WI --start 2002 --end 2025 --season JJA [--months 6 7 8] [--json]` prints a table: slope/decade, MK p, naive MK p, OLS p, tests agree, tier, years needed, warnings.

- [ ] **Step 1: API tests.** `tests/test_api.py`:
  - `test_analyze_real_series` (`T2M`, `US-WI`, 1981–2024 → 200, tier ∈ the tier set, `len(yearly)` == 44);
  - `test_analyze_too_short` (a 6-year period → `too_short`, `stats is None`);
  - `test_unknown_ids_422`;
  - `test_variables_from_catalog` (`T2M` present).
  
  Run → FAIL.
- [ ] **Step 2: Variables from the catalog.** `scripts/catalog_to_json.py` parses the variables table in `docs/DATA_CATALOG.md` → `api/_data/variables.json`. Mapping:

  | Field | Derived from |
  |---|---|
  | rows included | status `in store` or `signed off` |
  | `signed_off` | status == `signed off` |
  | `kind` | `"satellite"` if Kind contains "satellite", else `"reanalysis"` |
  | `land_only` | Caveats contain "Land only" |
  | `ratio_scale` | unit not in {°C, kPa} |
  | `start_year` | the Period column |
  | `end_year` | the last year present in the data |

  A row that fails to parse is reported by name, not silently skipped.
- [ ] **Step 3: Real endpoints.** Implement `store.py` and the real `/analyze` (one `RegionAnalysis` per region, `monthly` from `monthly_with_anomalies`, `provenance` from the variable or hero metadata, warnings), `/variables` and `/regions`. Run → PASS.
- [ ] **Step 4: `case_cli.py`.** Implement it (it reuses the `_engine` functions). Tell Sergio it's ready (H6) and post the usage in STATUS.
- [ ] **Step 5: Merge (M1).** Commit `feat(api): real analyze + case_cli`, then self-merge at the **H8 checkpoint** (merge order: you first).

### Task 5: Trend map, correlation, mirror (H8–H14)

**Files:**
- Create: `api/_engine/fdr.py`, `api/_engine/correlate.py`, `api/_engine/mirror.py`, `tests/test_fdr.py`, `tests/test_correlate.py`, `tests/test_mirror.py`
- Modify: `api/index.py`

**Interfaces:**
- `fdr.bh(p: np.ndarray) -> np.ndarray` (q-values, monotone)
- `correlate.correlate(x_anom, y_anom, max_lag) -> CorrelateResponse` fields:
  - Pearson and Spearman (rank-then-Pearson), raw and linearly detrended.
  - Bretherton n_eff = n(1−r₁ₓr₁ᵧ)/(1+r₁ₓr₁ᵧ). p via `stdtr` on t = r√((n_eff−2)/(1−r²)).
  - Lags −max_lag…+max_lag on detrended anomalies.
  - `warning="both_trending"` if \|raw\| ≥ `CORR_WARN_RAW` and \|detrended\| < `CORR_WARN_DETRENDED`.
- `mirror.find(base_id, table: dict[str, (slope, p, q, z, tier)], regions, k=3)`:
  - candidates = same `type`, excluding the base region, its `parent` and its children;
  - both trends confirmed (`q < FDR_Q` for the candidate), opposite sign;
  - sorted by \|z\| descending, top k; `none_found` if empty.
- `/trendmap` computes every valid region, adds `q = fdr.bh(p)` and caches with `lru_cache` keyed on `(variable, start, end, season, months)`. It sets `Cache-Control: public, max-age=3600, s-maxage=86400`.

- [ ] **Step 1: Tests.**
  - `test_bh_known_values` (p=[0.01, 0.04, 0.03, 0.2] → q=[0.04, 0.0533, 0.0533, 0.2]);
  - `test_correlate_both_trending_warning` (two independent noise series + a shared linear trend → raw r high, detrended low, warning set);
  - `test_correlate_lag_recovered` (y = x shifted by 2 months → best_lag == 2);
  - `test_mirror_excludes_parent_and_type` (`US-WI` never gets `USA`; a country never gets a state);
  - `test_mirror_none_found`.
  
  Run → FAIL.
- [ ] **Step 2: Implement** `fdr.py`, `correlate.py`, `mirror.py` and the endpoints. Run → PASS.
- [ ] **Step 3: Performance.** `/trendmap` for `T2M` 1981–2024 ANN runs in < 1.5 s cold locally. If not, precompute the yearly series per variable once in `store`.
- [ ] **Step 4: Before the H14 sleep.** Export the FPR figure if you haven't yet. Fix whatever Sergio's review gate finds (he logs it in STATUS). Commit and self-merge at the **H14 checkpoint**. **Done when** Sergio records "Validity checkpoint passed".

### Task 6: Hardening + scanner (H18–H22, after sleep)

**Files:**
- Create: `api/_engine/changepoint.py`, `tests/test_scan.py`, `tests/test_hardening.py`
- Modify: `api/index.py`, `api/_engine/store.py`

- [ ] **Step 1: Tests.**
  - `test_scan_applies_fdr` (q ≥ p for every entry);
  - `test_hero_validity` (`MODIS_AQUA_AOD` is valid only for `US-WI`; requesting it for `ESP` → `too_short`, reason `"no_data"`);
  - `test_all_nan_region` (→ `too_short`, reason `"no_data"`);
  - `test_pettitt_step` (golden case 4 → change index within ±2 of 15).
  
  Run → FAIL. Implement. Run → PASS.
- [ ] **Step 2: Scanner.** `/scan`: variables valid for the region × {ANN, DJF, MAM, JJA, SON} → `bh` across all entries → sort by q, then \|slope\|.
- [ ] **Step 3: Keep warm.** Write `scripts/warm.sh <url>`, which hits `/health`, `/regions`, `/variables` and `/trendmap` for the 3 demo cases. Eleder runs it before judging.
- [ ] **Step 4: Merge at H22.** Commit and self-merge at the **H22 checkpoint**. After H26, P0 fixes only (Eleder merges).

## Done when (whole plan)

`python -m pytest -q` is green, including golden gc1–gc6. Every endpoint answers on production in < 1.5 s warm. Sergio has signed off validity in STATUS.
