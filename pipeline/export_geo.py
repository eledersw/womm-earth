"""Export the first Natural Earth geometry layer used by the globe."""

from __future__ import annotations

import argparse
import hashlib
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
ADMIN1_10M_ZIP = "https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_1_states_provinces.zip"
ADMIN1_TILE_THRESHOLD = 15
ADMIN1_10M_SHA256 = "efc59726337323058f9446210adc96673179cd344e053666ee3d28cb58ba2b05"
DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / "public" / "geo" / "countries.geojson"
GEO_DIR = DEFAULT_OUTPUT.parent
SIMPLIFY_TOLERANCE = 0.05

# Natural Earth first-level units are dissolved into broader regions before they
# reach the globe or the analysis catalog. Countries with a populated Natural
# Earth `region` field use it; these explicit mappings fill gaps for the others.
MANUAL_MACROREGIONS = {
    "IND": {
        "Ladakh": "North",
        "Andaman and Nicobar Islands": "South",
    },
    "CHN": {
        "Fujian": "East China",
        "Paracel Islands": "South Central China",
    },
    "BRA": {
        **dict.fromkeys(("Acre", "Amapá", "Amazonas", "Pará", "Rondônia", "Roraima", "Tocantins"), "North"),
        **dict.fromkeys(("Alagoas", "Bahia", "Ceará", "Maranhão", "Paraíba", "Pernambuco", "Piauí", "Rio Grande do Norte", "Sergipe"), "Northeast"),
        **dict.fromkeys(("Federal", "Goiás", "Mato Grosso", "Mato Grosso do Sul"), "Central-West"),
        **dict.fromkeys(("Espírito Santo", "Minas Gerais", "Rio de Janeiro", "São Paulo"), "Southeast"),
        **dict.fromkeys(("Paraná", "Rio Grande do Sul", "Santa Catarina"), "South"),
    },
    "NOR": {
        **dict.fromkeys(("Finnmark", "Nordland", "Troms", "Svalbard"), "Northern Norway"),
        **dict.fromkeys(("Nord-Trøndelag", "Sør-Trøndelag"), "Trøndelag"),
        **dict.fromkeys(("Hordaland", "Møre og Romsdal", "Rogaland", "Sogn og Fjordane"), "Western Norway"),
        **dict.fromkeys(("Aust-Agder", "Vest-Agder", "Telemark"), "Southern Norway"),
        **dict.fromkeys(("Akershus", "Buskerud", "Hedmark", "Oppland", "Oslo", "Vestfold", "Østfold"), "Eastern Norway"),
        "Bouvet Island": "Bouvet Island",
    },
    "AUS": {
        **dict.fromkeys(("New South Wales", "Australian Capital Territory", "Jervis Bay Territory", "Lord Howe Island"), "Eastern Australia"),
        "Queensland": "Queensland",
        "Northern Territory": "Northern Territory",
        **dict.fromkeys(("Victoria", "South Australia", "Tasmania", "Macquarie Island"), "Southern Australia"),
        "Western Australia": "Western Australia",
    },
    "GRL": {
        "Qaasuitsup": "Northwest Greenland",
        "Pituffik": "Northwest Greenland",
        "Northeast Greenland National Park": "Northeast Greenland",
        "Sermersooq": "Sermersooq",
        "Qeqqata": "Qeqqata",
        "Kujalleq": "Kujalleq",
    },
}

REGION_NAME_OVERRIDES = {
    ("RUS", "Siberian"): "Siberia",
    ("RUS", "Northwestern"): "Northwest",
    ("RUS", "Far Eastern"): "Far East",
    ("RUS", "Central"): "Central Russia",
    ("RUS", "Volga"): "Volga Russia",
    ("RUS", "Urals"): "Urals",
    ("CHN", "Northwest China"): "Northwest",
    ("CHN", "Southwest China"): "Southwest",
    ("CHN", "North China"): "North",
    ("CHN", "Northeast China"): "Northeast",
    ("CHN", "South Central China"): "South Central",
    ("CHN", "East China"): "East",
    ("CAN", "Western Canada"): "West",
    ("CAN", "Eastern Canada"): "East",
    ("CAN", "Northern Canada"): "North",
}


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


def load_admin1_sources(admin1_zip: Path | None = None):
    """Read Natural Earth 10m first-level administrative boundaries."""
    archive = admin1_zip.read_bytes() if admin1_zip else _fetch(ADMIN1_10M_ZIP)
    digest = hashlib.sha256(archive).hexdigest()
    if digest != ADMIN1_10M_SHA256:
        raise ValueError(f"Unexpected Natural Earth Admin-1 archive SHA-256: {digest}")
    return list(_from_shapefile(archive))


def _large_country_ids(country_rows: Iterable[tuple[dict, dict]]) -> set[str]:
    """Country IDs whose live POWER analysis needs at least 15 ten-degree tiles."""
    from shapely.geometry import shape

    result = set()
    for properties, raw_geometry in country_rows:
        region_id = properties.get("ADM0_A3")
        if not region_id or region_id == "USA":
            continue  # The US already has its own selectable state layer.
        geometry = shape(raw_geometry)
        polygons = list(geometry.geoms) if geometry.geom_type == "MultiPolygon" else [geometry]
        keys: set[tuple[int, int]] = set()
        for polygon in polygons:
            west, south, east, north = polygon.bounds
            for x in range(max(0, int((west + 180) // 10)), min(35, int((east + 180) // 10)) + 1):
                for y in range(max(0, int((south + 90) // 10)), min(17, int((north + 90) // 10)) + 1):
                    keys.add((x, y))
        if len(keys) >= ADMIN1_TILE_THRESHOLD:
            result.add(str(region_id))
    return result


def admin1_region_features(country_rows, admin1_rows, simplify: bool = False,
                           simplify_tolerance: float = 0.02) -> list[dict]:
    """Dissolve Admin-1 polygons into a small set of named macroregions."""
    from shapely.geometry import mapping, shape
    from shapely.ops import unary_union

    eligible = _large_country_ids(country_rows)
    country_names = {str(properties.get("ADM0_A3")): str(properties.get("NAME", ""))
                     for properties, _ in country_rows}
    grouped: dict[tuple[str, str], list] = {}
    for properties, raw_geometry in admin1_rows:
        parent = str(properties.get("adm0_a3") or "")
        unit_name = str(properties.get("name_en") or properties.get("name") or "").strip()
        if parent not in eligible or not unit_name or unit_name.casefold() == country_names.get(parent, "").casefold():
            continue
        macro_name = str(properties.get("region") or "").strip()
        if not macro_name:
            macro_name = MANUAL_MACROREGIONS.get(parent, {}).get(unit_name, "")
        if not macro_name:
            continue
        geometry = shape(raw_geometry)
        if geometry.is_empty or geometry.geom_type not in {"Polygon", "MultiPolygon"}:
            continue
        if not geometry.is_valid:
            geometry = geometry.buffer(0)
        grouped.setdefault((parent, macro_name), []).append(geometry)

    features = []
    for (parent, macro_name), geometries in sorted(grouped.items()):
        country_name = country_names.get(parent, parent)
        display_region = REGION_NAME_OVERRIDES.get((parent, macro_name), macro_name)
        geometry = unary_union(geometries)
        if not geometry.is_valid:
            geometry = geometry.buffer(0)
        if simplify:
            geometry = geometry.simplify(simplify_tolerance, preserve_topology=True)
        slug = "-".join(part for part in "".join(
            ch.lower() if ch.isalnum() else " " for ch in display_region
        ).split())
        features.append({"type": "Feature", "properties": {
            "id": f"ADM1-{parent}-{slug}", "name": f"{country_name} — {display_region}",
            "type": "subregion", "parent": parent,
        }, "geometry": mapping(geometry)})
    return features


def all_region_features(country_rows, state_rows, simplify: bool = False, admin1_rows=None) -> list[dict]:
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

    def add(region_id: str, name: str, kind: str, geometry, parent: str | None = None) -> None:
        if geometry.is_empty:
            raise ValueError(f"Empty geometry for {region_id}")
        rendered = geometry.simplify(SIMPLIFY_TOLERANCE, preserve_topology=True) if simplify else geometry
        properties = {"id": region_id, "name": name, "type": kind}
        if parent:
            properties["parent"] = parent
        features.append({"type": "Feature", "properties": properties, "geometry": mapping(rendered)})

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
        add(f"US-{postal}", properties["name"], "state", shape(geo), "USA")
    if admin1_rows is not None:
        for feature in admin1_region_features(country_rows, admin1_rows, simplify=simplify):
            props = feature["properties"]
            add(props["id"], props["name"], "subregion", shape(feature["geometry"]), props["parent"])
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
                     targets: tuple[str, ...] = ("states", "oceans", "named"), out_dir: Path = GEO_DIR,
                     admin1_zip: Path | None = None) -> None:
    countries, states = load_50m_sources(countries_zip, states_zip)
    admin1 = load_admin1_sources(admin1_zip) if "subregions" in targets else None
    features = all_region_features(countries, states, simplify=True)
    admin1_features = admin1_region_features(countries, admin1, simplify=True, simplify_tolerance=0.05) if admin1 is not None else []
    names = {"states": "us-states.geojson", "oceans": "oceans.geojson", "named": "named.geojson", "subregions": "admin1.geojson"}
    kinds = {"states": "state", "oceans": "ocean", "named": "named", "subregions": "subregion"}
    out_dir.mkdir(parents=True, exist_ok=True)
    for target in targets:
        selected = admin1_features if target == "subregions" else [
            feature for feature in features if feature["properties"]["type"] == kinds[target]
        ]
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
    parser.add_argument("--subregions", action="store_true", help="export Admin-1 divisions of large countries")
    parser.add_argument("--countries-zip", type=Path, help="local Natural Earth 50m admin-0 ZIP")
    parser.add_argument("--states-zip", type=Path, help="local Natural Earth 50m admin-1 ZIP")
    parser.add_argument("--admin1-zip", type=Path, help="local Natural Earth 10m admin-1 ZIP")
    parser.add_argument("--out-dir", type=Path, default=GEO_DIR, help="directory for new layers")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUTPUT, help="output GeoJSON path")
    args = parser.parse_args()
    targets = tuple(name for name in ("states", "oceans", "named", "subregions") if getattr(args, name))
    if not args.countries and not targets:
        parser.error("select an export target, for example --countries")
    if args.countries:
        export_countries(args.out)
    if targets:
        export_remaining(args.countries_zip, args.states_zip, targets, args.out_dir, args.admin1_zip)


if __name__ == "__main__":
    main()
