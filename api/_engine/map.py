"""Request-time map family and mirrors using the same combined verdict p-value."""
from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass

import numpy as np

from _models import Region, Variable
from .fdr import bh
from .power import PowerUpstreamError, fetch_monthly_region
from .series import yearly_series
from .verdict import analyze_yearly


@dataclass(frozen=True)
class MapRecord:
    region: Region
    slope_per_decade: float
    p: float
    q: float
    z: float
    tier: str


_CACHE: dict[tuple, tuple[float, dict[str, MapRecord]]] = {}


async def family_for(variable: Variable, regions: dict[str, Region], start: int, end: int,
                     season: str, months: list[int] | None) -> dict[str, MapRecord]:
    key = (variable.id, start, end, season, tuple(months or ()))
    cached = _CACHE.get(key)
    if cached and cached[0] > time.monotonic():
        return cached[1]
    family = await build_family(variable, regions, start, end, season, months)
    if len(_CACHE) >= 16:
        _CACHE.pop(next(iter(_CACHE)))
    _CACHE[key] = (time.monotonic() + 3600, family)
    return family


async def build_family(variable: Variable, regions: dict[str, Region], start: int, end: int,
                       season: str, months: list[int] | None) -> dict[str, MapRecord]:
    semaphore = asyncio.Semaphore(4)

    async def one(region: Region):
        async with semaphore:
            try:
                values, t0 = await fetch_monthly_region(variable, region, start, end)
            except PowerUpstreamError as error:
                if error.status_code in {400, 404, 422}:
                    return None  # Not available for this variable and region; excluded from BH family.
                raise
        years, annual = yearly_series(values, t0, start, end, season, months)
        stats, verdict, _ = analyze_yearly(years, annual, variable.ratio_scale)
        if stats is None:
            return None
        return region, stats.change_per_decade, max(stats.mk.p, stats.ols.p) if stats.ols.p is not None else stats.mk.p, stats.mk.z, verdict.tier

    found = [item for item in await asyncio.gather(*(one(r) for r in regions.values())) if item]
    if not found:
        return {}
    adjusted = bh(np.array([item[2] for item in found]))
    return {region.id: MapRecord(region, slope, p, float(q), z, tier)
            for (region, slope, p, z, tier), q in zip(found, adjusted)}


def select_mirrors(case_id: str, family: dict[str, MapRecord]) -> list[MapRecord]:
    base = family.get(case_id)
    if base is None or base.q >= 0.05 or base.tier != "confirmed" or base.slope_per_decade == 0:
        return []
    candidates = [r for r in family.values()
                  if r.region.id != case_id and r.region.type == base.region.type
                  and r.region.parent != case_id and base.region.parent != r.region.id
                  and r.q < 0.05 and r.tier == "confirmed"
                  and r.slope_per_decade * base.slope_per_decade < 0]
    return sorted(candidates, key=lambda r: abs(r.z), reverse=True)[:3]
