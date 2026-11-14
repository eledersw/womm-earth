"""Build annual and seasonal means from monthly regional values."""

import numpy as np

from .config import ANNUAL_MIN_MONTHS, SEASON_MIN_FRACTION


_SEASONS = {
    "DJF": [12, 1, 2],
    "MAM": [3, 4, 5],
    "JJA": [6, 7, 8],
    "SON": [9, 10, 11],
}


def _month_index(year: int, month: int, base_year: int, base_month: int) -> int:
    return (year - base_year) * 12 + month - base_month


def yearly_series(
    values: np.ndarray,
    t0: str,
    start: int,
    end: int,
    season: str,
    months: list[int] | None,
) -> tuple[np.ndarray, np.ndarray]:
    """Return requested years and means, retaining NaN for missing observations."""
    base_year, base_month = map(int, t0.split("-"))
    values = np.asarray(values, dtype=float)
    selected = list(range(1, 13)) if season == "ANN" else (
        months if season == "CUSTOM" else _SEASONS[season]
    )
    if not selected:
        raise ValueError("season months cannot be empty")
    wraps = season != "ANN" and selected[0] > selected[-1]
    years = []
    means = []
    for year in range(start, end + 1):
        dates = [(year - (wraps and month >= selected[0]), month) for month in selected]
        if any(y < start or y > end for y, _ in dates):
            continue
        indices = [_month_index(y, m, base_year, base_month) for y, m in dates]
        if season != "ANN" and any(i < 0 or i >= len(values) for i in indices):
            continue
        observed = np.array([values[i] if 0 <= i < len(values) else np.nan for i in indices])
        minimum = ANNUAL_MIN_MONTHS if season == "ANN" else len(selected) * SEASON_MIN_FRACTION
        years.append(year)
        means.append(float(np.mean(observed[np.isfinite(observed)])) if np.isfinite(observed).sum() >= minimum else np.nan)
    return np.asarray(years, dtype=int), np.asarray(means, dtype=float)


def monthly_with_anomalies(
    values: np.ndarray, t0: str, start: int, end: int
) -> tuple[list[str], np.ndarray, np.ndarray]:
    """Return period months, raw values and calendar-month anomalies."""
    base_year, base_month = map(int, t0.split("-"))
    values = np.asarray(values, dtype=float)
    labels = []
    selected = []
    for year in range(start, end + 1):
        for month in range(1, 13):
            index = _month_index(year, month, base_year, base_month)
            labels.append(f"{year}-{month:02d}")
            selected.append(values[index] if 0 <= index < len(values) else np.nan)
    raw = np.asarray(selected, dtype=float)
    anomalies = raw.copy()
    for month in range(12):
        subset = raw[month::12]
        finite = subset[np.isfinite(subset)]
        anomalies[month::12] -= float(np.mean(finite)) if finite.size else np.nan
    return labels, raw, anomalies
