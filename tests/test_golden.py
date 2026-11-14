"""Independent cases supplied by the Methods lead when available."""

import csv
import json
from pathlib import Path

import numpy as np
import pytest

from _engine.series import yearly_series
from _engine.trend import mann_kendall
from _engine.verdict import analyze_yearly


GOLDEN = Path(__file__).parent / "fixtures" / "golden"
CASES = sorted(path for path in GOLDEN.glob("*") if (path / "expected.json").exists())


@pytest.mark.parametrize("case_dir", CASES or [None], ids=lambda p: p.name if p else "awaiting-golden-cases")
def test_golden_case(case_dir):
    if case_dir is None:
        pytest.skip("Sergio has not delivered golden cases yet")
    expected = json.loads((case_dir / "expected.json").read_text())
    with (case_dir / "series.csv").open(newline="") as stream:
        rows = list(csv.DictReader(stream))
    dates = [row["date"] for row in rows]
    values = np.array([float(row["value"]) if row["value"] else np.nan for row in rows])
    if len(dates[0]) == 4:
        years = np.array([int(date) for date in dates])
        annual = values
    else:
        season = expected.get("series_used", "yearly").split(":")[-1]
        if season in ("yearly", "monthly"):
            season = "ANN"
        years, annual = yearly_series(values, dates[0], int(dates[0][:4]), int(dates[-1][:4]), season, None)
    tolerance = expected.get("tolerance", {})
    if "yearly_values" in expected:
        np.testing.assert_allclose(annual, expected["yearly_values"], atol=tolerance.get("slope", 1e-6), equal_nan=True)
    stats, verdict, _ = analyze_yearly(years, annual, ratio_scale=False)
    labels = {"confirmed": "Confirmed", "not_proven": "Not proven yet", "no_case": "No case", "too_short": "Too short to judge"}
    if "verdict" in expected:
        assert labels[verdict.tier] == expected["verdict"]
    if "years_needed" in expected:
        assert verdict.years_needed == expected["years_needed"]
    if stats is None:
        return
    naive = mann_kendall(annual)
    observed = {
        "ols": {"slope": stats.ols.slope, "se_ar1": stats.ols.se, "p": stats.ols.p,
                "ci": [stats.ols.ci_low, stats.ols.ci_high], "r2": stats.ols.r2, "n_eff": stats.ols.n_eff},
        "mk_naive": {"p": stats.mk.p_naive, "tau": stats.mk.tau, "z": naive.z},
        "mk_hamed_rao": {"p": stats.mk.p, "z": stats.mk.z},
        "sen": {"slope": stats.sen.slope, "ci": [stats.sen.ci_low, stats.sen.ci_high]},
        "phi": stats.phi,
    }
    for section, fields in observed.items():
        if section not in expected:
            continue
        if isinstance(fields, dict):
            for name, actual in fields.items():
                if name in expected[section]:
                    error = tolerance.get("p" if name == "p" else "slope", 1e-6)
                    assert actual == pytest.approx(expected[section][name], abs=error)
        else:
            assert fields == pytest.approx(expected[section], abs=tolerance.get("slope", 1e-6))
