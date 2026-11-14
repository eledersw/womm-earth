import numpy as np

from _engine.trend import hamed_rao, mann_kendall


def test_white_noise_empirical_rate_with_capped_hr():
    rng = np.random.default_rng(7)
    rate = np.mean([hamed_rao(rng.normal(size=30)).p < 0.05 for _ in range(1000)])
    # METHODS v1 floors the HR variance factor at one; the uncapped library does not.
    assert 0.03 <= rate <= 0.07


def test_ar1_correction_reduces_but_does_not_control_false_positives():
    rng = np.random.default_rng(8)
    naive = corrected = 0
    for _ in range(1000):
        noise = rng.normal(size=40)
        series = np.empty(40)
        series[0] = noise[0]
        for i in range(1, 40):
            series[i] = 0.6 * series[i - 1] + noise[i]
        naive += mann_kendall(series).p < 0.05
        corrected += hamed_rao(series).p < 0.05
    assert naive / 1000 > 0.12
    # pymannkendall 1.4.3 gives 0.246, well above the plan's proposed 0.10.
    assert 0.20 <= corrected / 1000 <= 0.28
    assert corrected < naive
