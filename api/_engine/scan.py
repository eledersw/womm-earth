"""Live variable-by-season scan with one BH family per region and period."""
import asyncio

import numpy as np

from _models import Region, ScanEntry, Variable
from .fdr import bh
from .power import PowerUpstreamError, fetch_monthly_region
from .series import yearly_series
from .verdict import analyze_yearly


async def build_scan(variables: list[Variable], region: Region, start: int, end: int) -> list[ScanEntry]:
    semaphore = asyncio.Semaphore(4)
    seasons = ("ANN", "DJF", "MAM", "JJA", "SON")

    async def one(variable: Variable):
        if start < variable.start_year or end > variable.end_year:
            return []
        async with semaphore:
            try:
                values, t0 = await fetch_monthly_region(variable, region, start, end)
            except PowerUpstreamError as error:
                if error.status_code in {400, 404, 422}:
                    return []
                raise
        entries = []
        for season in seasons:
            years, annual = yearly_series(values, t0, start, end, season, None)
            stats, verdict, _ = analyze_yearly(years, annual, variable.ratio_scale)
            if stats is not None:
                entries.append((variable.id, season, stats.change_per_decade,
                                max(stats.mk.p, stats.ols.p) if stats.ols.p is not None else stats.mk.p, verdict.tier))
        return entries

    rows = [row for group in await asyncio.gather(*(one(v) for v in variables)) for row in group]
    if not rows:
        return []
    q = bh(np.array([row[3] for row in rows]))
    ranked = sorted(zip(rows, q), key=lambda pair: (pair[1], -abs(pair[0][2])))
    return [ScanEntry(variable=v, season=s, slope_per_decade=slope, p=p, q=float(adjusted), tier=tier)
            for (v, s, slope, p, tier), adjusted in ranked]
