"""Reproducible scientific dry-run of a declared demo candidate set.

Uses real POWER data with valid provider parameters, the independent golden
reference, and a separate read-only engine comparison. This does not patch or
replace the deployed application's request path. Run with the ignored science
validation environment; output stays under docs/science/demo/.
"""

import csv
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import importlib.metadata
import importlib.util
import json
import math
from pathlib import Path
import subprocess
import sys
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

sys.dont_write_bytecode = True
import numpy as np

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
GOLDEN = ROOT / "tests" / "fixtures" / "golden"
sys.path.insert(0, str(ROOT / "api"))
from _engine.series import yearly_series
from _engine.verdict import analyze_yearly

# Declared before viewing results. Retain all candidates in the output, including
# negative findings; do not optimise dates or seasons to manufacture significance.
CANDIDATES = [
    ("wi-aod", "AOD_55", "US-WI", 2002, "JJA"),
    ("co-temperature", "T2M", "US-CO", 1981, "ANN"),
    ("aral-wetness", "GWETROOT", "NR-ARAL", 1981, "ANN"),
    ("az-wetness", "GWETROOT", "US-AZ", 1981, "ANN"),
    ("wi-precipitation", "PRECTOTCORR", "US-WI", 1981, "ANN"),
    ("wi-snow", "SNODP", "US-WI", 1981, "DJF"),
    ("wi-temperature", "T2M", "US-WI", 1981, "JJA"),
    ("nv-precipitation", "PRECTOTCORR", "US-NV", 1981, "ANN"),
]


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run_candidate(candidate, regions, ref, ext):
    cid, variable, rid, start, season = candidate
    region = regions[rid]
    west, south, east, north = region["bbox"]
    query = dict(parameters=variable, community="AG", start=start, end=2025,
                 format="JSON", user="wommearth")
    query.update({"longitude-min": west, "latitude-min": south,
                  "longitude-max": east, "latitude-max": north})
    url = "https://power.larc.nasa.gov/api/temporal/monthly/regional?" + urlencode(query)
    result = dict(variable=variable, region_id=rid, region_name=region["name"],
                  bbox=region["bbox"], start=start, end=2025, season=season,
                  request_url=url, aggregation="cos(latitude)-weighted bbox cells; no polygon mask")
    try:
        request = Request(url, headers={"User-Agent": "womm-earth-science-demo/1.0"})
        with urlopen(request, timeout=45) as response:
            body = response.read()
        payload = json.loads(body)
        fill = float(payload.get("header", {}).get("fill_value", -999))
        sums, weights = {}, {}
        for feature in payload["features"]:
            weight = math.cos(math.radians(feature["geometry"]["coordinates"][1]))
            for date, value in feature["properties"]["parameter"][variable].items():
                if len(date) != 6 or not date.isdigit() or not 1 <= int(date[4:]) <= 12:
                    continue
                number = float(value)
                if math.isfinite(number) and number != fill:
                    sums[date] = sums.get(date, 0.0) + weight * number
                    weights[date] = weights.get(date, 0.0) + weight
        monthly = {(year, month): (sums[f"{year}{month:02d}"] / weights[f"{year}{month:02d}"]
                   if weights.get(f"{year}{month:02d}", 0) > 0 else None)
                   for year in range(start, 2026) for month in range(1, 13)}
        monthly_values = np.array([np.nan if v is None else v for v in monthly.values()])
        (HERE / "series").mkdir(exist_ok=True)
        csv_path = HERE / "series" / f"{cid}.csv"
        with csv_path.open("w", newline="", encoding="utf-8") as stream:
            writer = csv.writer(stream, lineterminator="\n")
            writer.writerow(["date", "value"])
            for (year, month), value in monthly.items():
                writer.writerow([f"{year}-{month:02d}", "" if value is None else repr(value)])
        months = list(range(1, 13)) if season == "ANN" else ext.SEASONS[season]
        aggregation = ext.aggregate(monthly, season, months, (start, 2025))
        valid = [y for y in aggregation["years"] if y["value"] is not None]
        years = np.array([y["year"] for y in valid], dtype=float)
        values = np.array([y["value"] for y in valid], dtype=float)
        result.update(provider_header=payload["header"], parameter=payload["parameters"][variable],
                      response_sha256=hashlib.sha256(body).hexdigest(),
                      series_csv="series/" + csv_path.name,
                      series_sha256=hashlib.sha256(csv_path.read_bytes()).hexdigest(),
                      feature_count=len(payload["features"]), aggregation_details=aggregation)
        if aggregation["gate"] != "ok" or np.any(np.diff(years) != 1):
            result["status"] = "ineligible_or_gapped_inference_not_validated"
            return cid, result
        reference = ref.analyse(years, values)
        ref.cross_check(years, values, reference, cid)
        ey, ev = yearly_series(monthly_values, f"{start}-01", start, 2025, season, None)
        engine, verdict, _ = analyze_yearly(ey, ev, ratio_scale=variable != "T2M")
        result.update(status="reference_computed", reference=reference,
                      scipy_pymannkendall_statsmodels_cross_check="passed",
                      aggregation_matches_engine=bool(np.array_equal(ey, years) and np.allclose(ev, values, rtol=1e-12, atol=1e-12)),
                      current_engine=dict(stats=engine.model_dump() if engine else None,
                                          verdict=verdict.model_dump()))
    except HTTPError as error:
        result.update(status="provider_rejected", http_status=error.code, provider_error=error.read().decode())
    except Exception as error:
        result.update(status="error", error=str(error))
    return cid, result


def main():
    regions = {r["id"]: r for r in json.loads((ROOT / "api" / "_data" / "regions.json").read_text())}
    ref = load("demo_reference", GOLDEN / "make_golden.py")
    ext = load("demo_aggregation", GOLDEN / "golden_ext.py")
    with ThreadPoolExecutor(max_workers=2) as executor:
        results = dict(executor.map(lambda c: run_candidate(c, regions, ref, ext), CANDIDATES))
    cli = subprocess.run([sys.executable, str(ROOT / "scripts" / "case_cli.py"),
                          "--var", "AOD_55", "--region", "US-WI", "--start", "2002",
                          "--end", "2025", "--season", "JJA", "--json"],
                         capture_output=True, text=True, timeout=60)
    record = dict(checked_at_utc=datetime.now(timezone.utc).isoformat(),
                  source_sha256={str(p.relative_to(ROOT)).replace("\\", "/"): hashlib.sha256(p.read_bytes()).hexdigest()
                                 for p in [GOLDEN / "golden_expected.json", GOLDEN / "make_golden.py", GOLDEN / "golden_ext.py",
                                           ROOT / "api/_engine/trend.py", ROOT / "api/_engine/verdict.py",
                                           ROOT / "api/_engine/series.py", ROOT / "api/_engine/config.py"]},
                  engine_scope="Read-only local engine comparison on provider data; production/CLI are not patched.",
                  reference_scope="Independent existing golden reference, with scipy/pymannkendall/statsmodels cross-checks; METHODS v1 Option B.",
                  selection="Illustrative screening, not a field-wide significance claim; all declared candidates are retained.",
                  versions={name: importlib.metadata.version(name) for name in
                            ["numpy", "scipy", "pymannkendall", "statsmodels", "fastapi", "pydantic"]},
                  candidates=results,
                  unmodified_cli=dict(returncode=cli.returncode, stdout=cli.stdout, stderr=cli.stderr))
    (HERE / "results.json").write_text(json.dumps(record, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    for cid, result in results.items():
        if result.get("reference"):
            r = result["reference"]
            print(cid, r["sen"]["slope_per_decade"], r["mk_hamed_rao"]["p"],
                  r["ols"]["p_adj"], r["verdict"]["tier"],
                  "engine:", result["current_engine"]["verdict"]["tier"])
        else:
            print(cid, result["status"], result.get("error", result.get("provider_error", "")))
    print("Unmodified CLI return code:", cli.returncode)


if __name__ == "__main__":
    main()
