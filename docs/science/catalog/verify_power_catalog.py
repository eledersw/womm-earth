"""Record provider evidence for DATA_CATALOG; standard library only, no app imports.

Run from the repository root:
    python docs/science/catalog/verify_power_catalog.py --output PATH

This probes a small land rectangle, not all regions or the deployed app. It
stores metadata and coverage summaries, not the returned climate observations.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError


BASE = "https://power.larc.nasa.gov/api/"
CODES = (
    "T2M", "T2M_MAX", "T2M_MIN", "TS", "PRECTOTCORR", "RH2M",
    "QV2M", "WS10M", "PS", "GWETROOT", "GWETTOP", "SNODP",
    "EVPTRNS", "ALLSKY_SFC_SW_DWN", "CLOUD_AMT", "AOD_55",
)


def get_json(url):
    request = Request(url, headers={"User-Agent": "womm-earth-catalog-review/1.0"})
    with urlopen(request, timeout=45) as response:
        body = response.read()
        return json.loads(body), hashlib.sha256(body).hexdigest()


def probe(code, metadata, end_year):
    # Include the earlier radiation archive in the request to measure availability;
    # the catalog can choose a later, more homogeneous analysis period.
    start = 1981 if metadata["type"] == "METEOROLOGY" else 1984
    query = dict(parameters=code, community="AG", start=start, end=end_year,
                 format="JSON", user="wommearth",
                 **{"latitude-min": 43, "latitude-max": 45,
                    "longitude-min": -91, "longitude-max": -89})
    url = BASE + "temporal/monthly/regional?" + urlencode(query)
    result = {"metadata": metadata, "request_url": url}
    try:
        payload, digest = get_json(url)
        fill = float(payload.get("header", {}).get("fill_value", -999))
        dates = set()
        finite_cells = 0
        features = payload.get("features", [])
        for feature in features:
            values = feature.get("properties", {}).get("parameter", {}).get(code, {})
            for date, value in values.items():
                if len(date) != 6 or not date.isdigit() or not 1 <= int(date[4:]) <= 12:
                    continue
                number = float(value)
                if math.isfinite(number) and number != fill:
                    dates.add(date)
                    finite_cells += 1
        result.update(
            usable=bool(dates), response_sha256=digest,
            parameter_response=payload.get("parameters", {}).get(code),
            header=payload.get("header"), feature_count=len(features),
            coordinates=[f.get("geometry", {}).get("coordinates") for f in features],
            first_valid_month=min(dates) if dates else None,
            last_valid_month=max(dates) if dates else None,
            distinct_valid_months=len(dates), finite_cell_months=finite_cells,
        )
    except HTTPError as error:
        result.update(usable=False, error=str(error), error_response=error.read().decode())
    except Exception as error:
        result.update(usable=False, error=str(error))
    return code, result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--end-year", type=int, default=2025)
    args = parser.parse_args()
    query = urlencode(dict(community="AG", temporal="monthly", metadata="true", user="wommearth"))
    manager_url = BASE + "system/manager/parameters?" + query
    manager, digest = get_json(manager_url)
    missing = [code for code in CODES if manager.get(code, {}).get("temporal") != "MONTHLY"]
    if missing:
        raise ValueError(f"Not monthly Manager parameters: {missing}")
    with ThreadPoolExecutor(max_workers=3) as executor:
        results = dict(executor.map(lambda code: probe(code, manager[code], args.end_year), CODES))
    record = dict(
        checked_at_utc=datetime.now(timezone.utc).isoformat(),
        manager_url=manager_url, manager_response_sha256=digest,
        community="AG", requested_end_year=args.end_year,
        test_rectangle=dict(west=-91, south=43, east=-89, north=45),
        scope="Provider verification only; not exact Wisconsin boundary or app integration certification.",
        parameters=results,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    for code, result in results.items():
        print(code, result["usable"], result.get("first_valid_month"),
              result.get("last_valid_month"), result.get("parameter_response"),
              result.get("error", ""))
    if not all(result["usable"] for result in results.values()):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
