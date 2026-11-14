"""Read-only METHODS v1 gate audit. Never changes app code or golden inputs.

Run --local for observable yearly fields, aggregation and offline family tests.
Run --production for public API evidence and independent returned-monthly checks.
Production golden injection is intentionally unsupported: /analyze accepts Cases,
not arbitrary series. Local golden checks do not certify a deployed artifact.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import argparse
import copy
import csv
import hashlib
import importlib.metadata
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import time
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import numpy as np

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
GOLDEN = ROOT / "tests/fixtures/golden"
BASE = "https://womm-earth.vercel.app"
sys.dont_write_bytecode = True
sys.path.insert(0, str(ROOT / "api"))
from _engine.series import yearly_series
from _engine.trend import hamed_rao
from _engine.verdict import analyze_yearly, tier_for

def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

ref = load("gate_golden_reference", GOLDEN / "make_golden.py")
ext = load("gate_extended_reference", GOLDEN / "golden_ext.py")
prior = load("gate_existing_verifier", ROOT / "docs/science/golden_cases/verify_existing.py")

def clean(value):
    if isinstance(value, dict):
        return {k: clean(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, np.ndarray)):
        return [clean(v) for v in value]
    if isinstance(value, (np.integer, np.floating)):
        value = value.item()
    if isinstance(value, float) and not np.isfinite(value):
        return None
    return value

def stamp(scope):
    paths = list((ROOT / "api/_engine").glob("*.py"))
    paths += [ROOT / "api/index.py", ROOT / "api/_models.py", GOLDEN / "golden_expected.json",
              GOLDEN / "make_golden.py", GOLDEN / "golden_ext.py"]
    return dict(checked_at_utc=datetime.now(timezone.utc).isoformat(), scope=scope,
                local_revision=subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip(),
                source_sha256={p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
                               for p in sorted(paths)},
                versions={n: importlib.metadata.version(n)
                          for n in ["numpy", "scipy", "pydantic", "pymannkendall", "statsmodels"]})

def save(name, record):
    (HERE / name).write_text(json.dumps(clean(record), indent=2, allow_nan=False) + "\n", encoding="utf-8", newline="\n")

def expected_fields(e, ratio=True):
    wanted = dict(tier={"not_proven_yet": "not_proven"}.get(e["verdict"]["tier"], e["verdict"]["tier"]),
                  statistics_available=e["verdict"]["tier"] != "too_short")
    if not wanted["statistics_available"]:
        wanted.update(years_needed=None, fit_count=0)
        return wanted
    wanted.update(n_years=e["inputs"]["n"], p_mk=e["mk_hamed_rao"]["p"],
                  mk_z=e["mk_hamed_rao"]["z"], mk_tau=e["mk_original"]["tau"],
                  p_naive=e["mk_original"]["p"], sen_slope=e["sen"]["slope_per_year"],
                  sen_ci=e["sen"]["ci95_per_year_hamed_rao_variance"],
                  ols_slope=e["ols"]["slope"], ols_se=e["ols"]["se_adj"],
                  p_ols=e["ols"]["p_adj"], ols_ci=e["ols"]["ci95_adj"],
                  ols_r2=e["ols"]["r2"], n_eff=e["ols"]["n_eff"],
                  r1=e["ols"]["r1_residual"], residual_sd=e["ols"]["sigma"],
                  tests_agree=not e["badges"]["tests_disagree"],
                  period_mean=e["descriptive"]["mean"],
                  change_per_decade=e["sen"]["slope_per_decade"],
                  total_change=e["magnitude"]["total_change_sen"],
                  pct_of_mean_per_decade=e["magnitude"]["pct_of_mean_per_decade"] if ratio else None,
                  years_needed=e["years_needed"]["raw_extra_years"] if e["years_needed"]["displayed"] else None)
    return wanted

def actual_fields(stats, verdict, fit):
    a = dict(tier=verdict["tier"], statistics_available=stats is not None,
             years_needed=verdict["years_needed"])
    if stats is None:
        a["fit_count"] = len(fit)
        return a
    a.update(n_years=stats["n_years"], p_mk=stats["mk"]["p"],
             mk_z=stats["mk"]["z"], mk_tau=stats["mk"]["tau"],
             p_naive=stats["mk"]["p_naive"], sen_slope=stats["sen"]["slope"],
             sen_ci=[stats["sen"]["ci_low"], stats["sen"]["ci_high"]],
             ols_slope=stats["ols"]["slope"], ols_se=stats["ols"]["se"],
             p_ols=stats["ols"]["p"], ols_ci=[stats["ols"]["ci_low"], stats["ols"]["ci_high"]],
             ols_r2=stats["ols"]["r2"], n_eff=stats["ols"]["n_eff"], r1=stats["phi"],
             residual_sd=stats["resid_sd"], tests_agree=stats["tests_agree"],
             period_mean=stats["period_mean"], change_per_decade=stats["change_per_decade"],
             total_change=stats["total_change"], pct_of_mean_per_decade=stats["pct_of_mean_per_decade"])
    return a

def local():
    key = json.loads((GOLDEN / "golden_expected.json").read_text(encoding="utf-8"))
    record = stamp("Local observable engine fields and aggregation; not deployed golden validation.")
    yearly = {}
    for cid, case in key["cases"].items():
        if not any(cid.startswith("golden_" + f"{i:02}") for i in range(1, 8)):
            continue
        years, values = ref.read_series(GOLDEN / case["file"])
        stats, verdict, fit = analyze_yearly(years, values, ratio_scale=True)
        wanted = expected_fields(case["expected"])
        actual = actual_fields(stats.model_dump() if stats else None, verdict.model_dump(), fit)
        if stats:
            wanted["mk_variance"] = case["expected"]["mk_hamed_rao"]["var_S"]
            actual["mk_variance"] = hamed_rao(values).var_s
        differences = prior.compare(wanted, clean(actual))
        yearly[cid] = dict(matches_all_checked_fields=not differences,
                           expected=wanted, actual=actual, differences=differences)
    case = key["cases"]["golden_08_monthly_to_yearly"]
    monthly = {}
    with (GOLDEN / case["file"]).open(encoding="utf-8") as stream:
        for row in csv.DictReader(stream):
            monthly[tuple(map(int, row["date"].split("-")))] = float(row["value"]) if row["value"] else np.nan
    start, end = case["expected"]["period"].values()
    first = min(monthly)
    last = max(monthly)
    values = np.array([monthly.get((i // 12, i % 12 + 1), np.nan)
                       for i in range(first[0]*12+first[1]-1, last[0]*12+last[1])])
    aggregation = {}
    for season, e in case["expected"]["seasons"].items():
        api_season = season if season in ["ANN", "DJF", "MAM", "JJA", "SON"] else "CUSTOM"
        years, means = yearly_series(values, f"{first[0]}-{first[1]:02}", start, end,
                                     api_season, e["months"] if api_season == "CUSTOM" else None)
        wanted = dict(years=[r["year"] for r in e["years"]],
                      values=[r["value"] for r in e["years"]],
                      n_valid=e["n_valid"], years_total=e["years_total"], eligible_gate=e["gate"] == "ok")
        actual = dict(years=years.tolist(), values=clean(means),
                      n_valid=int(np.isfinite(means).sum()), years_total=len(years),
                      eligible_gate=tier_for(0.5, int(np.isfinite(means).sum()), len(years)) != "too_short")
        differences = prior.compare(wanted, actual)
        aggregation[season] = dict(matches_checked_aggregation=not differences,
                                  expected=wanted, actual=actual, differences=differences,
                                  inference_scope="No uncertainty sign-off for retained missing-year series.")
    from _engine.fdr import bh
    from _engine.map import MapRecord, select_mirrors
    from _engine import store
    ids = ["US-CO", "US-WI", "US-AZ", "US-NV"]
    pvalues = [0.025, 0.025, 0.8, 0.9]
    adjusted = bh(np.array(pvalues))
    regions = store.regions()
    family = {rid: MapRecord(regions[rid], 1 if j != 1 else -1, pvalues[j], float(adjusted[j]),
                             2.3, "confirmed" if pvalues[j] < 0.05 else "no_case")
              for j, rid in enumerate(ids)}
    selected = [r.region.id for r in select_mirrors("US-CO", family)]
    boundary = dict(p=pvalues, q=adjusted.tolist(), expected_mirror_ids=["US-WI"],
                    actual_mirror_ids=selected, passed=selected == ["US-WI"],
                    source="METHODS §§13–14: inclusive BH cutoff, both raw combined p-values below alpha.")
    command = [sys.executable, "-X", "utf8", "-m", "pytest", "tests/test_golden.py",
               "tests/test_v1_edge_inference.py", "tests/test_live_families.py", "-q"]
    completed = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, encoding="utf-8", timeout=60)
    record.update(yearly=yearly, golden_08_aggregation=aggregation, mirror_q_boundary=boundary,
                  golden_09=dict(status="runtime_key_and_mocked_family_tests_passed" if completed.returncode == 0 else "failed",
                                 scope="Existing golden/BH/mirror and deterministic family tests; no network or real-data map request."),
                  targeted_tests=dict(command=command[1:], returncode=completed.returncode,
                                      stdout=completed.stdout, stderr=completed.stderr),
                  local_scope_passed=all(c["matches_all_checked_fields"] for c in yearly.values()) and
                                     all(c["matches_checked_aggregation"] for c in aggregation.values()) and completed.returncode == 0 and boundary["passed"],
                  gate_passed=False)
    save("local_recheck.json", record)
    print("Local full-field yearly matches:", sum(r["matches_all_checked_fields"] for r in yearly.values()), "/", len(yearly), flush=True)
    print("Aggregation matches:", sum(r["matches_checked_aggregation"] for r in aggregation.values()), "/", len(aggregation), flush=True)
    print("Mirror exact-cutoff probe:", "PASS" if boundary["passed"] else "FAIL; see local_recheck.json", flush=True)

def request_json(path, body=None):
    started = time.perf_counter()
    url = BASE + path
    headers = {"User-Agent": "WOMM-Methods-Validity-Review/1.0", "Accept": "application/json"}
    if body is not None:
        headers["Content-Type"] = "application/json"
    req = Request(url, data=json.dumps(body).encode() if body is not None else None, headers=headers)
    try:
        with urlopen(req, timeout=75) as response:
            raw = response.read()
            payload = json.loads(raw)
            return dict(url=url, request=body, status=response.status,
                        elapsed_seconds=round(time.perf_counter()-started, 3),
                        response_sha256=hashlib.sha256(raw).hexdigest(), response=payload)
    except HTTPError as error:
        return dict(url=url, request=body, status=error.code,
                    elapsed_seconds=round(time.perf_counter()-started, 3),
                    error_body=error.read().decode("utf-8", errors="replace")[:2000])
    except Exception as error:
        return dict(url=url, request=body, status=None, error=type(error).__name__+": "+str(error))

def archive_case(cid, check):
    if check["status"] != 200:
        return
    r = check["response"]["results"][0]
    if "monthly" not in r:
        return
    folder = HERE / "production_monthly"
    folder.mkdir(exist_ok=True)
    path = folder / (cid + ".csv")
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.writer(stream, lineterminator="\n")
        writer.writerow(["date", "value", "anomaly"])
        writer.writerows((p["t"], p["value"], p["anomaly"]) for p in r["monthly"])
    check["monthly_artifact"] = path.relative_to(HERE).as_posix()
    check["monthly_artifact_sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
    check["monthly_count"] = len(r.pop("monthly"))
    check["fit_count"] = len(r.pop("fit"))
    check["response_fields_omitted"] = ["monthly (archived as CSV)", "fit (not used in this inference review)"]

def check_production_case(cid, body, saved=None):
    check = copy.deepcopy(saved) if saved is not None else request_json("/api/py/analyze", body)
    if saved is not None and check["status"] == 200:
        path = HERE / check["monthly_artifact"]
        assert hashlib.sha256(path.read_bytes()).hexdigest() == check["monthly_artifact_sha256"]
        with path.open(encoding="utf-8", newline="") as stream:
            rows = list(csv.DictReader(stream))
        r = check["response"]["results"][0]
        r["monthly"] = [dict(t=p["date"], value=float(p["value"]) if p["value"] else None,
                             anomaly=float(p["anomaly"]) if p["anomaly"] else None) for p in rows]
        r["fit"] = [None] * check["fit_count"]
    if check["status"] == 200:
        payload = check["response"]
        r = payload["results"][0]
        monthly = {tuple(map(int, point["t"].split("-"))): point["value"] for point in r["monthly"]}
        months = {"ANN": list(range(1,13)), "DJF": [12,1,2], "JJA": [6,7,8]}[body["season"]]
        ag = ext.aggregate(monthly, body["season"], months, (body["start"], body["end"]))
        expected_yearly = [dict(year=p["year"], value=p["value"]) for p in ag["years"]]
        aggregation_errors = prior.compare(expected_yearly, r["yearly"], "yearly")
        finite = [p for p in expected_yearly if p["value"] is not None]
        contiguous = all(b["year"]-a["year"] == 1 for a,b in zip(finite,finite[1:]))
        if len(finite) >= 10 and contiguous and ag["gate"] == "ok":
            e = ref.analyse(np.array([p["year"] for p in finite]), np.array([p["value"] for p in finite]))
            wanted = expected_fields(e, ratio=body["variable"] not in ["T2M", "T2M_MAX", "T2M_MIN", "TS"])
            actual = actual_fields(r["stats"], r["verdict"], r["fit"])
            check["reference"] = dict(expected=wanted, actual=actual,
                                     differences=prior.compare(wanted, clean(actual)))
        else:
            check["reference"] = dict(withheld="Ineligible or gapped yearly series: separate reviewed inference policy required.")
        check["aggregation"] = dict(differences=aggregation_errors,
                                    eligible_slots=ag["years_total"], valid_years=ag["n_valid"],
                                    contiguous_finite_years=contiguous)
    if saved is None:
        archive_case(cid, check)
    print(cid, "replay" if saved is not None else "HTTP", check["status"], flush=True)
    return cid, check

def production():
    record = stamp("Read-only public production API audit. No deployment revision is exposed; local source parity is not proven.")
    record.update(base_url=BASE, health=request_json("/api/py/health"),
                  remote_revision="not_exposed", variables=request_json("/api/py/variables"))
    queries = [dict(variable="T2M",start=1981,end=2025,season="ANN"),
               dict(variable="AOD_55",start=2002,end=2025,season="JJA")]
    record["trendmap"] = [request_json("/api/py/trendmap?"+urlencode(q)) for q in queries]
    record["trendmap_requested_contexts"] = queries
    fixture = json.loads((ROOT / "api/_fixtures/trendmap.json").read_text(encoding="utf-8"))
    record["map_fixture_payload_matches"] = [r.get("response") == fixture for r in record["trendmap"]]
    save("production_review.json", record)
    states = ["US-CO","US-AZ","US-WI","US-NV","US-CA","US-TX","US-NY","US-FL","US-MN","US-ME"]
    cases = {state.lower()+"-temperature":dict(variable="T2M",regions=[state],start=1981,end=2025,season="ANN")
             for state in states}
    for cid,v,r,start,season in [
        ("final-az-wetness","GWETROOT","US-AZ",1981,"ANN"),
        ("final-wi-snow","SNODP","US-WI",1981,"DJF"),
        ("backup-wi-aod","AOD_55","US-WI",2002,"JJA"),
        ("backup-wi-precipitation","PRECTOTCORR","US-WI",1981,"ANN"),
        ("map-wi-temperature","T2M","US-WI",2002,"JJA"),
        ("diagnostic-aral-wetness","GWETROOT","NR-ARAL",1981,"ANN")]:
        cases[cid] = dict(variable=v,regions=[r],start=start,end=2025,season=season)
    record["cases"] = {}
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(check_production_case,cid,body) for cid,body in cases.items()]
        for future in as_completed(futures):
            cid,check = future.result()
            record["cases"][cid] = check
            save("production_review.json", record)
    record["ten_region_analysis_ids"] = states
    record["map_spot_check_status"] = "Not passed: validate returned context and ten genuine map entries; separate analyses do not substitute."
    record["gate_passed"] = False
    save("production_review.json", record)
    print("Production case requests completed:",len(record["cases"]), flush=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--local",action="store_true")
    parser.add_argument("--production",action="store_true")
    parser.add_argument("--replay",action="store_true", help="Verify archived production comparisons offline")
    args = parser.parse_args()
    if args.replay:
        record = json.loads((HERE / "production_review.json").read_text(encoding="utf-8"))
        for cid, saved in record["cases"].items():
            _, observed = check_production_case(cid, saved["request"], saved=saved)
            assert not prior.compare(saved.get("reference"), observed.get("reference")), cid
            assert not prior.compare(saved.get("aggregation"), observed.get("aggregation")), cid
        print("Archived production comparison replay passed; no network requests.", flush=True)
    if args.local:
        local()
    if args.production:
        production()
