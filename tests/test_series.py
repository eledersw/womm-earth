import numpy as np

from _engine.series import monthly_with_anomalies, yearly_series


def test_djf_assigns_december_to_next_year():
    values = np.tile(np.arange(1, 13, dtype=float), 3)
    years, annual = yearly_series(values, "2000-01", 2000, 2002, "DJF", None)
    assert years.tolist() == [2001, 2002]
    np.testing.assert_allclose(annual, [5, 5])


def test_djf_drops_incomplete_edges():
    values = np.arange(1, 25, dtype=float)
    years, annual = yearly_series(values, "2000-01", 2001, 2001, "DJF", None)
    assert years.size == 0
    assert annual.size == 0


def test_annual_requires_10_months():
    values = np.ones(24)
    values[[0, 1, 12, 13, 14]] = np.nan
    years, annual = yearly_series(values, "2000-01", 2000, 2001, "ANN", None)
    assert years.tolist() == [2000, 2001]
    assert annual[0] == 1
    assert np.isnan(annual[1])


def test_seasons_require_every_month():
    values = np.ones(24)
    values[2] = np.nan
    years, annual = yearly_series(values, "2000-01", 2000, 2001, "MAM", None)
    assert years.tolist() == [2000, 2001]
    assert np.isnan(annual[0])
    assert annual[1] == 1


def test_custom_wrap_ndj():
    values = np.tile(np.arange(1, 13, dtype=float), 3)
    years, annual = yearly_series(values, "2000-01", 2000, 2002, "CUSTOM", [11, 12, 1])
    assert years.tolist() == [2001, 2002]
    np.testing.assert_allclose(annual, [8, 8])


def test_monthly_anomalies_use_selected_period_climatology():
    values = np.array([1] * 12 + [3] * 12, dtype=float)
    labels, selected, anomalies = monthly_with_anomalies(values, "2000-01", 2000, 2001)
    assert labels == [f"{year}-{month:02d}" for year in (2000, 2001) for month in range(1, 13)]
    np.testing.assert_allclose(selected, values)
    np.testing.assert_allclose(anomalies, [-1] * 12 + [1] * 12)
