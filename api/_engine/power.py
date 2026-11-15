"""NASA POWER Manager metadata and request-time monthly regional data."""

from __future__ import annotations

import asyncio
import json
import math
import re
import threading
import time
from functools import lru_cache
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import numpy as np

from _models import Region, Variable
from .store import admin1_geometries


PowerCommunity = Literal["AG", "RE", "SB"]
MANAGER_URL = "https://power.larc.nasa.gov/api/system/manager/parameters"
MONTHLY_REGIONAL_URL = "https://power.larc.nasa.gov/api/temporal/monthly/regional"
# POWER currently returns the same monthly parameter codes in AG, RE, and SB.
# AG is canonical because its Manager units match the request community we use
# for the regional data call; keeping one community avoids duplicate options
# with different display units (for example, solar irradiance).
COMMUNITIES: tuple[PowerCommunity, ...] = ("AG",)
HTTP_TIMEOUT_SECONDS = 25
RETRYABLE_HTTP_STATUSES = {429, 500, 502, 503, 504}
MAX_RESPONSE_BYTES = 8 * 1024 * 1024
CATALOG_TTL_SECONDS = 6 * 60 * 60
CATALOG_FALLBACK_TTL_SECONDS = 15 * 60
MIN_REGION_SPAN = 2.0
MAX_REGION_SPAN = 10.0
MAX_REGION_TILES = 128
API_USER = "wommearth"
_HOURLY_PARAMETER_NAME = re.compile(
    r"(?:\bat\s+\d{2}\s+Hour\b|\bHour-Based Parameter Set\b)",
    re.IGNORECASE,
)


class PowerUpstreamError(Exception):
    """A safe-to-handle failure while requesting or parsing NASA POWER."""

    def __init__(self, message: str, *, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


_catalog_lock = threading.Lock()
_catalog_expires_at = 0.0
_catalog_cache: tuple[Variable, ...] = ()
_APPROVED = json.loads(
    (Path(__file__).resolve().parent.parent / "_data" / "approved_power_variables.json").read_text(encoding="utf-8")
)
_CATALOG_SNAPSHOT = json.loads(
    (Path(__file__).resolve().parent.parent / "_data" / "power_manager_snapshot.json").read_text(encoding="utf-8")
)


@lru_cache(maxsize=1)
def _country_geometries() -> dict[str, dict[str, Any]]:
    path = Path(__file__).resolve().parent.parent / "_data" / "countries.geojson"
    features = json.loads(path.read_text(encoding="utf-8"))["features"]
    return {feature["properties"]["id"]: feature["geometry"] for feature in features}


def _point_in_ring(longitude: float, latitude: float, ring: list[list[float]]) -> bool:
    inside = False
    previous = ring[-1]
    for current in ring:
        x1, y1 = previous[:2]
        x2, y2 = current[:2]
        if (y1 > latitude) != (y2 > latitude):
            crossing = (x2 - x1) * (latitude - y1) / (y2 - y1) + x1
            if longitude < crossing:
                inside = not inside
        previous = current
    return inside


def _inside_country(longitude: float, latitude: float, geometry: dict[str, Any]) -> bool:
    polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
    return any(_point_in_ring(longitude, latitude, polygon[0]) and
               not any(_point_in_ring(longitude, latitude, hole) for hole in polygon[1:])
               for polygon in polygons)


def _region_geometry(region: Region) -> dict[str, Any] | None:
    if region.type == "country":
        return _country_geometries().get(region.id)
    if region.type == "subregion":
        return admin1_geometries().get(region.id)
    return None


def _request_json(url: str) -> dict[str, Any]:
    request = Request(url, headers={"User-Agent": "womm-earth/1.0"})
    try:
        for attempt in range(3):
            try:
                with urlopen(request, timeout=HTTP_TIMEOUT_SECONDS) as response:
                    if response.status < 200 or response.status >= 300:
                        raise PowerUpstreamError("NASA POWER returned an error.", status_code=response.status)
                    body = response.read(MAX_RESPONSE_BYTES + 1)
                break
            except HTTPError as error:
                if error.code in RETRYABLE_HTTP_STATUSES and attempt < 2:
                    time.sleep(0.5 * (attempt + 1))
                    continue
                raise PowerUpstreamError("NASA POWER returned an error.", status_code=error.code) from error
    except (TimeoutError, URLError, OSError) as error:
        raise PowerUpstreamError("NASA POWER could not be reached.") from error

    if len(body) > MAX_RESPONSE_BYTES:
        raise PowerUpstreamError("NASA POWER response exceeded the supported size.")
    try:
        payload = json.loads(body)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise PowerUpstreamError("NASA POWER returned invalid JSON.") from error
    if not isinstance(payload, dict):
        raise PowerUpstreamError("NASA POWER returned an unexpected response.")
    return payload


def _manager_url(community: PowerCommunity) -> str:
    query = urlencode({
        "community": community,
        "temporal": "monthly",
        "metadata": "true",
        "user": API_USER,
    })
    return f"{MANAGER_URL}?{query}"


def _year(value: Any, default: int) -> int:
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        digits = "".join(character for character in value if character.isdigit())
        if len(digits) >= 4:
            return int(digits[:4])
    return default


def _variable(code: str, metadata: dict[str, Any], community: PowerCommunity) -> Variable:
    approved = _APPROVED[code]
    category = str(metadata.get("type") or "OTHER").upper()
    latest_completed_year = datetime.now(timezone.utc).year - 1
    return Variable(
        id=code,
        name=approved["name"],
        unit=str(metadata.get("units") or "unknown"),
        source=approved["source"],
        instrument=None,
        kind=approved["kind"],
        start_year=max(_year(metadata.get("time_start"), 1981), approved["start_year"]),
        end_year=min(_year(metadata.get("time_end"), latest_completed_year), latest_completed_year),
        land_only=False,
        ratio_scale=False,
        definition_student=approved["definition_student"],
        definition_scientist=approved["definition_scientist"],
        doi=None,
        signed_off=True,
        power_community=community,
        power_type=category,
    )


def _load_monthly_parameters() -> tuple[Variable, ...]:
    global _catalog_cache, _catalog_expires_at
    with _catalog_lock:
        now = time.monotonic()
        if _catalog_cache and now < _catalog_expires_at:
            return _catalog_cache

        by_code: dict[str, Variable] = {}
        for community in COMMUNITIES:
            try:
                payload = _request_json(_manager_url(community))
            except PowerUpstreamError:
                snapshot_community = _CATALOG_SNAPSHOT["community"]
                snapshot = _CATALOG_SNAPSHOT["parameters"]
                fallback = tuple(
                    _variable(code, metadata, snapshot_community)
                    for code, metadata in sorted(snapshot.items())
                    if code in _APPROVED
                    and str(metadata.get("temporal", "")).upper() == "MONTHLY"
                    and not _HOURLY_PARAMETER_NAME.search(str(metadata.get("name") or ""))
                )
                if not fallback:
                    raise
                _catalog_cache = fallback
                _catalog_expires_at = now + CATALOG_FALLBACK_TTL_SECONDS
                return _catalog_cache
            for code, metadata in payload.items():
                if not isinstance(code, str) or not isinstance(metadata, dict):
                    continue
                if code not in _APPROVED:
                    continue
                if str(metadata.get("temporal", "")).upper() != "MONTHLY":
                    continue
                if _HOURLY_PARAMETER_NAME.search(str(metadata.get("name") or "")):
                    continue
                by_code.setdefault(code, _variable(code, metadata, community))

        if not by_code:
            raise PowerUpstreamError("NASA POWER returned no monthly parameters.")
        _catalog_cache = tuple(by_code[code] for code in sorted(by_code))
        _catalog_expires_at = now + CATALOG_TTL_SECONDS
        return _catalog_cache


async def list_monthly_parameters() -> list[Variable]:
    """Return all monthly parameters in the supported POWER communities."""
    try:
        return list(await asyncio.to_thread(_load_monthly_parameters))
    except PowerUpstreamError:
        raise
    except Exception as error:
        raise PowerUpstreamError("NASA POWER parameter catalogue is unavailable.") from error


def _regional_url(variable: Variable, region: Region, start: int, end: int,
                  bbox: tuple[float, float, float, float] | None = None) -> str:
    west, south, east, north = bbox or region.bbox
    query = urlencode({
        "parameters": variable.id,
        "community": variable.power_community,
        "longitude-min": west,
        "longitude-max": east,
        "latitude-min": south,
        "latitude-max": north,
        "start": start,
        "end": end,
        "format": "JSON",
        "user": API_USER,
    })
    return f"{MONTHLY_REGIONAL_URL}?{query}"


def _point_url(variable: Variable, region: Region, start: int, end: int) -> str:
    longitude, latitude = region.centroid
    query = urlencode({
        "parameters": variable.id, "community": variable.power_community,
        "longitude": longitude, "latitude": latitude, "start": start, "end": end,
        "format": "JSON", "user": API_USER,
    })
    return f"{MONTHLY_REGIONAL_URL.replace('/regional', '/point')}?{query}"


def uses_point_fallback(region: Region) -> bool:
    west, south, east, north = region.bbox
    return east - west < MIN_REGION_SPAN or north - south < MIN_REGION_SPAN


def _axis_tiles(lower: float, upper: float) -> list[tuple[float, float]]:
    count = math.ceil((upper - lower) / MAX_REGION_SPAN)
    width = (upper - lower) / count
    return [(lower + index * width, lower + (index + 1) * width)
            for index in range(count)]


def _region_tiles(region: Region) -> list[tuple[float, float, float, float]]:
    geometry = _region_geometry(region)
    if region.type == "subregion" and geometry is None:
        raise PowerUpstreamError("Subregion geometry is unavailable.", status_code=422)
    if geometry is not None:
        polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
        keys: set[tuple[int, int]] = set()
        for polygon in polygons:
            points = [point for ring in polygon for point in ring]
            west, east = min(p[0] for p in points), max(p[0] for p in points)
            south, north = min(p[1] for p in points), max(p[1] for p in points)
            for x in range(max(0, math.floor((west + 180) / MAX_REGION_SPAN)),
                           min(35, math.floor((east + 180) / MAX_REGION_SPAN)) + 1):
                for y in range(max(0, math.floor((south + 90) / MAX_REGION_SPAN)),
                               min(17, math.floor((north + 90) / MAX_REGION_SPAN)) + 1):
                    keys.add((x, y))
        tiles = [(x * 10 - 180, y * 10 - 90, x * 10 - 170, y * 10 - 80) for x, y in sorted(keys)]
    else:
        west, south, east, north = region.bbox
        tiles = [(left, bottom, right, top)
                 for left, right in _axis_tiles(west, east)
                 for bottom, top in _axis_tiles(south, north)]
    if len(tiles) > MAX_REGION_TILES:
        raise PowerUpstreamError("Region is too large for live POWER analysis.", status_code=422)
    return tiles


def _monthly_region_series(
    payload: dict[str, Any] | list[dict[str, Any]], variable: Variable, start: int, end: int,
    geometry: dict[str, Any] | None = None,
) -> tuple[np.ndarray, str]:
    count = (end - start + 1) * 12
    weighted_sum = np.zeros(count, dtype=float)
    weight_sum = np.zeros(count, dtype=float)
    seen_coordinates: set[tuple[float, float]] = set()
    for response in payload if isinstance(payload, list) else [payload]:
        features = response.get("features", [response] if "properties" in response else None)
        if not isinstance(features, list):
            raise PowerUpstreamError("NASA POWER response has no grid features.")
        fill_value = response.get("header", {}).get("fill_value", -999)
        for feature in features:
            try:
                feature_geometry = feature["geometry"]
                longitude = float(feature_geometry["coordinates"][0])
                latitude = float(feature_geometry["coordinates"][1])
                monthly = feature["properties"]["parameter"][variable.id]
            except (KeyError, IndexError, TypeError, ValueError) as error:
                raise PowerUpstreamError("NASA POWER regional response has an invalid grid feature.") from error
            if not isinstance(monthly, dict):
                raise PowerUpstreamError("NASA POWER regional response has invalid parameter values.")
            if (longitude, latitude) in seen_coordinates:
                continue
            if geometry is not None and not _inside_country(longitude, latitude, geometry):
                continue
            seen_coordinates.add((longitude, latitude))

            weight = math.cos(math.radians(latitude))
            for date_key, raw_value in monthly.items():
                if not isinstance(date_key, str) or len(date_key) != 6:
                    continue
                try:
                    year = int(date_key[:4])
                    month = int(date_key[4:])
                    value = float(raw_value)
                except (TypeError, ValueError):
                    continue
                # POWER also emits YYYY13 as an annual value; the engine builds years itself.
                if month < 1 or month > 12 or year < start or year > end:
                    continue
                if not math.isfinite(value) or value == float(fill_value):
                    continue
                index = (year - start) * 12 + month - 1
                weighted_sum[index] += value * weight
                weight_sum[index] += weight

    values = np.full(count, np.nan, dtype=float)
    valid = weight_sum > 0
    if not valid.any():
        raise PowerUpstreamError("NASA POWER returned no usable monthly observations.")
    values[valid] = weighted_sum[valid] / weight_sum[valid]
    return values, f"{start}-01"


async def fetch_monthly_region(
    variable: Variable, region: Region, start: int, end: int
) -> tuple[np.ndarray, str]:
    """Fetch POWER point or tiled regional data and return its weighted series."""
    try:
        if uses_point_fallback(region):
            payload = await asyncio.to_thread(_request_json, _point_url(variable, region, start, end))
            geometry = None
        else:
            tiles = _region_tiles(region)
            geometry = _region_geometry(region)
            semaphore = asyncio.Semaphore(3)

            async def fetch(tile: tuple[float, float, float, float]) -> dict[str, Any]:
                async with semaphore:
                    return await asyncio.to_thread(_request_json, _regional_url(variable, region, start, end, tile))

            payload = await asyncio.gather(*(fetch(tile) for tile in tiles))
        return _monthly_region_series(payload, variable, start, end, geometry)
    except PowerUpstreamError:
        raise
    except Exception as error:
        raise PowerUpstreamError("NASA POWER regional data is unavailable.") from error
