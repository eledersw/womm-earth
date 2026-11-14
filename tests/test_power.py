import asyncio
import json
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import pytest

import _engine.power as power
from _engine.power import _manager_url, _regional_url
from _models import Region, Variable


def test_power_request_urls_use_alphanumeric_user():
    variable = Variable(
        id="T2M", name="Temperature", unit="C", source="NASA POWER",
        instrument=None, kind="reanalysis", start_year=1981, end_year=2025,
        land_only=False, ratio_scale=False, definition_student="Temperature",
        definition_scientist="Temperature at 2 meters", doi=None, signed_off=False,
        power_community="AG", power_type="METEOROLOGY",
    )
    region = Region(
        id="US-WI", name="Wisconsin", type="state", centroid=(44.5, -89.6),
        bbox=(-92.9, 42.5, -86.8, 47.1), nearest_cell_fallback=False,
        valid_variables=[], parent="USA",
    )

    urls = [_manager_url("AG"), _regional_url(variable, region, 2002, 2024)]

    assert [parse_qs(urlparse(url).query)["user"][0] for url in urls] == ["wommearth", "wommearth"]


def test_monthly_catalog_excludes_hourly_variants(monkeypatch):
    parameters = {
        "T2M": {"temporal": "MONTHLY", "type": "METEOROLOGY", "units": "C", "name": "Temperature at 2 Meters"},
        "T2M_00": {"temporal": "MONTHLY", "type": "METEOROLOGY", "units": "C", "name": "Temperature at 2 Meters at 00 Hour"},
        "T2M_HR": {"temporal": "MONTHLY", "type": "OTHER", "units": "", "name": "Temperature (Hour-Based Parameter Set)"},
        "PRECTOTCORR": {"temporal": "MONTHLY", "type": "METEOROLOGY", "units": "mm/day", "name": "Precipitation"},
        "UNREVIEWED": {"temporal": "MONTHLY", "type": "METEOROLOGY", "units": "C", "name": "Unreviewed parameter"},
        "DAILY_ONLY": {"temporal": "DAILY", "type": "METEOROLOGY", "units": "C", "name": "Daily temperature"},
    }
    monkeypatch.setattr(power, "_request_json", lambda _url: parameters)
    monkeypatch.setattr(power, "_catalog_cache", ())
    monkeypatch.setattr(power, "_catalog_expires_at", 0.0)

    variables = power._load_monthly_parameters()

    assert [variable.id for variable in variables] == ["PRECTOTCORR", "T2M"]
    assert variables[1].signed_off is True
    assert variables[1].definition_student.startswith("How warm the air is")


def test_approved_aod_uses_verified_start_year(monkeypatch):
    monkeypatch.setattr(power, "_request_json", lambda _url: {
        "AOD_55": {"temporal": "MONTHLY", "type": "RADIATION", "units": "dimensionless", "name": "Aerosol Optical Depth 55"},
    })
    monkeypatch.setattr(power, "_catalog_cache", ())
    monkeypatch.setattr(power, "_catalog_expires_at", 0.0)

    variable, = power._load_monthly_parameters()

    assert variable.start_year == 2001
    assert variable.signed_off is True


def test_approved_catalogue_matches_verified_power_snapshot(monkeypatch):
    snapshot = json.loads((Path(__file__).resolve().parents[1] / "docs/science/catalog/power_verification.json").read_text())
    metadata = {code: entry["metadata"] for code, entry in snapshot["parameters"].items()}
    monkeypatch.setattr(power, "_request_json", lambda _url: metadata)
    monkeypatch.setattr(power, "_catalog_cache", ())
    monkeypatch.setattr(power, "_catalog_expires_at", 0.0)

    variables = power._load_monthly_parameters()

    assert len(variables) == 16
    assert {variable.id for variable in variables} == set(snapshot["parameters"])
    assert all(variable.signed_off for variable in variables)


def test_large_region_is_split_into_valid_power_tiles(monkeypatch):
    variable = power._variable("T2M", {"type": "METEOROLOGY", "units": "C"}, "AG")
    region = Region(id="ESP", name="Spain", type="country", centroid=(-3.5, 40),
                    bbox=(-18, 28, 4, 44), nearest_cell_fallback=False,
                    valid_variables=[], parent=None)
    urls = []

    def request(url):
        urls.append(url)
        n = len(urls)
        return {"features": [{"geometry": {"coordinates": [n - 7, 40]},
                              "properties": {"parameter": {"T2M": {"201001": float(n)}}}}]}

    monkeypatch.setattr(power, "_request_json", request)
    values, _ = asyncio.run(power.fetch_monthly_region(variable, region, 2010, 2010))

    assert len(urls) == 4
    for url in urls:
        query = parse_qs(urlparse(url).query)
        for axis in ("latitude", "longitude"):
            span = float(query[f"{axis}-max"][0]) - float(query[f"{axis}-min"][0])
            assert 2 <= span <= 10
    assert values[0] == pytest.approx(2.5)


def test_small_region_uses_power_point_at_centroid(monkeypatch):
    variable = power._variable("T2M", {"type": "METEOROLOGY", "units": "C"}, "AG")
    region = Region(id="AND", name="Andorra", type="country", centroid=(1.57, 42.54),
                    bbox=(1.41, 42.43, 1.74, 42.64), nearest_cell_fallback=False,
                    valid_variables=[], parent=None)
    urls = []

    def request(url):
        urls.append(url)
        return {"geometry": {"coordinates": [1.57, 42.54]},
                "properties": {"parameter": {"T2M": {"201001": 4.2}}}}

    monkeypatch.setattr(power, "_request_json", request)
    values, _ = asyncio.run(power.fetch_monthly_region(variable, region, 2010, 2010))

    assert len(urls) == 1
    assert "/monthly/point?" in urls[0]
    assert parse_qs(urlparse(urls[0]).query)["latitude"] == ["42.54"]
    assert values[0] == pytest.approx(4.2)


def test_tiled_region_counts_shared_boundary_cell_once():
    variable = power._variable("T2M", {"type": "METEOROLOGY", "units": "C"}, "AG")

    def response(longitude, value):
        return {"features": [{"geometry": {"coordinates": [longitude, 40]},
                              "properties": {"parameter": {"T2M": {"201001": value}}}}]}

    values, _ = power._monthly_region_series(
        [response(1, 1.0), response(1, 1.0), response(2, 3.0)], variable, 2010, 2010,
    )

    assert values[0] == pytest.approx(2.0)
