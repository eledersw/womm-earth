"""Independent edge cases required by METHODS v1 review."""
import numpy as np

from _engine.trend import ols_ar1
from _engine.verdict import analyze_yearly


def test_persistent_residuals_withhold_adjusted_ols_and_years_estimate():
    years = np.arange(2000, 2015)
    rng = np.random.default_rng(621)
    innovations = rng.normal(size=len(years))
    values = np.empty(len(years))
    values[0] = innovations[0]
    for i in range(1, len(years)):
        values[i] = 0.98 * values[i - 1] + 0.1 * innovations[i]
    ols = ols_ar1(years, values)
    assert ols.n_eff <= 2
    assert ols.p is ols.se is ols.ci_low is ols.ci_high is None
    stats, verdict, fit = analyze_yearly(years, values, ratio_scale=False)
    assert stats is not None
    assert stats.tests_agree is None
    assert stats.ols.p is None
    assert verdict.years_needed is None
    assert all(point.ols_low is None and point.ols_high is None for point in fit)


def test_constant_and_exact_linear_series_are_finite():
    years = np.arange(2000, 2020)
    for values, expected_p in [(np.full(20, 4.0), 1.0), (4.0 + 0.125 * np.arange(20), 0.0)]:
        stats, verdict, fit = analyze_yearly(years, values, ratio_scale=False)
        assert stats is not None
        assert stats.phi == 0
        assert stats.ols.se == 0
        assert stats.ols.p == expected_p
        assert stats.ols.ci_low == stats.ols.ci_high == stats.ols.slope
        assert verdict.years_needed is None
        assert all(np.isfinite(point.ols_low) and np.isfinite(point.ols_high) for point in fit)


def test_nonfinite_observations_fail_coverage_gate():
    years = np.arange(2000, 2012)
    values = np.arange(12, dtype=float)
    values[[2, 5, 9]] = np.nan
    stats, verdict, fit = analyze_yearly(years, values, ratio_scale=False)
    assert stats is None and fit == []
    assert verdict.tier == "too_short" and verdict.years_needed is None
