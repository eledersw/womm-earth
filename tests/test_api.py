import asyncio
import json

import numpy as np
import pytest
from httpx import ASGITransport, AsyncClient

from _engine import store
from index import app


@pytest.fixture
def data_dir(tmp_path, monkeypatch):
    data = tmp_path / "_data"
    data.mkdir()
    monkeypatch.setattr(store, "DATA_DIR", data)
    variables = [{
        "id": "T2M", "name": "Temperature", "unit": "°C", "source": "NASA POWER / MERRA-2",
        "instrument": None, "kind": "reanalysis", "start_year": 1981, "end_year": 2024,
        "land_only": False, "ratio_scale": False, "definition_student": "Temperature.",
        "definition_scientist": "Monthly mean temperature.", "doi": None, "signed_off": True,
    }]
    regions = [{
        "id": "US-WI", "name": "Wisconsin", "type": "state", "centroid": [44.5, -89.6],
        "bbox": [-92.9, 42.5, -86.8, 47.1], "nearest_cell_fallback": False,
        "valid_variables": ["T2M"], "parent": "USA",
    }]
    (data / "variables.json").write_text(json.dumps(variables))
    (data / "regions.json").write_text(json.dumps(regions))
    values = 10 + 0.02 * np.arange(44 * 12) + np.tile(np.arange(12), 44)
    np.savez(data / "series_T2M.npz", values=values[None, :],
             region_ids=np.array(["US-WI"]), t0="1981-01")
    return data


async def request(method, path, body=None):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        return await client.request(method, path, json=body)


def case(**changes):
    result = {"variable": "T2M", "regions": ["US-WI"], "start": 1981, "end": 2024, "season": "ANN"}
    result.update(changes)
    return result


def test_analyze_real_series(data_dir):
    response = asyncio.run(request("POST", "/api/py/analyze", case()))
    assert response.status_code == 200, response.text
    result = response.json()["results"][0]
    assert len(result["yearly"]) == 44
    assert len(result["monthly"]) == 44 * 12
    assert result["yearly"][0]["value"] == pytest.approx(15.61)
    assert result["stats"]["n_years"] == 44
    assert result["verdict"]["tier"] in {"confirmed", "not_proven", "no_case"}
    assert result["provenance"]["source"] == "NASA POWER / MERRA-2"


def test_analyze_too_short(data_dir):
    response = asyncio.run(request("POST", "/api/py/analyze", case(start=2000, end=2005)))
    assert response.status_code == 200, response.text
    result = response.json()["results"][0]
    assert result["verdict"]["tier"] == "too_short"
    assert result["stats"] is None


def test_unknown_ids_422(data_dir):
    for invalid in (case(variable="UNKNOWN"), case(regions=["UNKNOWN"])):
        response = asyncio.run(request("POST", "/api/py/analyze", invalid))
        assert response.status_code == 422
        assert "UNKNOWN" in response.text


def test_variables_from_catalog(data_dir):
    variables = asyncio.run(request("GET", "/api/py/variables")).json()
    regions = asyncio.run(request("GET", "/api/py/regions")).json()
    assert [variable["id"] for variable in variables] == ["T2M"]
    assert [region["id"] for region in regions] == ["US-WI"]


def test_hero_series_precedes_npz_and_supplies_provenance(data_dir):
    hero_dir = data_dir / "hero"
    hero_dir.mkdir()
    (hero_dir / "T2M__US-WI.json").write_text(json.dumps({
        "variable": "T2M", "region": "US-WI", "t0": "2000-01",
        "values": [2.0] * 12 * 12, "source": "Giovanni", "instrument": "MODIS",
        "product": "test", "doi": "doi:test",
    }))
    response = asyncio.run(request("POST", "/api/py/analyze", case(start=2000, end=2011)))
    assert response.status_code == 200, response.text
    result = response.json()["results"][0]
    assert result["yearly"][0]["value"] == 2
    assert result["provenance"]["source"] == "Giovanni"
    assert result["provenance"]["product"] == "test"


def test_missing_known_series_is_too_short(data_dir):
    (data_dir / "series_T2M.npz").unlink()
    response = asyncio.run(request("POST", "/api/py/analyze", case()))
    assert response.status_code == 200, response.text
    result = response.json()["results"][0]
    assert result["verdict"]["reason"] == "no_data"
    assert result["stats"] is None


def test_case_cli_prints_stats_and_json(data_dir, capsys):
    from scripts.case_cli import main

    assert main(["--var", "T2M", "--region", "US-WI", "--start", "1981", "--end", "2024"]) == 0
    table = capsys.readouterr().out
    for label in ("Slope/decade", "MK p", "Naive MK p", "OLS p", "Tests agree", "Tier", "Years needed", "Warnings"):
        assert label in table

    assert main(["--var", "T2M", "--region", "US-WI", "--start", "1981", "--end", "2024", "--json"]) == 0
    result = json.loads(capsys.readouterr().out)
    assert result["results"][0]["stats"]["n_years"] == 44
