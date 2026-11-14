from urllib.parse import parse_qs, urlparse

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
        "DAILY_ONLY": {"temporal": "DAILY", "type": "METEOROLOGY", "units": "C", "name": "Daily temperature"},
    }
    monkeypatch.setattr(power, "_request_json", lambda _url: parameters)
    monkeypatch.setattr(power, "_catalog_cache", ())
    monkeypatch.setattr(power, "_catalog_expires_at", 0.0)

    variables = power._load_monthly_parameters()

    assert [variable.id for variable in variables] == ["PRECTOTCORR", "T2M"]
