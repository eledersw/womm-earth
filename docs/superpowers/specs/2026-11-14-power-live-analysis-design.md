# NASA POWER live analysis design

## Intent

When the user selects any parameter that NASA POWER exposes for monthly regional requests, a region, and a year range and presses **Calculate**, the Python API requests that data from NASA POWER, runs the existing statistical pipeline, and returns the analysis. Editing fields alone must not start a calculation. Pressing Calculate again must make a fresh POWER request.

## Why this change

The current approved project documents specify a prebuilt regional library, while the product requirement now confirmed by the user is request-time data retrieval. The implementation must follow the confirmed product requirement and update the older architecture docs so they no longer describe the prebuilt store as the runtime source.

## Goals

- Fetch monthly values from NASA POWER for the submitted variable, each selected region, and requested years.
- Discover every monthly regional parameter and descriptive metadata from NASA POWER Manager. The current Manager catalogue reports the same 1,388 parameter codes for AG, RE, and SB; use AG as the canonical community because its units match the regional request and avoid duplicate choices with different units.
- Use POWER's monthly regional endpoint with each region's existing bounding box.
- Convert the provider response into the monthly series consumed by the existing Python analysis functions.
- Preserve the current season handling, anomaly generation, trend statistics, verdict, and response contract where possible.
- Support every parameter returned by the POWER Manager for monthly regional use; regional POWER requests use one parameter per request.
- Fetch again for every Calculate action, including a repeated calculation with unchanged fields.
- Return a clear API error when POWER rejects a request, is unavailable, or has no usable series. Do not silently substitute stale local data.

## Non-goals

- The request-time series will represent POWER's regional bounding rectangle, not an exact polygon-weighted average. The UI and provenance must describe this accurately.
- This task does not add simultaneous multi-variable comparison; the case selects one variable at a time, with multiple supported variables available as choices.
- The panel integration is included because request-time analysis is only usable when all POWER parameters can be found and submitted explicitly.
- No observation-response cache, background refresh job, or prefetch is introduced; each explicit calculation triggers a provider request. The variable metadata catalogue may use a short in-process cache.
- POWER Manager results describe variables and units, not climate observations. They may be cached in memory only to avoid duplicate catalogue requests.
- The change does not claim that POWER's newest month is current-month data. POWER documents its meteorological monthly series through the previous year.

## Approaches

1. **POWER regional monthly endpoint using each region's bbox (selected).** One request per selected region for the chosen variable and year range. This retains regional semantics better than a point sample and uses the existing `Region.bbox` contract. NASA documents monthly regional requests and limits them to one parameter per regional request.
2. **POWER monthly point endpoint at the region centroid.** Simpler requests and multiple parameters can be sent for one point, but results would describe only a single grid point rather than the selected region, so this is not selected.
3. **Prebuilt local series.** Fast and deterministic but does not satisfy the confirmed requirement that each Calculate action fetch fresh data from POWER.

## Runtime flow

1. `/api/py/variables` obtains the current monthly parameter catalogue from POWER Manager for the canonical AG community. This exposes all unique parameter codes; RE and SB currently return the same codes but some parameters have different units there.
2. The browser holds the selected parameter, region ids, years, and season in the case state.
3. The user presses Calculate. The browser sends one `POST /api/py/analyze` with the existing `CaseRequest` shape; the parameter resolves to its POWER community.
4. Python validates the parameter, region ids, year range, and season. It maps `Region.bbox = (west, south, east, north)` to POWER's longitude/latitude bounds.
5. Python requests `https://power.larc.nasa.gov/api/temporal/monthly/regional` with the selected parameter, its POWER community, requested years, and JSON output. For up to four selected regions, fetch each region's response; regional requests contain one variable each.
6. POWER returns a GeoJSON FeatureCollection with one feature per grid cell in the requested bbox. Python reads each feature's monthly values, ignores `YYYY13` annual summary keys, converts the header's fill sentinel to missing, and calculates a per-month `cos(latitude)`-weighted mean across valid cells.
7. Python passes that regional monthly series through the existing anomaly, seasonal/yearly aggregation, and verdict functions.
8. The response continues to include monthly values, yearly/seasonal values, fit, statistics, verdict, and provenance. Provenance identifies NASA POWER and the requested regional bounds.
9. A subsequent Calculate action repeats steps 3–8 and does not reuse a previous API response.

## Failure behavior

- Invalid or unsupported variables/regions/periods return a client error with a useful detail.
- POWER timeout, 429, or 5xx returns a provider-unavailable response; provider details and credentials (none are required) are not exposed to the browser.
- Missing values remain missing; they are not converted to zeros.
- The provider response is bounded before JSON parsing; oversized bbox/period responses are reported as unavailable rather than silently replaced by a centroid query.
- A response with no usable monthly observations returns an explicit no-data result or API error consistent with the existing response contract, never a fabricated trend.
- Existing local `.npz` data may remain for offline tests or other features, but `POST /analyze` must not silently fall back to it.

## Files and ownership

Coder B / Oier: `api/**`, `tests/**`, `requirements*.txt`, `lib/api-types.ts` only if the API contract needs a change. Keep `CaseRequest` and `AnalyzeResponse` unchanged; add POWER community/category metadata to `Variable` as needed.

Panel integration: `components/panel/**` — explicit Calculate action, catalogue search, provider-validated availability instead of static empty per-region lists, loading/error state, and a fresh request on every click.

Project docs follow-up: update `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, and the data-engine plan to state that analysis requests fetch POWER data at runtime, while distinguishing offline fixtures from production data.

## Acceptance criteria

- `/api/py/variables` returns every monthly regional parameter from POWER Manager using the canonical AG units and request community.
- `POST /api/py/analyze` calls the POWER regional provider for the requested parameter, bbox, and year bounds.
- Multiple regions trigger one regional request per region and produce a result per selected region.
- POWER JSON is converted to the exact monthly labels, values, and missing-value representation expected by the existing Python engine.
- The analysis response is produced by the existing statistical functions using the fetched values.
- Provider timeout, rate-limit, error status, malformed response, and all-missing data are handled without a local-series fallback.
- A repeated API call makes a new provider request.
- Existing statistical tests pass unchanged; the client integration is not considered complete until Ekaitz wires the Calculate action and an end-to-end case succeeds.

## Source references

- NASA POWER monthly endpoint: https://power.larc.nasa.gov/docs/services/api/temporal/monthly/
- NASA POWER temporal coverage and spatial options: https://power.larc.nasa.gov/docs/services/api/temporal/
- Existing API contract: `api/_models.py`
- Existing Python analysis: `api/index.py`, `api/_engine/series.py`, `api/_engine/verdict.py`
- Existing region bounding boxes: `api/_data/regions.json`
- NASA POWER Manager API: https://power.larc.nasa.gov/docs/services/api/system/manager/
