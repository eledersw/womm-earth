"""Inspect one regional case from the same engine used by /api/py/analyze."""

import argparse
import asyncio
import sys
from pathlib import Path

from fastapi import HTTPException
from pydantic import ValidationError

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "api"))

from _models import CaseRequest  # noqa: E402
from index import analyze  # noqa: E402


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--var", required=True, dest="variable")
    parser.add_argument("--region", required=True)
    parser.add_argument("--start", type=int, required=True)
    parser.add_argument("--end", type=int, required=True)
    parser.add_argument("--season", default="ANN")
    parser.add_argument("--months", type=int, nargs="+")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)
    try:
        case = CaseRequest(variable=args.variable, regions=[args.region], start=args.start,
                           end=args.end, season=args.season, months=args.months)
        response = asyncio.run(analyze(case))
    except (ValidationError, HTTPException) as error:
        print(str(error), file=sys.stderr)
        return 2
    if args.json:
        print(response.model_dump_json(indent=2))
        return 0
    result = response.results[0]
    stats = result.stats
    fields = {
        "Region": result.region.name,
        "Slope/decade": f"{stats.change_per_decade:.4g}" if stats else "—",
        "MK p": f"{stats.mk.p:.4g}" if stats else "—",
        "Naive MK p": f"{stats.mk.p_naive:.4g}" if stats else "—",
        "OLS p": f"{stats.ols.p:.4g}" if stats else "—",
        "Tests agree": str(stats.tests_agree) if stats else "—",
        "Tier": result.verdict.tier,
        "Years needed": str(result.verdict.years_needed) if result.verdict.years_needed is not None else "—",
        "Warnings": ", ".join(result.warnings) if result.warnings else "—",
    }
    for label, value in fields.items():
        print(f"{label:16} {value}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
