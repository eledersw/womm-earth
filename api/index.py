"""FastAPI entrypoint — the ONLY Vercel Python function in api/.

Stub created by Eleder in the scaffold; owned by Oier from the first merge on
(docs/process/OWNERSHIP.md). Keep every other Python module in an
underscore-prefixed folder (api/_engine/, api/_data/, ...) so Vercel doesn't
turn it into its own function.
"""

import json
import sys
import time
from pathlib import Path

_IMPORT_START = time.perf_counter()
sys.path.insert(0, str(Path(__file__).parent))

import numpy  # noqa: E402
import scipy  # noqa: E402
from fastapi import FastAPI, HTTPException, Query, Response  # noqa: E402
from pydantic import ValidationError  # noqa: E402
from _models import (  # noqa: E402
    AnalyzeResponse,
    CaseRequest,
    CorrelateRequest,
    CorrelateResponse,
    Health,
    MirrorResponse,
    MirrorRequest,
    MirrorBase,
    MirrorEntry,
    MonthlyPoint,
    Provenance,
    Region,
    RegionAnalysis,
    ScanRequest,
    ScanResponse,
    TrendMapRequest,
    TrendMapResponse,
    TrendMapEntry,
    Variable,
    YearlyPoint,
)
from _engine import store  # noqa: E402
from _engine.power import PowerUpstreamError, fetch_monthly_region, list_monthly_parameters, uses_point_fallback  # noqa: E402
from _engine.series import monthly_with_anomalies, yearly_series  # noqa: E402
from _engine.verdict import analyze_yearly  # noqa: E402
from _engine.map import family_for  # noqa: E402
from _engine.scan import build_scan  # noqa: E402

app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

# Time spent importing this module (numpy, scipy, FastAPI): the cold-start cost.
_COLD_START_MS = round((time.perf_counter() - _IMPORT_START) * 1000, 1)


def _fixture(name: str):
    return (Path(__file__).parent / "_fixtures" / f"{name}.json").read_text(encoding="utf-8")


@app.get("/api/py/health", response_model=Health)
async def health() -> Health:
    return {
        "ok": True,
        "python": sys.version.split()[0],
        "numpy": numpy.__version__,
        "scipy": scipy.__version__,
        "cold_start_ms": _COLD_START_MS,
    }


@app.get("/api/py/variables", response_model=list[Variable])
async def variables() -> list[Variable]:
    try:
        return await list_monthly_parameters()
    except PowerUpstreamError as error:
        raise HTTPException(
            status_code=503,
            detail="NASA POWER variable catalogue is temporarily unavailable.",
        ) from error


@app.get("/api/py/regions", response_model=list[Region])
async def regions() -> list[Region]:
    return list(store.regions().values())


@app.post("/api/py/analyze", response_model=AnalyzeResponse)
async def analyze(case: CaseRequest) -> AnalyzeResponse:
    try:
        variables_by_id = {variable.id: variable for variable in await list_monthly_parameters()}
    except PowerUpstreamError as error:
        raise HTTPException(
            status_code=503,
            detail="NASA POWER variable catalogue is temporarily unavailable.",
        ) from error
    regions_by_id = store.regions()
    if case.variable not in variables_by_id:
        raise HTTPException(status_code=422, detail=f"Unknown variable: {case.variable}")
    unknown = [region for region in case.regions if region not in regions_by_id]
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown region: {unknown[0]}")

    variable = variables_by_id[case.variable]
    results = []
    for region_id in case.regions:
        region = regions_by_id[region_id]
        try:
            values, t0 = await fetch_monthly_region(variable, region, case.start, case.end)
        except PowerUpstreamError as error:
            status_code = 422 if error.status_code in {400, 404, 422} else (
                502 if error.status_code is not None else 503
            )
            detail = (
                "NASA POWER cannot serve this variable for the selected request."
                if status_code == 422
                else "NASA POWER regional data is temporarily unavailable."
            )
            raise HTTPException(status_code=status_code, detail=detail) from error
        labels, raw, anomalies = monthly_with_anomalies(values, t0, case.start, case.end)
        years, annual = yearly_series(values, t0, case.start, case.end, case.season, case.months)
        stats, verdict, fit = analyze_yearly(years, annual, variable.ratio_scale)
        monthly = [MonthlyPoint(t=label, value=float(value) if numpy.isfinite(value) else None,
                                anomaly=float(anomaly) if numpy.isfinite(anomaly) else None)
                   for label, value, anomaly in zip(labels, raw, anomalies)]
        yearly = [YearlyPoint(year=int(year), value=float(value) if numpy.isfinite(value) else None)
                  for year, value in zip(years, annual)]
        warnings = []
        if uses_point_fallback(region):
            warnings.append("nearest_cell_fallback")
        if stats is not None and stats.tests_agree is False:
            warnings.append("tests_disagree")
        if stats is not None and stats.tests_agree is None:
            warnings.append("ols_unavailable")
        results.append(RegionAnalysis(
            region=region, monthly=monthly, yearly=yearly, fit=fit, stats=stats,
            verdict=verdict,
            provenance=Provenance(
                source=variable.source,
                instrument=variable.instrument,
                product=None, doi=variable.doi, kind=variable.kind,
            ),
            warnings=warnings,
        ))
    return AnalyzeResponse(case=case, results=results)


@app.get("/api/py/trendmap", response_model=TrendMapResponse)
async def trendmap(
    response: Response,
    variable: str,
    start: int,
    end: int,
    season: str = "ANN",
    months: list[int] | None = Query(default=None),
) -> TrendMapResponse:
    try:
        TrendMapRequest(variable=variable, start=start, end=end, season=season, months=months)
    except ValidationError as error:
        detail = error.errors(include_context=False, include_url=False)
        raise HTTPException(status_code=422, detail=detail) from error
    try:
        by_id = {item.id: item for item in await list_monthly_parameters()}
        if variable not in by_id:
            raise HTTPException(status_code=422, detail=f"Unknown variable: {variable}")
        family = await family_for(by_id[variable], store.regions(), start, end, season, months)
    except PowerUpstreamError as error:
        raise HTTPException(status_code=503, detail="NASA POWER map data is temporarily unavailable.") from error
    response.headers["Cache-Control"] = "public, max-age=3600, s-maxage=3600"
    return TrendMapResponse(variable=variable, start=start, end=end, season=season,
                            entries={region_id: TrendMapEntry(slope_per_decade=r.slope_per_decade,
                                     p=r.p, q=r.q, tier=r.tier) for region_id, r in family.items()})


@app.post("/api/py/correlate", response_model=CorrelateResponse)
async def correlate(request: CorrelateRequest) -> CorrelateResponse:
    return json.loads(_fixture("correlate"))


@app.post("/api/py/mirror", response_model=MirrorResponse)
async def mirror(case: MirrorRequest) -> MirrorResponse:
    from _engine.map import select_mirrors
    regions_by_id = store.regions()
    if case.regions[0] not in regions_by_id:
        raise HTTPException(status_code=422, detail="Unknown region")
    try:
        by_id = {item.id: item for item in await list_monthly_parameters()}
        if case.variable not in by_id:
            raise HTTPException(status_code=422, detail="Unknown variable")
        family = await family_for(by_id[case.variable], regions_by_id, case.start, case.end, case.season, case.months)
    except PowerUpstreamError as error:
        raise HTTPException(status_code=503, detail="NASA POWER map data is temporarily unavailable.") from error
    base = family.get(case.regions[0])
    if base is None:
        raise HTTPException(status_code=422, detail="No eligible trend for this region")
    mirrors = select_mirrors(base.region.id, family)
    return MirrorResponse(base=MirrorBase(region=base.region.id, slope_per_decade=base.slope_per_decade,
                          p=base.p, z=base.z, tier=base.tier),
                          mirrors=[MirrorEntry(region=r.region.id, slope_per_decade=r.slope_per_decade,
                                   p=r.p, z=r.z) for r in mirrors], none_found=not mirrors)


@app.post("/api/py/scan", response_model=ScanResponse)
async def scan(request: ScanRequest) -> ScanResponse:
    region = store.regions().get(request.region)
    if region is None:
        raise HTTPException(status_code=422, detail="Unknown region")
    try:
        variables = await list_monthly_parameters()
        entries = await build_scan(variables, region, request.start, request.end)
    except PowerUpstreamError as error:
        raise HTTPException(status_code=503, detail="NASA POWER scan data is temporarily unavailable.") from error
    return ScanResponse(region=request.region, entries=entries)
