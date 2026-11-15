"""NASA POWER Manager metadata and request-time monthly regional data."""

from __future__ import annotations

import asyncio
import json
import math
import re
import sys
import threading
import time
from collections import OrderedDict
from dataclasses import dataclass
from functools import lru_cache
from weakref import WeakKeyDictionary
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
MAX_ATTEMPTS = 4
MAX_RETRY_WAIT_SECONDS = 15.0
# NASA requests one server instance runs at once, shared by every analysis on it.
MAX_CONCURRENT_REQUESTS = 6
# Compact NASA boxes kept in memory per instance (float32, about 0.8 MB per 10 x 10 degree box).
CACHE_BUDGET_BYTES = 192 * 1024 * 1024
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


def _retry_delay(error: HTTPError, attempt: int) -> float:
    """Seconds to wait before retrying: NASA's Retry-After when given, else 1, 2, 4 s."""
    header = error.headers.get("Retry-After") if error.headers else None
    try:
        return min(MAX_RETRY_WAIT_SECONDS, max(0.0, float(header))) if header else float(2 ** attempt)
    except ValueError:
        return float(2 ** attempt)


def _request_json(url: str) -> dict[str, Any]:
    request = Request(url, headers={"User-Agent": "womm-earth/1.0"})
    try:
        for attempt in range(MAX_ATTEMPTS):
            try:
                with urlopen(request, timeout=HTTP_TIMEOUT_SECONDS) as response:
                    if response.status < 200 or response.status >= 300:
                        raise PowerUpstreamError("NASA POWER returned an error.", status_code=response.status)
                    body = response.read(MAX_RESPONSE_BYTES + 1)
                break
            except HTTPError as error:
                # Logged so a refusal (429) is distinguishable from an outage (5xx) in Vercel logs.
                print(f"NASA POWER HTTP {error.code} (attempt {attempt + 1}/{MAX_ATTEMPTS}): {url.split('?')[0]}", file=sys.stderr)
                if error.code in RETRYABLE_HTTP_STATUSES and attempt < MAX_ATTEMPTS - 1:
                    time.sleep(_retry_delay(error, attempt))
                    continue
                raise PowerUpstreamError("NASA POWER returned an error.", status_code=error.code) from error
    except (TimeoutError, URLError, OSError) as error:
        print(f"NASA POWER unreachable ({type(error).__name__}): {url.split('?')[0]}", file=sys.stderr)
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


@dataclass(frozen=True)
class _Block:
    """One NASA response, compacted: grid points and their monthly values from `start` (January) on."""

    longitude: np.ndarray
    latitude: np.ndarray
    values: np.ndarray  # float32, shape (points, months)
    start: int

    @property
    def nbytes(self) -> int:
        return self.longitude.nbytes + self.latitude.nbytes + self.values.nbytes


def _compact(response: dict[str, Any], variable: Variable, start: int, end: int) -> _Block:
    """Turn one NASA JSON response into a compact block (3 MB of JSON becomes about 0.8 MB)."""
    months = (end - start + 1) * 12
    features = response.get("features", [response] if "properties" in response else None)
    if not isinstance(features, list):
        raise PowerUpstreamError("NASA POWER response has no grid features.")
    fill_value = float(response.get("header", {}).get("fill_value", -999))
    longitudes: list[float] = []
    latitudes: list[float] = []
    rows: list[np.ndarray] = []
    seen: set[tuple[float, float]] = set()
    for feature in features:
        try:
            coordinates = feature["geometry"]["coordinates"]
            longitude, latitude = float(coordinates[0]), float(coordinates[1])
            monthly = feature["properties"]["parameter"][variable.id]
        except (KeyError, IndexError, TypeError, ValueError) as error:
            raise PowerUpstreamError("NASA POWER regional response has an invalid grid feature.") from error
        if not isinstance(monthly, dict):
            raise PowerUpstreamError("NASA POWER regional response has invalid parameter values.")
        if (longitude, latitude) in seen:
            continue
        seen.add((longitude, latitude))
        row = np.full(months, np.nan, dtype=np.float32)
        for date_key, raw_value in monthly.items():
            if not isinstance(date_key, str) or len(date_key) != 6:
                continue
            try:
                year, month, value = int(date_key[:4]), int(date_key[4:]), float(raw_value)
            except (TypeError, ValueError):
                continue
            # POWER also emits YYYY13 as an annual value; the engine builds years itself.
            if month < 1 or month > 12 or year < start or year > end:
                continue
            if not math.isfinite(value) or value == fill_value:
                continue
            row[(year - start) * 12 + month - 1] = value
        longitudes.append(longitude)
        latitudes.append(latitude)
        rows.append(row)
    values = np.vstack(rows) if rows else np.empty((0, months), dtype=np.float32)
    return _Block(np.asarray(longitudes, dtype=float), np.asarray(latitudes, dtype=float), values, start)


def _region_masks(blocks: list[_Block], geometry: dict[str, Any] | None) -> list[np.ndarray]:
    """Which grid points of each block count for the region: inside it, and not already
    counted from a neighbouring box (boxes share their boundary cells)."""
    seen: set[tuple[float, float]] = set()
    masks = []
    for block in blocks:
        mask = np.zeros(len(block.longitude), dtype=bool)
        for index, (longitude, latitude) in enumerate(zip(block.longitude.tolist(), block.latitude.tolist())):
            if (longitude, latitude) in seen:
                continue
            if geometry is not None and not _inside_country(longitude, latitude, geometry):
                continue
            seen.add((longitude, latitude))
            mask[index] = True
        masks.append(mask)
    return masks


def _weighted_mean(blocks: list[_Block], masks: list[np.ndarray], start: int, end: int) -> tuple[np.ndarray, str]:
    """Latitude-weighted mean of the selected grid points, for start..end."""
    count = (end - start + 1) * 12
    weighted_sum = np.zeros(count, dtype=float)
    weight_sum = np.zeros(count, dtype=float)
    for block, mask in zip(blocks, masks):
        if not mask.any():
            continue
        offset = (start - block.start) * 12
        lo, hi = max(0, offset), min(block.values.shape[1], offset + count)
        if hi <= lo:
            continue
        values = block.values[mask, lo:hi].astype(float)
        weights = np.cos(np.radians(block.latitude[mask]))[:, None]
        finite = np.isfinite(values)
        weighted_sum[lo - offset:hi - offset] += np.where(finite, values * weights, 0.0).sum(axis=0)
        weight_sum[lo - offset:hi - offset] += (finite * weights).sum(axis=0)
    values = np.full(count, np.nan, dtype=float)
    valid = weight_sum > 0
    if not valid.any():
        raise PowerUpstreamError("NASA POWER returned no usable monthly observations.")
    values[valid] = weighted_sum[valid] / weight_sum[valid]
    return values, f"{start}-01"


def _region_mean(blocks: list[_Block], start: int, end: int,
                 geometry: dict[str, Any] | None = None) -> tuple[np.ndarray, str]:
    return _weighted_mean(blocks, _region_masks(blocks, geometry), start, end)


def _monthly_region_series(
    payload: dict[str, Any] | list[dict[str, Any]], variable: Variable, start: int, end: int,
    geometry: dict[str, Any] | None = None,
) -> tuple[np.ndarray, str]:
    responses = payload if isinstance(payload, list) else [payload]
    return _region_mean([_compact(response, variable, start, end) for response in responses], start, end, geometry)


class _BlockCache:
    """Least-recently-used compact NASA boxes, bounded by bytes and shared by all requests on an instance."""

    def __init__(self, budget: int):
        self.budget = budget
        self._items: OrderedDict[tuple, _Block] = OrderedDict()
        self._bytes = 0
        self._lock = threading.Lock()

    def get(self, key: tuple) -> _Block | None:
        with self._lock:
            block = self._items.get(key)
            if block is not None:
                self._items.move_to_end(key)
            return block

    def put(self, key: tuple, block: _Block) -> None:
        with self._lock:
            if key in self._items:
                return
            self._items[key] = block
            self._bytes += block.nbytes
            while self._bytes > self.budget and len(self._items) > 1:
                _, old = self._items.popitem(last=False)
                self._bytes -= old.nbytes

    def __len__(self) -> int:
        return len(self._items)

    def clear(self) -> None:
        with self._lock:
            self._items.clear()
            self._bytes = 0


_CACHE = _BlockCache(CACHE_BUDGET_BYTES)
_SEMAPHORES: "WeakKeyDictionary[asyncio.AbstractEventLoop, asyncio.Semaphore]" = WeakKeyDictionary()
_INFLIGHT: "WeakKeyDictionary[asyncio.AbstractEventLoop, dict[tuple, asyncio.Future]]" = WeakKeyDictionary()


_MASKS: "OrderedDict[tuple, list[np.ndarray]]" = OrderedDict()
_MASKS_LIMIT = 512
_masks_lock = threading.Lock()


def _cached_masks(key: tuple, blocks: list[_Block], geometry: dict[str, Any] | None) -> list[np.ndarray]:
    with _masks_lock:
        if key in _MASKS:
            _MASKS.move_to_end(key)
            return _MASKS[key]
    masks = _region_masks(blocks, geometry)
    with _masks_lock:
        _MASKS[key] = masks
        while len(_MASKS) > _MASKS_LIMIT:
            _MASKS.popitem(last=False)
    return masks


def clear_cache() -> None:
    _CACHE.clear()
    with _masks_lock:
        _MASKS.clear()


async def _block(key: tuple, url: str, variable: Variable, start: int, end: int) -> _Block:
    """One NASA box: from the cache, from an identical request already in flight, or fetched now."""
    cached = _CACHE.get(key)
    if cached is not None:
        return cached
    loop = asyncio.get_running_loop()
    inflight = _INFLIGHT.setdefault(loop, {})
    if key in inflight:
        return await asyncio.shield(inflight[key])
    future: asyncio.Future = loop.create_future()
    inflight[key] = future
    try:
        semaphore = _SEMAPHORES.setdefault(loop, asyncio.Semaphore(MAX_CONCURRENT_REQUESTS))
        async with semaphore:
            payload = await asyncio.to_thread(_request_json, url)
        block = _compact(payload, variable, start, end)
        del payload  # drop the parsed JSON as soon as it is compacted
        _CACHE.put(key, block)
        future.set_result(block)
        return block
    except BaseException as error:
        future.set_exception(error)
        future.exception()  # mark as retrieved; waiters re-raise it themselves
        raise
    finally:
        inflight.pop(key, None)


async def fetch_monthly_region(
    variable: Variable, region: Region, start: int, end: int
) -> tuple[np.ndarray, str]:
    """Fetch POWER point or tiled regional data and return its weighted series.

    Each NASA box is requested once for the variable's whole record and cached, so a
    different period or season, or another region sharing the box, costs no request.
    """
    full_start, full_end = min(start, variable.start_year), max(end, variable.end_year)
    community = variable.power_community
    try:
        if uses_point_fallback(region):
            longitude, latitude = region.centroid
            key = (variable.id, community, "point", round(latitude, 4), round(longitude, 4), full_start, full_end)
            blocks = [await _block(key, _point_url(variable, region, full_start, full_end), variable, full_start, full_end)]
            geometry, boxes = None, ("point",)
        else:
            tiles = _region_tiles(region)
            geometry = _region_geometry(region)
            blocks = await asyncio.gather(*(
                _block((variable.id, community, "box", *tile, full_start, full_end),
                       _regional_url(variable, region, full_start, full_end, tile), variable, full_start, full_end)
                for tile in tiles
            ))
            boxes = tuple(tiles)
        blocks = list(blocks)

        def mean() -> tuple[np.ndarray, str]:
            # NASA grids are fixed, so a region's masks are the same for every variable and period.
            masks = _cached_masks((region.id, boxes, tuple(len(b.longitude) for b in blocks)), blocks, geometry)
            return _weighted_mean(blocks, masks, start, end)

        return await asyncio.to_thread(mean)
    except PowerUpstreamError:
        raise
    except Exception as error:
        raise PowerUpstreamError("NASA POWER regional data is unavailable.") from error
