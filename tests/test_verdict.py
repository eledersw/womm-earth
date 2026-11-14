import numpy as np

from _engine.trend import ols_ar1
from _engine.verdict import analyze_yearly, tier_for, years_until_significant


def test_tiers():
    assert tier_for(0.01, 30, 30) == "confirmed"
    assert tier_for(0.10, 30, 30) == "not_proven"
    assert tier_for(0.50, 30, 30) == "no_case"
    assert tier_for(0.01, 8, 8) == "too_short"
    assert tier_for(0.01, 15, 20) == "too_short"


def test_years_needed_monte_carlo():
    needed = years_until_significant(0.02, 0.3, 0.2, 15, 0.1)
    assert needed is not None
    rng = np.random.default_rng(7)
    rejections = 0
    length = 15 + needed
    for _ in range(500):
        noise = np.empty(length)
        noise[0] = rng.normal(0, 0.3)
        for i in range(1, length):
            noise[i] = 0.2 * noise[i - 1] + rng.normal(0, 0.3 * np.sqrt(1 - 0.2**2))
        y = 0.02 * np.arange(length) + noise
        rejections += ols_ar1(np.arange(length), y).p < 0.05
    assert rejections / 500 >= 0.35


def test_pct_hidden_for_temperature():
    years = np.arange(1990, 2020)
    values = 12 + 0.05 * np.arange(30) + np.random.default_rng(1).normal(0, 0.3, 30)
    stats, verdict, fit = analyze_yearly(years, values, ratio_scale=False)
    assert stats is not None
    assert stats.pct_of_mean_per_decade is None
    assert stats.change_per_decade == 10 * stats.sen.slope
    assert stats.total_change == 29 * stats.sen.slope
    assert len(fit) == 30
    assert verdict.tier == "confirmed"


def test_all_missing_returns_too_short():
    stats, verdict, fit = analyze_yearly(np.arange(2000, 2020), np.full(20, np.nan), False)
    assert stats is None
    assert verdict.tier == "too_short"
    assert verdict.reason == "no_data"
    assert fit == []


def test_ratio_scale_reports_pct_per_decade():
    years = np.arange(1990, 2020)
    values = 10 + 0.05 * np.arange(30) + np.random.default_rng(1).normal(0, 0.3, 30)
    stats, _, _ = analyze_yearly(years, values, ratio_scale=True)
    assert stats is not None
    np.testing.assert_allclose(stats.pct_of_mean_per_decade, 100 * stats.change_per_decade / stats.period_mean)
