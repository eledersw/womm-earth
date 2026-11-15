"""Lazy readers for regional metadata and geometries."""

import json
from functools import lru_cache
from pathlib import Path

from _models import Region


DATA_DIR = Path(__file__).resolve().parents[1] / "_data"


@lru_cache(maxsize=32)
def _json_file(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def regions() -> dict[str, Region]:
    path = DATA_DIR / "regions.json"
    if not path.is_file():
        return {}
    rows = _json_file(path)
    return {row["id"]: Region.model_validate(row) for row in rows}


@lru_cache(maxsize=1)
def admin1_geometries() -> dict[str, dict]:
    path = DATA_DIR / "admin1.geojson"
    if not path.is_file():
        return {}
    collection = _json_file(path)
    return {feature["properties"]["id"]: feature["geometry"] for feature in collection["features"]}
