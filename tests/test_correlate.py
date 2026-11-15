"""Correlation engine (METHODS.md section 12)."""
import numpy as np

from api._engine.correlate import correlate_anomalies


def _labels(n):
    return [f"{2000 + i // 12}-{i % 12 + 1:02d}" for i in range(n)]


def test_identical_noise_correlates_perfectly_and_lag_zero_wins():
    rng = np.random.default_rng(1)
    x = rng.normal(size=240)
    r = correlate_anomalies(_labels(240), x, x.copy())
    assert r.pearson_raw is not None and abs(r.pearson_raw - 1) < 1e-9
    assert r.best_lag == 0 and len(r.lags) == 13
    assert r.n == 240 and r.n_eff <= r.n


def test_independent_noise_is_weak_and_not_significant():
    rng = np.random.default_rng(2)
    r = correlate_anomalies(_labels(300), rng.normal(size=300), rng.normal(size=300))
    assert abs(r.pearson_raw) < 0.2 and r.p_raw > 0.05


def test_shared_trend_raises_the_both_trending_warning():
    rng = np.random.default_rng(3)
    t = np.arange(360) / 360
    x = 3 * t + rng.normal(scale=0.3, size=360)
    y = 3 * t + rng.normal(scale=0.3, size=360)
    r = correlate_anomalies(_labels(360), x, y)
    assert r.pearson_raw >= 0.5 and abs(r.pearson_detrended) < 0.3
    assert r.warning == "both_trending"


def test_positive_lag_means_x_leads_y():
    rng = np.random.default_rng(4)
    x = rng.normal(size=300)
    y = np.roll(x, 3)  # y(t + 3) = x(t)
    y[:3] = np.nan
    r = correlate_anomalies(_labels(300), x, y)
    assert r.best_lag == 3 and r.best_lag_r > 0.99


def test_missing_months_are_dropped_not_bridged():
    x = np.array([1.0, np.nan, 3.0, 4.0, 5.0, 2.0])
    r = correlate_anomalies(_labels(6), x, x * 2)
    assert r.n == 5 and len(r.scatter) == 5
