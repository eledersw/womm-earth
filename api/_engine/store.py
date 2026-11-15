"""Lazy readers for the compact region library and Giovanni hero series."""

import json
from functools import lru_cache
from pathlib import Path

import numpy as np

from _models import Region, Variable


DATA_DIR = Path(__file__).resolve().parents[1] / "_data"


@lru_cache(maxsize=32)
def _json_file(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache(maxsize=16)
def _npz_file(path: Path) -> tuple[np.ndarray, tuple[str, ...], str]:
    with np.load(path, allow_pickle=False) as archive:
        values = archive["values"]
        region_ids = tuple(str(item) for item in archive["region_ids"])
        t0 = str(archive["t0"].item())
    return values, region_ids, t0


def variables() -> dict[str, Variable]:
    path = DATA_DIR / "variables.json"
    if not path.is_file():
        return {}
    rows = _json_file(path)
    return {row["id"]: Variable.model_validate(row) for row in rows}


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


def hero_metadata(variable: str, region: str) -> dict | None:
    path = DATA_DIR / "hero" / f"{variable}__{region}.json"
    return _json_file(path) if path.is_file() else None


def get_series(variable: str, region: str) -> tuple[np.ndarray, str] | None:
    hero = hero_metadata(variable, region)
    if hero is not None:
        return np.asarray(hero["values"], dtype=float), hero["t0"]
    path = DATA_DIR / f"series_{variable}.npz"
    if not path.is_file():
        return None
    values, region_ids, t0 = _npz_file(path)
    try:
        index = region_ids.index(region)
    except ValueError:
        return None
    return values[index], t0
