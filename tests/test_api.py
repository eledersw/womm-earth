import asyncio
import json

import numpy as np
import pytest
from httpx import ASGITransport, AsyncClient

from _engine import store
from _models import Region, Variable
from _engine.power import PowerUpstreamError
import index as api_index

app = api_index.app


@pytest.fixture
def data_dir(tmp_path, monkeypatch):
    data = tmp_path / "_data"
    data.mkdir()
    monkeypatch.setattr(store, "DATA_DIR", data)
    regions = [{
        "id": "US-WI", "name": "Wisconsin", "type": "state", "centroid": [44.5, -89.6],
        "bbox": [-92.9, 42.5, -86.8, 47.1], "nearest_cell_fallback": False,
        "valid_variables": [], "parent": "USA",
    }]
    (data / "regions.json").write_text(json.dumps(regions))
    return data


@pytest.fixture
def power_api(monkeypatch):
    """Mock the remote POWER boundary; production analysis never reads local series."""
    variables = [
        Variable(
            id="GWETROOT", name="Root-zone soil wetness", unit="1", source="NASA POWER",
            instrument=None, kind="reanalysis", start_year=1981, end_year=2025,
            land_only=False, ratio_scale=False, definition_student="Soil wetness.",
            definition_scientist="Monthly root-zone soil wetness.", doi=None, signed_off=False,
            power_community="AG", power_type="METEOROLOGY",
        ),
        Variable(
            id="T2M", name="Temperature", unit="°C", source="NASA POWER",
            instrument=None, kind="reanalysis", start_year=1981, end_year=2025,
            land_only=False, ratio_scale=False, definition_student="Temperature.",
            definition_scientist="Monthly mean temperature.", doi=None, signed_off=False,
            power_community="AG", power_type="METEOROLOGY",
        ),
    ]
    calls = []

    async def list_parameters():
        return variables

    async def fetch_region(variable, region, start, end):
        calls.append((variable.id, region.id, start, end))
        month_count = (end - start + 1) * 12
        absolute_months = np.arange((start - 1981) * 12, (end - 1981 + 1) * 12)
        values = 10 + 0.02 * absolute_months + np.tile(np.arange(12), end - start + 1)
        assert len(values) == month_count
        return values, f"{start}-01"

    monkeypatch.setattr(api_index, "list_monthly_parameters", list_parameters)
    monkeypatch.setattr(api_index, "fetch_monthly_region", fetch_region)
    return {"variables": variables, "calls": calls}


async def request(method, path, body=None):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        return await client.request(method, path, json=body)


def case(**changes):
    result = {"variable": "T2M", "regions": ["US-WI"], "start": 1981, "end": 2024, "season": "ANN"}
    result.update(changes)
    return result


def test_analyze_uses_fresh_power_series(data_dir, power_api):
    response = asyncio.run(request("POST", "/api/py/analyze", case()))
    assert response.status_code == 200, response.text
    result = response.json()["results"][0]
    assert len(result["yearly"]) == 44
    assert len(result["monthly"]) == 44 * 12
    assert result["yearly"][0]["value"] == pytest.approx(15.61)
    assert result["stats"]["n_years"] == 44
    assert result["verdict"]["tier"] in {"confirmed", "not_proven", "no_case"}
    assert result["provenance"]["source"] == "NASA POWER"
    assert power_api["calls"] == [("T2M", "US-WI", 1981, 2024)]


def test_analyze_too_short(data_dir, power_api):
    response = asyncio.run(request("POST", "/api/py/analyze", case(start=2000, end=2005)))
    assert response.status_code == 200, response.text
    result = response.json()["results"][0]
    assert result["verdict"]["tier"] == "too_short"
    assert result["stats"] is None


def test_point_fallback_is_disclosed(data_dir, power_api, monkeypatch):
    small = Region(id="AND", name="Andorra", type="country", centroid=(1.57, 42.54),
                   bbox=(1.41, 42.43, 1.74, 42.64), nearest_cell_fallback=False,
                   valid_variables=[], parent=None)
    monkeypatch.setattr(store, "regions", lambda: {"AND": small})

    response = asyncio.run(request("POST", "/api/py/analyze", case(regions=["AND"])))

    assert response.status_code == 200
    assert "nearest_cell_fallback" in response.json()["results"][0]["warnings"]


def test_unknown_ids_422(data_dir, power_api):
    for invalid in (case(variable="UNKNOWN"), case(regions=["UNKNOWN"])):
        response = asyncio.run(request("POST", "/api/py/analyze", invalid))
        assert response.status_code == 422
        assert "UNKNOWN" in response.text


def test_variables_from_power_catalog(data_dir, power_api):
    variables = asyncio.run(request("GET", "/api/py/variables")).json()
    regions = asyncio.run(request("GET", "/api/py/regions")).json()
    assert [variable["id"] for variable in variables] == ["GWETROOT", "T2M"]
    assert all(variable["power_community"] == "AG" for variable in variables)
    assert [region["id"] for region in regions] == ["US-WI"]


def test_power_error_does_not_fall_back_to_local_series(data_dir, power_api, monkeypatch):
    np.savez(data_dir / "series_T2M.npz", values=np.full((1, 12 * 12), 2.0),
             region_ids=np.array(["US-WI"]), t0="2000-01")

    async def unavailable(*_args):
        raise PowerUpstreamError("no monthly data", status_code=422)

    monkeypatch.setattr(api_index, "fetch_monthly_region", unavailable)
    response = asyncio.run(request("POST", "/api/py/analyze", case(start=2000, end=2011)))
    assert response.status_code == 422
    assert "NASA POWER" in response.text


def test_case_cli_prints_stats_and_json(data_dir, power_api, capsys):
    from scripts.case_cli import main

    assert main(["--var", "T2M", "--region", "US-WI", "--start", "1981", "--end", "2024"]) == 0
    table = capsys.readouterr().out
    for label in ("Slope/decade", "MK p", "Naive MK p", "OLS p", "Tests agree", "Tier", "Years needed", "Warnings"):
        assert label in table

    assert main(["--var", "T2M", "--region", "US-WI", "--start", "1981", "--end", "2024", "--json"]) == 0
    result = json.loads(capsys.readouterr().out)
    assert result["results"][0]["stats"]["n_years"] == 44
