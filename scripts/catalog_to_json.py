"""Convert approved DATA_CATALOG rows to the API variable catalog."""

import argparse
import json
import re
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]


def _last_year(variable_id: str, data_dir: Path) -> int:
    path = data_dir / f"series_{variable_id}.npz"
    candidates = []
    if path.is_file():
        with np.load(path, allow_pickle=False) as archive:
            values = np.asarray(archive["values"], dtype=float)
            t0 = str(archive["t0"].item())
        finite = np.argwhere(np.isfinite(values))
        if finite.size:
            month = int(finite[:, -1].max())
            year, first_month = map(int, t0.split("-"))
            candidates.append(year + (first_month - 1 + month) // 12)
    for hero_path in (data_dir / "hero").glob(f"{variable_id}__*.json"):
        hero = json.loads(hero_path.read_text(encoding="utf-8"))
        finite = np.flatnonzero(np.isfinite(np.asarray(hero["values"], dtype=float)))
        if finite.size:
            year, first_month = map(int, hero["t0"].split("-"))
            candidates.append(year + (first_month - 1 + int(finite[-1])) // 12)
    if not candidates:
        raise ValueError("no finite observations in the data library")
    return max(candidates)


def convert_catalog(catalog: Path, data_dir: Path, output: Path) -> list[dict]:
    rows = []
    in_table = False
    for line in catalog.read_text(encoding="utf-8").splitlines():
        if line.strip() == "## Variables":
            in_table = True
            continue
        if not in_table:
            # Small controlled test catalogs may consist only of the table.
            if line.startswith("| Id |"):
                in_table = True
            else:
                continue
        if line.startswith("## "):
            break
        if not line.startswith("|") or line.startswith("| Id |") or line.startswith("|---"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        name = cells[1] if len(cells) > 1 else "unnamed row"
        if len(cells) != 13:
            raise ValueError(f"{name}: expected 13 catalog columns, got {len(cells)}")
        (variable_id, name, student, scientist, unit, source, kind, _grid,
         period, doi, _meaning, caveats, status) = cells
        if status not in {"candidate", "in store", "signed off"}:
            raise ValueError(f"{name}: unrecognized status {status!r}")
        if status not in {"in store", "signed off"}:
            continue
        try:
            if any(not value or value == "_fill_" for value in
                   (variable_id, name, student, scientist, unit, source, kind)):
                raise ValueError("required catalog field is blank")
            match = re.match(r"^(\d{4})", period)
            if match is None:
                raise ValueError("Period needs a start year")
            end_year = _last_year(variable_id, data_dir)
            rows.append({
                "id": variable_id,
                "name": name,
                "unit": unit,
                "source": source,
                "instrument": None,
                "kind": "satellite" if "satellite" in kind.lower() else "reanalysis",
                "start_year": int(match.group(1)),
                "end_year": end_year,
                "land_only": "land only" in caveats.lower(),
                "ratio_scale": unit not in {"°C", "kPa"},
                "definition_student": student,
                "definition_scientist": scientist,
                "doi": None if doi in {"", "_fill_"} else doi,
                "signed_off": status == "signed off",
            })
        except (ValueError, KeyError) as error:
            raise ValueError(f"{name}: {error}") from error
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(rows, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=ROOT / "docs" / "DATA_CATALOG.md")
    parser.add_argument("--data-dir", type=Path, default=ROOT / "api" / "_data")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    output = args.output or args.data_dir / "variables.json"
    rows = convert_catalog(args.catalog, args.data_dir, output)
    print(f"Wrote {len(rows)} variables to {output}")


if __name__ == "__main__":
    main()
