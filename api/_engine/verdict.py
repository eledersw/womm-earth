"""Turn yearly trends into the API's statistics and verdict models."""

import numpy as np
from scipy.special import stdtrit

from _models import FitPoint, Mk, Ols, Sen, TrendStats, Verdict

from .config import (
    ALPHA,
    MIN_YEARS,
    NOT_PROVEN_MAX_P,
    SERIES_MIN_VALID_FRACTION,
    YEARS_NEEDED_MAX,
)
from .trend import hamed_rao, mann_kendall, ols_ar1, sens_slope


def tier_for(p: float, valid_years: int, requested_years: int) -> str:
    if valid_years < MIN_YEARS or requested_years == 0 or valid_years / requested_years < SERIES_MIN_VALID_FRACTION:
        return "too_short"
    if p < ALPHA:
        return "confirmed"
    if p < NOT_PROVEN_MAX_P:
        return "not_proven"
    return "no_case"


def years_until_significant(
    slope: float, resid_sd: float, phi: float, n: int, p_used: float
) -> int | None:
    if p_used < ALPHA or p_used >= NOT_PROVEN_MAX_P or slope == 0 or resid_sd <= 0 or not np.isfinite([slope, resid_sd, phi]).all() or phi >= 1:
        return None
    phi = max(phi, 0.0)
    for m in range(n, n + YEARS_NEEDED_MAX + 1):
        var_b = 12 * resid_sd**2 / (m * (m**2 - 1)) * (1 + phi) / (1 - phi)
        n_eff = m * (1 - phi) / (1 + phi)
        if n_eff > 2 and abs(slope) / np.sqrt(var_b) >= stdtrit(n_eff - 2, 1 - ALPHA / 2):
            return m - n
    return None


def analyze_yearly(
    years: np.ndarray, y: np.ndarray, ratio_scale: bool
) -> tuple[TrendStats | None, Verdict, list[FitPoint]]:
    years = np.asarray(years, dtype=float)
    y = np.asarray(y, dtype=float)
    if years.shape != y.shape:
        raise ValueError("years and values must have the same shape")
    valid = np.isfinite(years) & np.isfinite(y)
    count = int(valid.sum())
    if count < MIN_YEARS or count / max(1, len(y)) < SERIES_MIN_VALID_FRACTION:
        reason = "no_data" if count == 0 else (
            "insufficient_years" if count < MIN_YEARS else "missing_years"
        )
        return None, Verdict(tier="too_short", years_needed=None, reason=reason), []

    x, values = years[valid], y[valid]
    ols = ols_ar1(x, values)
    mk = hamed_rao(values)
    naive = mann_kendall(values)
    sen = sens_slope(x, values)
    period_mean = float(values.mean())
    change_per_decade = float(10 * sen.slope)
    pct = (100 * change_per_decade / period_mean
           if ratio_scale and abs(period_mean) > 1e-9 else None)
    stats = TrendStats(
        n_years=count,
        phi=ols.phi,
        resid_sd=ols.resid_sd,
        ols=Ols(slope=ols.slope, intercept=ols.intercept, se=ols.se,
                p=ols.p, ci_low=ols.ci_low, ci_high=ols.ci_high,
                r2=ols.r2, n_eff=ols.n_eff),
        mk=Mk(p=mk.p, p_naive=naive.p, z=mk.z, tau=mk.tau),
        sen=Sen(slope=sen.slope, intercept=sen.intercept,
                ci_low=sen.ci_low, ci_high=sen.ci_high),
        tests_agree=(ols.p < ALPHA) == (mk.p < ALPHA) if ols.p is not None else None,
        period_mean=period_mean,
        change_per_decade=change_per_decade,
        total_change=float(sen.slope * (x[-1] - x[0])),
        pct_of_mean_per_decade=pct,
    )
    p_used = max(mk.p, ols.p) if ols.p is not None else mk.p
    verdict = Verdict(
        tier=tier_for(p_used, count, len(y)),
        years_needed=years_until_significant(ols.slope, ols.resid_sd, ols.phi, count, p_used) if ols.p is not None else None,
        reason=None,
    )
    critical = float(stdtrit(ols.n_eff - 2, 1 - ALPHA / 2)) if ols.p is not None else None
    s_adj = ols.resid_sd * np.sqrt((count - 2) / (ols.n_eff - 2)) if ols.p is not None else None
    sxx = float(np.sum((x - x.mean()) ** 2))
    fit = []
    for year in x:
        point = ols.intercept + ols.slope * year
        half_width = critical * s_adj * np.sqrt(1 / count + (year - x.mean()) ** 2 / sxx) if critical is not None else None
        fit.append(FitPoint(year=int(year), ols=float(point),
                            ols_low=float(point - half_width) if half_width is not None else None,
                            ols_high=float(point + half_width) if half_width is not None else None,
                            sen=float(sen.intercept + sen.slope * year)))
    return stats, verdict, fit
