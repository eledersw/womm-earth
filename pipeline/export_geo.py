"""Export the first Natural Earth geometry layer used by the globe."""

from __future__ import annotations

import argparse
import io
import json
import sys
import urllib.request
import zipfile
from pathlib import Path
from typing import Iterable

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

NATURAL_EARTH_ZIP = "https://naciscdn.org/naturalearth/110m/cultural/ne_110m_admin_0_countries.zip"
NATURAL_EARTH_GEOJSON = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
COUNTRIES_50M_ZIP = "https://naciscdn.org/naturalearth/50m/cultural/ne_50m_admin_0_countries.zip"
STATES_50M_ZIP = "https://naciscdn.org/naturalearth/50m/cultural/ne_50m_admin_1_states_provinces.zip"
DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / "public" / "geo" / "countries.geojson"
GEO_DIR = DEFAULT_OUTPUT.parent
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


def load_50m_sources(countries_zip: Path | None = None, states_zip: Path | None = None):
    """Read Natural Earth 50m layers, accepting local ZIPs for offline reruns."""
    countries = countries_zip.read_bytes() if countries_zip else _fetch(COUNTRIES_50M_ZIP)
    states = states_zip.read_bytes() if states_zip else _fetch(STATES_50M_ZIP)
    return list(_from_shapefile(countries)), list(_from_shapefile(states))


def all_region_features(country_rows, state_rows, simplify: bool = False) -> list[dict]:
    """Share stable region geometry between the library and GeoJSON exporter."""
    from shapely.geometry import box, mapping, shape
    from shapely.ops import unary_union

    from pipeline.named_regions import NAMED, OCEANS

    mainland = {
        "FRA": (-6, 41, 10, 52),
        "NLD": (3, 50, 8, 54),
        "NOR": (4, 57, 32, 72),
    }
    features = []
    land_parts = []

    def add(region_id: str, name: str, kind: str, geometry) -> None:
        if geometry.is_empty:
            raise ValueError(f"Empty geometry for {region_id}")
        rendered = geometry.simplify(SIMPLIFY_TOLERANCE, preserve_topology=True) if simplify else geometry
        features.append({"type": "Feature", "properties": {"id": region_id, "name": name, "type": kind}, "geometry": mapping(rendered)})

    for properties, geo in country_rows:
        region_id = properties["ADM0_A3"]
        geometry = shape(geo)
        if region_id in mainland:
            geometry = geometry.intersection(box(*mainland[region_id]))
        add(region_id, properties["NAME"], "country", geometry)
        land_parts.append(geometry)
    land = unary_union(land_parts)
    for properties, geo in state_rows:
        if properties.get("iso_a2") != "US":
            continue
        postal = properties.get("postal")
        if not postal or len(postal) != 2:
            raise ValueError(f"US state missing postal code: {properties.get('name')}")
        add(f"US-{postal}", properties["name"], "state", shape(geo))
    world = box(-180, -90, 180, 90)
    for item in NAMED + OCEANS:
        region_id = item["id"]
        if region_id == "NR-LAND":
            geometry = land
        elif region_id == "NR-OCEAN":
            geometry = world.difference(land)
        else:
            geometry = unary_union([box(*bounds) for bounds in item.get("boxes", [item["bbox"]])])
            if item["land_only"]:
                geometry = geometry.intersection(land)
            elif region_id.startswith("OCN-"):
                geometry = geometry.difference(land)
        add(region_id, item["name"], "ocean" if region_id.startswith("OCN-") else "named", geometry)
    ids = [feature["properties"]["id"] for feature in features]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate Natural Earth region ids")
    return features


def export_remaining(countries_zip: Path | None = None, states_zip: Path | None = None,
                     targets: tuple[str, ...] = ("states", "oceans", "named"), out_dir: Path = GEO_DIR) -> None:
    countries, states = load_50m_sources(countries_zip, states_zip)
    features = all_region_features(countries, states, simplify=True)
    names = {"states": "us-states.geojson", "oceans": "oceans.geojson", "named": "named.geojson"}
    kinds = {"states": "state", "oceans": "ocean", "named": "named"}
    out_dir.mkdir(parents=True, exist_ok=True)
    for target in targets:
        selected = [feature for feature in features if feature["properties"]["type"] == kinds[target]]
        path = out_dir / names[target]
        path.write_text(json.dumps({"type": "FeatureCollection", "features": selected}, separators=(",", ":")) + "\n", encoding="utf-8")
        if path.stat().st_size >= 2_000_000:
            raise ValueError(f"{path} is >= 2 MB; simplify further before committing")
        print(f"Wrote {len(selected)} regions to {path} ({path.stat().st_size} bytes)")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--countries", action="store_true", help="export Natural Earth admin-0 countries")
    parser.add_argument("--states", action="store_true", help="export US states")
    parser.add_argument("--oceans", action="store_true", help="export ocean basins")
    parser.add_argument("--named", action="store_true", help="export named regions")
    parser.add_argument("--countries-zip", type=Path, help="local Natural Earth 50m admin-0 ZIP")
    parser.add_argument("--states-zip", type=Path, help="local Natural Earth 50m admin-1 ZIP")
    parser.add_argument("--out-dir", type=Path, default=GEO_DIR, help="directory for new layers")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUTPUT, help="output GeoJSON path")
    args = parser.parse_args()
    targets = tuple(name for name in ("states", "oceans", "named") if getattr(args, name))
    if not args.countries and not targets:
        parser.error("select an export target, for example --countries")
    if args.countries:
        export_countries(args.out)
    if targets:
        export_remaining(args.countries_zip, args.states_zip, targets, args.out_dir)


if __name__ == "__main__":
    main()
