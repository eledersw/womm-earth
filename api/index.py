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
from fastapi import FastAPI, Query  # noqa: E402
from _models import (  # noqa: E402
    AnalyzeResponse,
    CaseRequest,
    CorrelateRequest,
    CorrelateResponse,
    Health,
    MirrorResponse,
    Region,
    ScanRequest,
    ScanResponse,
    Season,
    TrendMapResponse,
    Variable,
)

app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

# Time spent importing this module (numpy, scipy, FastAPI): the cold-start cost.
_COLD_START_MS = round((time.perf_counter() - _IMPORT_START) * 1000, 1)


def _fixture(name: str):
    return (Path(__file__).parent / "_fixtures" / f"{name}.json").read_text(encoding="utf-8")


@app.get("/api/py/health", response_model=Health)
async def health() -> Health:
    return {
        "ok": True,
        "numpy": numpy.__version__,
        "scipy": scipy.__version__,
        "cold_start_ms": _COLD_START_MS,
    }


@app.get("/api/py/variables", response_model=list[Variable])
async def variables() -> list[Variable]:
    return json.loads(_fixture("variables"))


@app.get("/api/py/regions", response_model=list[Region])
async def regions() -> list[Region]:
    return json.loads(_fixture("regions"))


@app.post("/api/py/analyze", response_model=AnalyzeResponse)
async def analyze(case: CaseRequest) -> AnalyzeResponse:
    return json.loads(_fixture("analyze"))


@app.get("/api/py/trendmap", response_model=TrendMapResponse)
async def trendmap(
    variable: str,
    start: int,
    end: int,
    season: Season = "ANN",
    months: list[int] | None = Query(default=None),
) -> TrendMapResponse:
    return json.loads(_fixture("trendmap"))


@app.post("/api/py/correlate", response_model=CorrelateResponse)
async def correlate(request: CorrelateRequest) -> CorrelateResponse:
    return json.loads(_fixture("correlate"))


@app.post("/api/py/mirror", response_model=MirrorResponse)
async def mirror(case: CaseRequest) -> MirrorResponse:
    return json.loads(_fixture("mirror"))


@app.post("/api/py/scan", response_model=ScanResponse)
async def scan(request: ScanRequest) -> ScanResponse:
    return json.loads(_fixture("scan"))
