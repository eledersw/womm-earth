# NASA POWER Live Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Discover every NASA POWER monthly regional parameter, fetch the selected regional series when the user calculates a case, then run the existing Python analysis on those returned values.

**Architecture:** Keep `POST /api/py/analyze` and its request/response contract. Discover variable descriptions and units through NASA POWER Manager, retain each parameter's request community, and use POWER Monthly Regional to fetch observations for each submitted region. Pass the returned monthly values through the existing series and verdict functions. Static region geometry remains local lookup metadata; variable metadata comes from POWER; climate observations for each calculation come from POWER.

**Tech Stack:** Python 3.12, FastAPI, stdlib `urllib`/`asyncio`, existing NumPy/SciPy analysis engine, NASA POWER Manager and Monthly Regional JSON APIs.

**Spec:** `docs/superpowers/specs/2026-11-14-power-live-analysis-design.md`

## Global Constraints

- Keep `api/index.py` as the only Vercel Python entrypoint; internal modules stay below `api/_engine/`.
- Preserve `CaseRequest`, `AnalyzeResponse`, the statistical methods, seasonal behavior, and current numerical thresholds.
- Do not fall back to `.npz` or hero files in `POST /api/py/analyze`.
- Every explicit analyze request performs a new NASA POWER data request; do not add a response cache.
- POWER regional requests use the existing region bbox `(west, south, east, north)` and one parameter per request.
- Query the POWER Manager monthly catalogue using AG as the canonical community. Live inspection found the same 1,388 parameter codes in AG, RE, and SB, while some units differ; use AG metadata and send data requests with AG so labels match values.
- Variable catalogue metadata may be cached in process; observation responses must never be cached.
- Keep API and contract changes in Oier's area; include the panel integration required to make live variables selectable and calculate only on explicit submission.

## Review Focus

- NASA POWER returns a non-200 response, rate limit, timeout, or malformed JSON: surface a safe provider error; never manufacture a series.
- POWER uses fill values: convert them to NaN so annual/seasonal validity rules remain effective.
- Requested years have gaps or start before POWER data: retain the requested monthly index and represent absent values as NaN.
- Multiple regions: preserve submitted order and make one provider request per region for the selected parameter.
- Repeating the same request: call POWER again instead of returning an earlier cached response.

## Files and Interfaces

- Create `api/_engine/power.py`: fetches and normalizes the Manager parameter catalogue, builds the POWER Monthly Regional URL, performs HTTP without blocking the async route, validates JSON, and returns `(values: np.ndarray, t0: str)`.
- Modify `api/_models.py`: add optional POWER community and category metadata to `Variable`; keep `CaseRequest` and `AnalyzeResponse` stable.
- Modify `api/index.py`: return the live POWER Manager catalogue from `/variables`; use the POWER client for `/api/py/analyze`, gather one fetched series per selected region, and feed each series to the existing analysis path.
- Regenerate `api/openapi.json` and `lib/api-types.ts` if the additive variable metadata changes the contract.
- Modify `docs/ARCHITECTURE.md`: replace the offline-store runtime description for `analyze` with the POWER request-time flow and document the region bbox semantics.
- Modify `docs/PROJECT.md`: append a decision that supersedes the H0 prebuilt-series runtime choice for case analysis.
- The existing `/variables` schema has no field for the POWER community used for each code. Additive Variable fields are needed so `/analyze` can request the correct community without changing `CaseRequest`.
- Panel integration: add a searchable POWER catalogue, stop treating static `valid_variables` as authoritative for live requests, and add an explicit Calculate action that sends a fresh request on every click.

## Tasks

### Task 1: Discover the POWER monthly parameter catalogue

**Files:**
- Create: `api/_engine/power.py`
- Modify: `api/_models.py`
- Regenerate if required: `api/openapi.json`, `lib/api-types.ts`

**Interface:**
- `async def list_monthly_parameters() -> list[Variable]`
- Query the NASA Manager parameter endpoint for monthly metadata from AG. The current Manager response has the same parameter-code set in AG, RE, and SB; AG is canonical because its units match the regional data request.
- Map NASA metadata to the existing Variable fields: POWER code, name, units, definition, and conservative defaults for fields NASA does not supply. Add `power_community` and `power_type` to Variable for provider requests and accurate classification.
- If Manager metadata lacks a parameter-specific coverage start, use the documented broad lower bound and preserve missing values from POWER as missing observations; do not claim every variable has data for every year.
- `async def fetch_monthly_region(variable: Variable, region: Region, start: int, end: int) -> tuple[np.ndarray, str]`
- Use `https://power.larc.nasa.gov/api/temporal/monthly/regional` with `parameters=variable.id`, `community=variable.power_community`, region bounds mapped to `longitude-min/max` and `latitude-min/max`, `start`, `end`, `format=JSON`, and a stable `user` identifier.
- Make the blocking stdlib HTTP request via `asyncio.to_thread`; use a finite timeout.
- Parse `FeatureCollection.features[*].properties.parameter[variable.id]` and each point's latitude. For every `YYYYMM` key with month 01–12, compute the mean weighted by `cos(latitude)` over finite cells; ignore `YYYY13`, absent months, and the header `fill_value`. Return a dense array beginning at `f"{start}-01"`.
- Bound response bytes before JSON parsing and return a provider error when the bbox/period response is too large for the serverless request.
- Raise a small provider exception for network/status/payload failures; do not include a raw upstream body in the client response.

- [ ] Step 1: Implement a Manager request for AG with bounded timeout and explicit HTTP/payload errors.
- [ ] Step 2: Map every monthly Manager parameter into the app's Variable response; retain NASA category and request community metadata.
- [ ] Step 3: Implement URL construction and response parsing as separate private functions with explicit types.
- [ ] Step 4: Implement the async fetch wrapper using stdlib HTTP and finite timeouts.
- [ ] Step 5: Run `python -m compileall -q api/_engine/power.py` and inspect Manager and regional request shapes against NASA's documentation.

### Task 2: Connect `/api/py/analyze` to live POWER data

**Files:**
- Modify: `api/index.py`

**Interface:**
- Keep the endpoint accepting `CaseRequest` and returning `AnalyzeResponse`.
- For each requested region, call `fetch_monthly_region(case.variable, region, case.start, case.end)`.
- Preserve region order in the response. Fetch regions sequentially to bound memory while decoding POWER's grid-cell responses.
- Pass each fetched series and `t0` through `monthly_with_anomalies`, `yearly_series`, and `analyze_yearly` as today.
- Resolve the selected NASA parameter from the live Manager catalogue and validate region ids. Do not read hero metadata or `.npz` series for this route.
- Map upstream timeout/connection failures, HTTP 429/5xx, and malformed responses to a stable 502/503 API error with a short user-safe message. Let invalid provider parameters be a clear 422-level unsupported-variable response.

- [ ] Step 1: Change `/variables` to return the discovered POWER monthly parameter catalogue.
- [ ] Step 2: Replace `store.get_series` in `analyze` with the live POWER fetch for each region, using the parameter's actual community.
- [ ] Step 3: Reuse the existing monthly/anomaly/yearly/statistics code unchanged.
- [ ] Step 4: Regenerate OpenAPI and TypeScript contract types after the additive Variable fields.
- [ ] Step 5: Run `python -m compileall -q api` and inspect the route to confirm there is no local-series fallback or observation cache.

### Task 3: Align the living architecture docs

**Files:**
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/PROJECT.md`

- [ ] Step 1: Document that case analysis requests NASA POWER at calculation time, the supported spatial operation is its regional bbox, and the seasonal/statistical processing remains in Python.
- [ ] Step 2: Append a dated decision superseding the old prebuilt-library runtime decision; retain the pipeline description only as offline research/build tooling where applicable.
- [ ] Step 3: Run `git diff --check` and verify the docs describe the live request flow and remaining provider/UI limits.

## Completion Notes

- The POWER Manager supplies the variable list dynamically; the local `variables.json` is no longer the source of the selectable catalogue.
- Local `regions.json` and `public/geo/*.geojson` remain because they contain the region ids/bounds and map geometry, not time-series observations.
- `api/_fixtures/*.json` remain test/demo fixtures for endpoints not included in this live-analysis scope. Local synthetic test series are not used by production `/analyze`.
- NASA's meteorological monthly archive currently ends at the previous year; a fresh API request does not imply that the latest calendar month is available.
- The case panel now searches the POWER catalogue, ignores static availability lists for live parameters, and submits only on Calculate. The numerical data request remains in the Oier API.
- Native in-session execution is selected because the task is sequential and the repository rules assign the API files to Oier; no parallel agent work is needed.
