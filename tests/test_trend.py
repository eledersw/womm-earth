import warnings

import numpy as np
import pymannkendall as reference
from scipy.stats import linregress

from _engine.trend import hamed_rao, mann_kendall, ols_ar1, sens_slope


def test_hamed_rao_matches_pymannkendall():
    rng = np.random.default_rng(17)
    for n in range(30, 46):
        for _ in range(3):
            y = rng.normal(size=n).cumsum() + 0.03 * np.arange(n)
            actual = hamed_rao(y)
            expected = reference.hamed_rao_modification_test(y)
            np.testing.assert_allclose([actual.p, actual.z, actual.var_s], [expected.p, expected.z, expected.var_s], rtol=0, atol=1e-9)


def test_mk_matches_pymannkendall():
    y = np.array([4, 2, 2, 5, 7, 5, 9, 8, 10, 12], dtype=float)
    actual = mann_kendall(y)
    expected = reference.original_test(y)
    np.testing.assert_allclose([actual.s, actual.var_s, actual.z, actual.p, actual.tau], [expected.s, expected.var_s, expected.z, expected.p, expected.Tau])


def test_sen_matches_pymannkendall_slope():
    y = np.array([1, 4, 3, 9, 5, 8, 12, 11, 15, 17], dtype=float)
    x = np.arange(2000, 2010)
    actual = sens_slope(x, y)
    expected = reference.sens_slope(y)
    assert actual.slope == expected.slope
    assert actual.intercept == np.median(y - actual.slope * x)
    assert actual.ci_low <= actual.slope <= actual.ci_high


def test_ols_matches_linregress_when_phi_zero():
    x = np.arange(1980, 2010)
    y = 3 + 0.07 * x + np.random.default_rng(3).normal(size=len(x))
    actual = ols_ar1(x, y)
    expected = linregress(x, y)
    np.testing.assert_allclose(actual.slope, expected.slope, rtol=1e-12)
    assert actual.phi == 0
    assert actual.n_eff == len(x)


def test_known_slope_recovered():
    x = np.arange(1990, 2020)
    y = 0.05 * np.arange(30) + np.random.default_rng(1).normal(0, 0.3, 30)
    ols = ols_ar1(x, y)
    sen = sens_slope(x, y)
    assert ols.ci_low <= 0.05 <= ols.ci_high
    assert sen.ci_low <= 0.05 <= sen.ci_high


def test_constant_series():
    x = np.arange(2000, 2030)
    y = np.full(30, 4.0)
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        assert mann_kendall(y).p == 1
        assert hamed_rao(y).p == 1
        assert sens_slope(x, y).slope == 0
        ols = ols_ar1(x, y)
    assert ols.slope == 0
    assert ols.p == 1
    assert caught == []
