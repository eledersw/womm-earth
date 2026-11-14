import json
import asyncio
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient
from pydantic import TypeAdapter

from _models import (
    AnalyzeResponse,
    CaseRequest,
    CorrelateResponse,
    Health,
    MirrorResponse,
    Region,
    ScanResponse,
    TrendMapResponse,
    Variable,
)
from index import app


FIXTURES = Path(__file__).parents[1] / "api" / "_fixtures"


@pytest.mark.parametrize(
    ("name", "adapter"),
    [
        ("variables", TypeAdapter(list[Variable])),
        ("regions", TypeAdapter(list[Region])),
        ("analyze", TypeAdapter(AnalyzeResponse)),
        ("trendmap", TypeAdapter(TrendMapResponse)),
        ("correlate", TypeAdapter(CorrelateResponse)),
        ("mirror", TypeAdapter(MirrorResponse)),
        ("scan", TypeAdapter(ScanResponse)),
    ],
)
def test_contract_fixtures_validate(name, adapter):
    adapter.validate_json((FIXTURES / f"{name}.json").read_text())


def test_stub_endpoints_match_contract_fixtures():
    checks = [
        ("GET", "/api/py/health", Health, None),
        ("GET", "/api/py/variables", list[Variable], None),
        ("GET", "/api/py/regions", list[Region], None),
        ("POST", "/api/py/analyze", AnalyzeResponse, json.loads((FIXTURES / "analyze.json").read_text())["case"]),
        ("GET", "/api/py/trendmap?variable=T2M&start=2002&end=2025&season=JJA", TrendMapResponse, None),
        ("POST", "/api/py/correlate", CorrelateResponse, {"var_x": "T2M", "var_y": "PRECTOTCORR", "region": "US-WI", "start": 2002, "end": 2025}),
        ("POST", "/api/py/mirror", MirrorResponse, json.loads((FIXTURES / "analyze.json").read_text())["case"]),
        ("POST", "/api/py/scan", ScanResponse, {"region": "US-WI", "start": 2002, "end": 2025}),
    ]
    async def check_endpoints():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            for method, path, model, body in checks:
                response = await client.request(method, path, json=body)
                assert response.status_code == 200, f"{method} {path}: {response.text}"
                TypeAdapter(model).validate_python(response.json())

            regions = (await client.get("/api/py/regions")).json()
            assert any(region["id"] == "US-WI" for region in regions)
            analysis_response = await client.post("/api/py/analyze", json=checks[3][3])
            analysis = AnalyzeResponse.model_validate(analysis_response.json())
            assert analysis.results[0].verdict.tier == "confirmed"

    asyncio.run(check_endpoints())


def test_custom_season_months_must_be_cyclically_contiguous():
    with pytest.raises(ValueError):
        CaseRequest(variable="T2M", regions=["US-WI"], start=2002, end=2025, season="CUSTOM")

    CaseRequest(variable="T2M", regions=["US-WI"], start=2002, end=2025, season="CUSTOM", months=[12, 1, 2])

    with pytest.raises(ValueError):
        CaseRequest(variable="T2M", regions=["US-WI"], start=2002, end=2025, season="CUSTOM", months=[12, 2])
