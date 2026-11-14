"""Small deterministic integration checks for live map and scan families."""
import asyncio
import json
from pathlib import Path

import numpy as np

from _engine import map as map_engine, scan as scan_engine, store
from _models import Region, Variable

FIXTURES = Path(__file__).parents[1] / "api" / "_fixtures"


def test_map_uses_combined_live_inference_and_full_family_bh(monkeypatch):
    variable = Variable.model_validate(json.loads((FIXTURES / "variables.json").read_text())[0])
    regions = {r.id: r for r in store.regions().values() if r.id in {"US-WI", "US-CO"}}
    async def monthly(_variable, region, _start, _end):
        trend = 1 if region.id == "US-WI" else -1
        return np.repeat(np.arange(24, dtype=float) * trend, 12), "2002-01"
    monkeypatch.setattr(map_engine, "fetch_monthly_region", monthly)
    family = asyncio.run(map_engine.build_family(variable, regions, 2002, 2025, "ANN", None))
    assert set(family) == set(regions)
    assert all(r.q >= r.p and r.q < 0.05 for r in family.values())
    assert [r.region.id for r in map_engine.select_mirrors("US-WI", family)] == ["US-CO"]


def test_scan_adjusts_all_variable_season_results_together(monkeypatch):
    variable = Variable.model_validate(json.loads((FIXTURES / "variables.json").read_text())[0])
    region = Region.model_validate(next(r for r in json.loads((FIXTURES / "regions.json").read_text()) if r["id"] == "US-WI"))
    async def monthly(_variable, _region, _start, _end):
        return np.repeat(np.arange(24, dtype=float), 12), "2002-01"
    monkeypatch.setattr(scan_engine, "fetch_monthly_region", monthly)
    entries = asyncio.run(scan_engine.build_scan([variable], region, 2002, 2025))
    assert {entry.season for entry in entries} == {"ANN", "DJF", "MAM", "JJA", "SON"}
    assert all(entry.q >= entry.p for entry in entries)
