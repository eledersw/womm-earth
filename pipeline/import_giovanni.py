"""Convert a NASA Giovanni monthly CSV, retaining its supplied provenance."""

from __future__ import annotations

import argparse
import csv
import json
import re
from datetime import date
from pathlib import Path


def parse_giovanni(path: Path, variable: str, region: str) -> dict:
    lines = path.read_text(encoding="utf-8-sig").splitlines()
    metadata = {}
    data_lines = []
    for line in lines:
        if line.startswith("#"):
            match = re.match(r"#\s*([^:]+):\s*(.*)", line)
            if match:
                metadata[match.group(1).strip().lower()] = match.group(2).strip()
        elif line.strip():
            data_lines.append(line)
    rows = list(csv.reader(data_lines))
    if len(rows) < 2:
        raise ValueError(f"{path}: no monthly data")
    monthly = {}
    for row in rows[1:]:
        match = re.match(r"^(\d{4})-(\d{2})", row[0].strip())
        if not match or len(row) < 2:
            raise ValueError(f"{path}: expected YYYY-MM and a value: {row}")
        year, month = map(int, match.groups())
        date(year, month, 1)
        key = year * 12 + month - 1
        if key in monthly:
            raise ValueError(f"{path}: duplicate month {year:04d}-{month:02d}")
        raw = row[1].strip()
        value = float(raw) if raw else float("nan")
        monthly[key] = value if value > -990 and value == value else None
    first, last = min(monthly), max(monthly)
    return {
        "variable": variable,
        "region": region,
        "source": metadata.get("source", "NASA Giovanni"),
        "instrument": metadata.get("instrument"),
        "product": metadata.get("product"),
        "version": metadata.get("version"),
        "doi": metadata.get("doi"),
        "t0": f"{first // 12:04d}-{first % 12 + 1:02d}",
        "values": [monthly.get(key) for key in range(first, last + 1)],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv", type=Path)
    parser.add_argument("--variable", required=True)
    parser.add_argument("--region", required=True)
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()
    result = parse_giovanni(args.csv, args.variable, args.region)
    output = args.out or Path(__file__).resolve().parents[1] / "api/_data/hero" / f"{args.variable}__{args.region}.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(output)


if __name__ == "__main__":
    main()
