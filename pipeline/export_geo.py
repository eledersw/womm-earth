"""Export the first Natural Earth geometry layer used by the globe."""

from __future__ import annotations

import argparse
import io
import json
import urllib.request
import zipfile
from pathlib import Path
from typing import Iterable

NATURAL_EARTH_ZIP = "https://naciscdn.org/naturalearth/110m/cultural/ne_110m_admin_0_countries.zip"
NATURAL_EARTH_GEOJSON = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / "public" / "geo" / "countries.geojson"
SIMPLIFY_TOLERANCE = 0.05


def _point_segment_distance(point: list[float], start: list[float], end: list[float]) -> float:
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    if dx == 0 and dy == 0:
        return ((point[0] - start[0]) ** 2 + (point[1] - start[1]) ** 2) ** 0.5
    fraction = max(0.0, min(1.0, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)))
    closest_x = start[0] + fraction * dx
    closest_y = start[1] + fraction * dy
    return ((point[0] - closest_x) ** 2 + (point[1] - closest_y) ** 2) ** 0.5


def _rdp(points: list[list[float]], tolerance: float) -> list[list[float]]:
    if len(points) <= 2:
        return points
    farthest_index = 0
    farthest_distance = 0.0
    for index in range(1, len(points) - 1):
        distance = _point_segment_distance(points[index], points[0], points[-1])
        if distance > farthest_distance:
            farthest_index = index
            farthest_distance = distance
    if farthest_distance <= tolerance:
        return [points[0], points[-1]]
    left = _rdp(points[:farthest_index + 1], tolerance)
    right = _rdp(points[farthest_index:], tolerance)
    return left[:-1] + right


def _simplify_ring(ring: list[list[float]], tolerance: float) -> list[list[float]]:
    if len(ring) < 5:
        return ring
    closed = ring[0] == ring[-1]
    points = ring[:-1] if closed else ring
    simplified = _rdp(points, tolerance)
    if len(simplified) < 3:
        return ring
    return simplified + [simplified[0]] if closed else simplified


def simplify_geometry(geometry: dict, tolerance: float = SIMPLIFY_TOLERANCE) -> dict:
    """Simplify Polygon and MultiPolygon coordinates without changing properties."""
    kind = geometry["type"]
    coordinates = geometry["coordinates"]
    if kind == "Polygon":
        simplified = [[_simplify_ring(ring, tolerance) for ring in coordinates]]
        return {"type": kind, "coordinates": simplified[0]}
    if kind == "MultiPolygon":
        return {
            "type": kind,
            "coordinates": [
                [_simplify_ring(ring, tolerance) for ring in polygon]
                for polygon in coordinates
            ],
        }
    raise ValueError(f"Unsupported country geometry type: {kind}")


def country_feature(properties: dict, geometry: dict) -> dict:
    """Keep the stable region id/name/type contract and its source geometry."""
    region_id = properties.get("ADM0_A3")
    name = properties.get("NAME")
    if not region_id or not name:
        raise ValueError("Natural Earth country is missing ADM0_A3 or NAME")
    return {
        "type": "Feature",
        "properties": {"id": str(region_id), "name": str(name), "type": "country"},
        "geometry": geometry,
    }


def _fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "womm-earth-geo-export/1.0"})
    with urllib.request.urlopen(request, timeout=90) as response:
        return response.read()


def _from_shapefile(archive_bytes: bytes) -> Iterable[tuple[dict, dict]]:
    import shapefile

    with zipfile.ZipFile(io.BytesIO(archive_bytes)) as archive:
        shp_name = next(name for name in archive.namelist() if name.lower().endswith(".shp"))
        base = shp_name[:-4]
        shp = archive.read(shp_name)
        dbf = archive.read(base + ".dbf")
        shx = archive.read(base + ".shx")
    reader = shapefile.Reader(shp=io.BytesIO(shp), dbf=io.BytesIO(dbf), shx=io.BytesIO(shx), encoding="utf-8")
    for item in reader.iterShapeRecords():
        yield item.record.as_dict(), item.shape.__geo_interface__


def _from_geojson(data: bytes) -> Iterable[tuple[dict, dict]]:
    collection = json.loads(data)
    for feature in collection["features"]:
        yield feature["properties"], feature["geometry"]


def load_countries() -> tuple[list[tuple[dict, dict]], str]:
    try:
        return list(_from_shapefile(_fetch(NATURAL_EARTH_ZIP))), NATURAL_EARTH_ZIP
    except Exception as primary_error:
        try:
            return list(_from_geojson(_fetch(NATURAL_EARTH_GEOJSON))), NATURAL_EARTH_GEOJSON
        except Exception as fallback_error:
            raise RuntimeError(
                "Could not load Natural Earth from either the official zip or the GeoJSON fallback. "
                f"Primary error: {primary_error}; fallback error: {fallback_error}"
            ) from fallback_error


def export_countries(output: Path = DEFAULT_OUTPUT) -> int:
    source_features, source = load_countries()
    features = [
        country_feature(properties, simplify_geometry(geometry))
        for properties, geometry in source_features
    ]
    collection = {"type": "FeatureCollection", "features": features}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(collection, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Wrote {len(features)} countries to {output} from {source}")
    return len(features)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--countries", action="store_true", help="export Natural Earth admin-0 countries")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUTPUT, help="output GeoJSON path")
    args = parser.parse_args()
    if not args.countries:
        parser.error("select an export target, for example --countries")
    export_countries(args.out)


if __name__ == "__main__":
    main()
