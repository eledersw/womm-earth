"""Trend estimators on one observation per year.

Runtime uses numpy and scipy.special only. The Hamed-Rao calculation follows
pymannkendall 1.4.3, including its significant-lag rule.
"""

from dataclasses import dataclass

import numpy as np
from scipy.special import ndtr, ndtri, stdtr, stdtrit

from .config import ALPHA, PHI_CLIP


@dataclass(frozen=True)
class OlsFit:
    slope: float
    intercept: float
    se: float
    p: float
    ci_low: float
    ci_high: float
    r2: float
    n_eff: float
    phi: float
    resid_sd: float


@dataclass(frozen=True)
class MkFit:
    s: float
    var_s: float
    z: float
    p: float
    tau: float


@dataclass(frozen=True)
class SenFit:
    slope: float
    intercept: float
    ci_low: float
    ci_high: float


def _clean(y: np.ndarray) -> np.ndarray:
    return np.asarray(y, dtype=float)[np.isfinite(y)]


def _mk_score_variance(y: np.ndarray) -> tuple[float, float]:
    n = len(y)
    s = float(sum(np.sign(y[i + 1 :] - y[i]).sum() for i in range(n - 1)))
    _, counts = np.unique(y, return_counts=True)
    var_s = float((n * (n - 1) * (2 * n + 5) - np.sum(counts * (counts - 1) * (2 * counts + 5))) / 18)
    return s, var_s


def _mk_fit(s: float, var_s: float, n: int) -> MkFit:
    z = float(np.sign(s) * (abs(s) - 1) / np.sqrt(var_s)) if s and var_s > 0 else 0.0
    p = float(2 * (1 - ndtr(abs(z))))
    tau = float(s / (n * (n - 1) / 2)) if n > 1 else 0.0
    return MkFit(s, var_s, z, p, tau)


def mann_kendall(y: np.ndarray) -> MkFit:
    y = _clean(y)
    s, var_s = _mk_score_variance(y)
    return _mk_fit(s, var_s, len(y))


def _pairwise_slopes(x: np.ndarray, y: np.ndarray) -> np.ndarray:
    return np.concatenate([(y[i + 1 :] - y[i]) / (x[i + 1 :] - x[i]) for i in range(len(y) - 1)])


def _ranks(y: np.ndarray) -> np.ndarray:
    order = np.argsort(y, kind="stable")
    sorted_values = y[order]
    _, starts, counts = np.unique(sorted_values, return_index=True, return_counts=True)
    sorted_ranks = np.empty(len(y), dtype=float)
    for start, count in zip(starts, counts):
        sorted_ranks[start : start + count] = start + (count + 1) / 2
    ranks = np.empty(len(y), dtype=float)
    ranks[order] = sorted_ranks
    return ranks


def hamed_rao(y: np.ndarray, alpha: float = ALPHA) -> MkFit:
    y = _clean(y)
    n = len(y)
    s, var_s = _mk_score_variance(y)
    if n < 4 or var_s == 0:
        return _mk_fit(s, var_s, n)
    x = np.arange(n, dtype=float)
    slope = float(np.median(_pairwise_slopes(x, y)))
    ranks = _ranks(y - np.arange(1, n + 1) * slope)
    centered = ranks - ranks.mean()
    acov = np.correlate(centered, centered, "full")[n - 1 :] / n
    if acov[0] == 0:
        return _mk_fit(s, var_s, n)
    acf = acov / acov[0]
    interval = ndtri(1 - alpha / 2) / np.sqrt(n)
    sni = sum((n - lag) * (n - lag - 1) * (n - lag - 2) * acf[lag]
              for lag in range(1, n) if abs(acf[lag]) > interval)
    corrected = var_s * (1 + 2 * sni / (n * (n - 1) * (n - 2)))
    return _mk_fit(s, float(corrected), n)


def sens_slope(x: np.ndarray, y: np.ndarray, alpha: float = ALPHA) -> SenFit:
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    valid = np.isfinite(x) & np.isfinite(y)
    x, y = x[valid], y[valid]
    if len(y) < 2:
        return SenFit(0.0, float(y[0]) if len(y) else 0.0, 0.0, 0.0)
    slopes = np.sort(_pairwise_slopes(x, y))
    slope = float(np.median(slopes))
    intercept = float(np.median(y - slope * x))
    # METHODS §7: the CI uses the same corrected variance as the primary test.
    correction = hamed_rao(y, alpha).var_s
    c = ndtri(1 - alpha / 2) * np.sqrt(max(0.0, correction))
    count = len(slopes)
    low = max(0, int(np.floor((count - c) / 2)))
    high = min(count - 1, int(np.ceil((count + c) / 2)))
    return SenFit(slope, intercept, float(slopes[low]), float(slopes[high]))


def ols_ar1(x: np.ndarray, y: np.ndarray, alpha: float = ALPHA) -> OlsFit:
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    valid = np.isfinite(x) & np.isfinite(y)
    x, y = x[valid], y[valid]
    n = len(y)
    if n < 3:
        raise ValueError("OLS needs at least three valid years")
    dx, dy = x - x.mean(), y - y.mean()
    sxx = float(dx @ dx)
    if sxx == 0:
        raise ValueError("OLS needs distinct years")
    slope = float((dx @ dy) / sxx)
    intercept = float(y.mean() - slope * x.mean())
    residual = dy - slope * dx
    rss = float(residual @ residual)
    resid_sd = float(np.sqrt(rss / (n - 2)))
    if rss == 0:
        phi = 0.0
    else:
        phi = float(np.corrcoef(residual[:-1], residual[1:])[0, 1])
        if not np.isfinite(phi):
            phi = 0.0
    phi = float(np.clip(phi, *PHI_CLIP))
    n_eff = max(3.0, n * (1 - phi) / (1 + phi))
    se = float(resid_sd / np.sqrt(sxx) * np.sqrt((n - 2) / (n_eff - 2)))
    if se == 0:
        p = 1.0 if slope == 0 else 0.0
    else:
        p = float(2 * stdtr(n_eff - 2, -abs(slope / se)))
    critical = float(stdtrit(n_eff - 2, 1 - alpha / 2))
    r2 = float(1 - rss / (dy @ dy)) if dy @ dy else 1.0
    return OlsFit(slope, intercept, se, p, slope - critical * se,
                  slope + critical * se, r2, n_eff, phi, resid_sd)
