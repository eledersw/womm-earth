"""METHODS v1 acceptance against Sergio's independent, flat nine-case key."""
import csv
import json
from pathlib import Path

import numpy as np
import pytest

from _engine.series import yearly_series
from _engine.trend import hamed_rao, mann_kendall, ols_ar1, sens_slope
from _engine.verdict import analyze_yearly

GOLDEN = Path(__file__).parent / "fixtures" / "golden"
CASES = json.loads((GOLDEN / "golden_expected.json").read_text())["cases"]


def close(actual, expected, *, p=False):
    if expected is None:
        assert actual is None
    else:
        np.testing.assert_allclose(actual, expected, rtol=1e-7 if p else 1e-9, atol=0 if p and np.all(np.asarray(expected) != 0) else 1e-12, equal_nan=True)


@pytest.mark.parametrize("name", list(CASES)[:7])
def test_yearly_golden(name):
    case = CASES[name]
    with (GOLDEN / case["file"]).open(newline="") as source:
        rows = list(csv.DictReader(source))
    years = np.array([int(row["year"]) for row in rows])
    values = np.array([float(row["value"]) for row in rows], dtype=np.float64)
    e = case["expected"]
    stats, verdict, _ = analyze_yearly(years, values, ratio_scale=True)
    assert verdict.tier == e["verdict"]["tier"].replace("not_proven_yet", "not_proven")
    if stats is None:
        assert verdict.years_needed is None
        return
    mk = hamed_rao(values)
    naive = mann_kendall(values)
    sen = sens_slope(years, values)
    ols = ols_ar1(years, values)
    for observed, section in [(naive, e["mk_original"]), (mk, e["mk_hamed_rao"])]:
        close(observed.s, section["S"] if "S" in section else e["mk_original"]["S"])
        close(observed.var_s, section["var_S"])
        close(observed.z, section["z"], p=True)
        close(observed.p, section["p"], p=True)
    close(naive.tau, e["mk_original"]["tau"])
    close(sen.slope, e["sen"]["slope_per_year"])
    close([sen.ci_low, sen.ci_high], e["sen"]["ci95_per_year_hamed_rao_variance"])
    for actual, key in [(ols.slope, "slope"), (ols.phi, "r1_residual"), (ols.n_eff, "n_eff"),
                        (ols.resid_sd, "sigma"), (ols.se, "se_adj"), (ols.p, "p_adj"), (ols.r2, "r2")]:
        close(actual, e["ols"][key], p=key == "p_adj")
    close([ols.ci_low, ols.ci_high], e["ols"]["ci95_adj"])
    close(max(mk.p, ols.p), e["verdict"]["p_used"], p=True)
    close(stats.period_mean, e["descriptive"]["mean"])
    close(stats.total_change, e["magnitude"]["total_change_sen"])
    assert stats.tests_agree == (not e["badges"]["tests_disagree"])
    assert verdict.years_needed == (e["years_needed"]["raw_extra_years"] if e["years_needed"]["displayed"] else None)


def test_monthly_golden():
    expected = CASES["golden_08_monthly_to_yearly"]["expected"]
    with (GOLDEN / CASES["golden_08_monthly_to_yearly"]["file"]).open(newline="") as source:
        values = np.array([float(row["value"]) if row["value"] else np.nan for row in csv.DictReader(source)])
    for season, spec in expected["seasons"].items():
        custom = season not in {"ANN", "DJF", "MAM", "JJA", "SON"}
        months = spec["months"] if custom else None
        years, annual = yearly_series(values, "2000-01", 2001, 2012, "CUSTOM" if custom else season, months)
        assert years.tolist() == [row["year"] for row in spec["years"]]
        close(annual, [np.nan if row["value"] is None else row["value"] for row in spec["years"]])
        _, verdict, _ = analyze_yearly(years, annual, ratio_scale=False)
        assert (verdict.tier == "too_short") == spec["gate"].startswith("too_short")


def test_bh_golden():
    from _engine.fdr import bh
    from _engine.map import MapRecord, select_mirrors
    from _models import Region
    family = json.loads((GOLDEN / CASES["golden_09_fdr_mirror"]["file"]).read_text())["regions"]
    expected = CASES["golden_09_fdr_mirror"]["expected"]
    p = np.array([row["p_verdict"] if row["p_verdict"] is not None else np.nan for row in family])
    q = bh(p)
    assert int(np.isfinite(q).sum()) == expected["m_valid"]
    assert {row["id"] for row, value in zip(family, q) if value < 0.05} == set(expected["bh_rejected"])
    for row, value in zip(family, q):
        close(float(value) if np.isfinite(value) else None, expected["per_region"][row["id"]]["bh_adjusted_p"], p=True)
    records = {}
    for row, value in zip(family, q):
        if not np.isfinite(value):
            continue
        region = Region(id=row["id"], name=row["id"], type=row["type"], centroid=(0, 0),
                        bbox=(0, 0, 1, 1), nearest_cell_fallback=False, valid_variables=[],
                        parent="NR-1" if row["id"] == "NR-3" else None)
        records[row["id"]] = MapRecord(region, row["slope_per_decade"], row["p_verdict"],
                                       float(value), row["z_mk"], "confirmed" if row["raw_significant"] else "no_case")
    for scenario in expected["mirror_scenarios"]:
        assert [r.region.id for r in select_mirrors(scenario["case_region"], records)] == [r["region"] for r in scenario["mirrors"]]
