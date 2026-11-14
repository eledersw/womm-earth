"""Verify the existing nine-case answer key without regenerating any fixtures.

Run with the science validation environment from the repository root:
  docs/science/.venv-validation/Scripts/python.exe docs/science/golden_cases/verify_existing.py

Outputs reference verification and a separate engine comparison in this folder.
Engine mismatches are reported, not silently accepted or fixed outside ownership.
"""

import csv
from datetime import datetime, timezone
import importlib.metadata
import importlib.util
import hashlib
import json
from pathlib import Path
import sys

sys.dont_write_bytecode = True
import numpy as np
from scipy import stats
from statsmodels.stats.multitest import multipletests

ROOT = Path(__file__).resolve().parents[3]
GOLDEN = ROOT / "tests" / "fixtures" / "golden"
sys.path.insert(0, str(ROOT / "api"))
from _engine.verdict import analyze_yearly


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def compare(expected, actual, path=""):
    errors = []
    if isinstance(expected, dict):
        for key, value in expected.items():
            if key not in actual:
                errors.append(dict(field=path + "." + key, expected=value, actual="missing"))
            else:
                errors.extend(compare(value, actual[key], path + "." + key))
    elif isinstance(expected, list):
        if len(expected) != len(actual):
            errors.append(dict(field=path, expected=expected, actual=actual))
        else:
            for i, (e, a) in enumerate(zip(expected, actual)):
                errors.extend(compare(e, a, f"{path}[{i}]"))
    elif isinstance(expected, (int, float)) and not isinstance(expected, bool):
        leaf = path.rsplit(".", 1)[-1]
        is_p = leaf.startswith("p") or leaf.endswith("_p") or "adjusted_p" in path
        rtol, atol = (1e-7, 0.0) if is_p else (1e-9, 1e-12)
        if actual is None or not np.isclose(expected, actual, rtol=rtol, atol=atol):
            errors.append(dict(field=path, expected=expected, actual=actual))
    elif expected != actual:
        errors.append(dict(field=path, expected=expected, actual=actual))
    return errors


def main():
    ref = load("golden_reference", GOLDEN / "make_golden.py")
    ext = load("golden_extended", GOLDEN / "golden_ext.py")
    key = json.loads((GOLDEN / "golden_expected.json").read_text(encoding="utf-8"))
    reference_checks, engine_checks = {}, {}
    for cid, case in key["cases"].items():
        expected = case["expected"]
        if cid.startswith("golden_08"):
            monthly = {}
            with (GOLDEN / case["file"]).open(encoding="utf-8") as stream:
                for row in csv.DictReader(stream):
                    monthly[tuple(map(int, row["date"].split("-")))] = float(row["value"]) if row["value"] else None
            period = expected["period"]
            errors = []
            for season, e in expected["seasons"].items():
                a = ext.aggregate(monthly, season, e["months"], (period["start_year"], period["end_year"]))
                errors.extend(compare(e, a, season))
            reference_checks[cid] = dict(passed=not errors, errors=errors)
            continue
        if cid.startswith("golden_09"):
            inputs = json.loads((GOLDEN / case["file"]).read_text(encoding="utf-8"))
            regions = inputs["regions"]
            reject, adjusted, m, k = ext.bh([r["p_verdict"] for r in regions], inputs["q"])
            valid = [i for i, r in enumerate(regions) if r["p_verdict"] is not None]
            independent_reject, independent_p, _, _ = multipletests(
                [regions[i]["p_verdict"] for i in valid], alpha=inputs["q"], method="fdr_bh")
            for j, i in enumerate(valid):
                assert reject[i] == bool(independent_reject[j])
                assert np.isclose(adjusted[i], independent_p[j], rtol=1e-12)
            for r, rej, adj in zip(regions, reject, adjusted):
                r.update(bh_significant=rej, bh_adjusted_p=adj)
            actual = dict(m_valid=m, k_max=k,
                          bh_rejected=[r["id"] for r in regions if r["bh_significant"]],
                          raw_significant_but_not_bh=[r["id"] for r in regions if r["raw_significant"] and not r["bh_significant"]],
                          per_region={r["id"]: dict(bh_significant=r["bh_significant"], bh_adjusted_p=r["bh_adjusted_p"]) for r in regions},
                          mirror_scenarios=[ext.mirrors(s["case_region"], regions, inputs["contains"]) for s in expected["mirror_scenarios"]])
            errors = compare(expected, actual)
            reference_checks[cid] = dict(passed=not errors, errors=errors)
            continue
        years, values = ref.read_series(GOLDEN / case["file"])
        actual = ref.analyse(years, values)
        if len(years) >= 10:
            ref.cross_check(years, values, actual, cid)
        errors = compare(expected, actual)
        reference_checks[cid] = dict(passed=not errors, errors=errors,
                                     independent_libraries_checked=len(years) >= 10)
        engine_stats, verdict, _ = analyze_yearly(years, values, ratio_scale=False)
        observed = dict(tier={"not_proven": "not_proven_yet"}.get(verdict.tier, verdict.tier))
        wanted = dict(tier=expected["verdict"]["tier"])
        if engine_stats is not None:
            wanted.update(mk_p=expected["mk_hamed_rao"]["p"],
                          ols_p=expected["ols"]["p_adj"], n_eff=expected["ols"]["n_eff"],
                          r1=expected["ols"]["r1_residual"],
                          sen_slope=expected["sen"]["slope_per_year"],
                          sen_ci=expected["sen"]["ci95_per_year_hamed_rao_variance"])
            observed.update(mk_p=engine_stats.mk.p, ols_p=engine_stats.ols.p,
                            n_eff=engine_stats.ols.n_eff, r1=engine_stats.phi,
                            sen_slope=engine_stats.sen.slope,
                            sen_ci=[engine_stats.sen.ci_low, engine_stats.sen.ci_high])
        differences = compare(wanted, observed)
        engine_checks[cid] = dict(matches_checked_fields=not differences, differences=differences,
                                  expected=wanted, actual=observed)
    record = dict(checked_at_utc=datetime.now(timezone.utc).isoformat(),
                  source_sha256={str(p.relative_to(ROOT)).replace("\\", "/"): hashlib.sha256(p.read_bytes()).hexdigest()
                                 for p in [GOLDEN / "golden_expected.json", GOLDEN / "make_golden.py", GOLDEN / "golden_ext.py",
                                           ROOT / "api/_engine/trend.py", ROOT / "api/_engine/verdict.py",
                                           ROOT / "api/_engine/series.py", ROOT / "api/_engine/config.py"]},
                  scope="Existing key/reference verification, plus read-only comparison of current yearly engine; not deployed validation.",
                  versions={name: importlib.metadata.version(name) for name in
                            ["numpy", "scipy", "pymannkendall", "statsmodels", "pydantic"]},
                  reference_cases=reference_checks, engine_yearly_comparison=engine_checks)
    target = Path(__file__).with_name("verification.json")
    target.write_text(json.dumps(record, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print("Reference/key:", sum(c["passed"] for c in reference_checks.values()), "/", len(reference_checks))
    print("Engine/yearly checked fields:", sum(c["matches_checked_fields"] for c in engine_checks.values()), "/", len(engine_checks))
    if not all(c["passed"] for c in reference_checks.values()):
        raise SystemExit("Stored key did not reproduce; inspect verification.json")


if __name__ == "__main__":
    main()
