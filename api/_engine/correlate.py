"""Correlation between two variables for one region (METHODS.md section 12).

De-seasoned monthly anomalies, Pearson primary and Spearman shown, raw and
linearly detrended, p-values on the Bretherton effective sample size, a lag
search over -max_lag..+max_lag months (positive lag: x leads y) and the
"both trending" warning (raw |r| >= 0.5, detrended |r| < 0.3).
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from scipy.special import stdtr

from .trend import _ranks


@dataclass(frozen=True)
class Correlation:
    n: int
    n_eff: float
    pearson_raw: float | None
    pearson_detrended: float | None
    spearman_raw: float | None
    spearman_detrended: float | None
    p_raw: float | None
    p_detrended: float | None
    best_lag: int | None
    best_lag_r: float | None
    lags: list[tuple[int, float | None]]
    scatter: list[tuple[str, float, float]]
    warning: str | None


def _pair(x: np.ndarray, y: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    ok = np.isfinite(x) & np.isfinite(y)
    return x[ok], y[ok]


def _pearson(x: np.ndarray, y: np.ndarray) -> float | None:
    a, b = _pair(x, y)
    if a.size < 3 or np.std(a) == 0 or np.std(b) == 0:
        return None
    return float(np.corrcoef(a, b)[0, 1])


def _spearman(x: np.ndarray, y: np.ndarray) -> float | None:
    a, b = _pair(x, y)
    if a.size < 3:
        return None
    return _pearson(_ranks(a), _ranks(b))


def _lag1(x: np.ndarray) -> float:
    """Lag-1 autocorrelation over consecutive months; missing months are not bridged."""
    r = _pearson(x[:-1], x[1:])
    return 0.0 if r is None else r


def _detrend(x: np.ndarray) -> np.ndarray:
    t = np.arange(x.size, dtype=float)
    ok = np.isfinite(x)
    out = np.full_like(x, np.nan, dtype=float)
    if ok.sum() < 3:
        return out
    slope, intercept = np.polyfit(t[ok], x[ok], 1)
    out[ok] = x[ok] - (slope * t[ok] + intercept)
    return out


def _n_eff(n: int, x: np.ndarray, y: np.ndarray) -> float:
    rx, ry = _lag1(x), _lag1(y)
    product = rx * ry
    if product <= -1:
        return float(n)
    return float(min(n, n * (1 - product) / (1 + product)))


def _p_value(r: float | None, n_eff: float) -> float | None:
    if r is None or n_eff <= 2 or abs(r) >= 1:
        return None
    df = n_eff - 2
    t = abs(r) * np.sqrt(df / (1 - r * r))
    return float(min(1.0, 2 * stdtr(df, -t)))


def _shift(x: np.ndarray, y: np.ndarray, lag: int) -> tuple[np.ndarray, np.ndarray]:
    """Pair x(t) with y(t + lag) on the monthly grid."""
    if lag > 0:
        return x[:-lag], y[lag:]
    if lag < 0:
        return x[-lag:], y[:lag]
    return x, y


def correlate_anomalies(labels: list[str], x: np.ndarray, y: np.ndarray, max_lag: int = 6) -> Correlation:
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    paired = np.isfinite(x) & np.isfinite(y)
    n = int(paired.sum())
    xd, yd = _detrend(x), _detrend(y)

    r_raw, r_det = _pearson(x, y), _pearson(xd, yd)
    n_eff_raw, n_eff_det = _n_eff(n, x, y), _n_eff(int((np.isfinite(xd) & np.isfinite(yd)).sum()), xd, yd)

    lags: list[tuple[int, float | None]] = []
    for lag in range(-max_lag, max_lag + 1):
        a, b = _shift(x, y, lag)
        lags.append((lag, _pearson(a, b)))
    scored = [(lag, r) for lag, r in lags if r is not None]
    best_lag, best_r = max(scored, key=lambda item: abs(item[1])) if scored else (None, None)

    warning = "both_trending" if r_raw is not None and r_det is not None and abs(r_raw) >= 0.5 and abs(r_det) < 0.3 else None
    scatter = [(label, float(a), float(b)) for label, a, b, ok in zip(labels, x, y, paired) if ok]
    return Correlation(
        n=n,
        n_eff=n_eff_raw,
        pearson_raw=r_raw,
        pearson_detrended=r_det,
        spearman_raw=_spearman(x, y),
        spearman_detrended=_spearman(xd, yd),
        p_raw=_p_value(r_raw, n_eff_raw),
        p_detrended=_p_value(r_det, n_eff_det),
        best_lag=best_lag,
        best_lag_r=best_r,
        lags=lags,
        scatter=scatter,
        warning=warning,
    )
