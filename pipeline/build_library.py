"""Build the regional monthly library from NASA POWER Zarr grids.

Run ``--geometry-only`` first to create regions.json without downloading climate
data. Use ``--vars`` for real series; no synthetic values are ever written.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pipeline.export_geo import all_region_features, load_50m_sources
from pipeline.named_regions import NAMED, OCEANS

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "api/_data"
MERRA2_URL = "https://nasa-power.s3.us-west-2.amazonaws.com/merra2/temporal/power_merra2_monthly_temporal_utc.zarr"
CERES_URL = "https://nasa-power.s3.amazonaws.com/syn1deg/temporal/power_syn1deg_monthly_temporal_lst.zarr"
CERES_VARS = {"ALLSKY_SFC_SW_DWN", "CLOUD_AMT"}
LAND_ONLY_VARS = {"GWETROOT", "GWETTOP"}


def weighted_means(values: np.ndarray, weights) -> np.ndarray:
    """Area-weighted means with a denominator for each month's valid cells."""
    clean = np.asarray(values, dtype=np.float32).copy()
    clean[clean <= -990] = np.nan
    valid = np.isfinite(clean)
    safe = np.where(valid, clean, 0)
    # A sparse [cells, regions] matrix keeps the global grid affordable.
    num = np.asarray((weights.T @ safe.T).T)
    den = np.asarray((weights.T @ valid.astype(np.float32).T).T)
    with np.errstate(divide="ignore", invalid="ignore"):
        return np.where(den > 0, num / den, np.nan).astype(np.float32)


def region_records(features: list[dict]) -> list[dict]:
    from shapely.geometry import shape

    records = []
    for feature in features:
        props = feature["properties"]
        geometry = shape(feature["geometry"])
        centroid = geometry.centroid
        records.append({
            "id": props["id"], "name": props["name"], "type": props["type"],
            "centroid": [round(centroid.x, 5), round(centroid.y, 5)],
            "bbox": [round(value, 5) for value in geometry.bounds],
            "nearest_cell_fallback": False, "valid_variables": [],
            "parent": "USA" if props["type"] == "state" else None,
        })
    return records


def preserve_existing_validity(regions: list[dict], output: Path, rebuilding: list[str]) -> None:
    """Keep completed variables when a later run adds more Zarr fields."""
    path = output / "regions.json"
    if not path.exists():
        return
    old = {region["id"]: region for region in json.loads(path.read_text(encoding="utf-8"))}
    if set(old) != {region["id"] for region in regions}:
        raise ValueError("Existing regions.json has different region ids; rebuild all series together")
    for region in regions:
        previous = old[region["id"]]
        region["valid_variables"] = [
            variable for variable in previous["valid_variables"]
            if variable not in rebuilding and (output / f"series_{variable}.npz").exists()
        ]
        region["nearest_cell_fallback"] = bool(previous["nearest_cell_fallback"])


def mask_weights(features: list[dict], lon: np.ndarray, lat: np.ndarray):
    """Build a sparse [cells, regions] cos(latitude) weight matrix."""
    import geopandas as gpd
    import regionmask
    from scipy.sparse import csc_matrix
    from shapely.geometry import shape

    lon = ((np.asarray(lon, dtype=float) + 180) % 360) - 180
    lat = np.asarray(lat, dtype=float)
    xx, yy = np.meshgrid(lon, lat)
    cosine = np.maximum(np.cos(np.deg2rad(yy)).ravel(), 0)
    masks: dict[str, np.ndarray] = {}
    for region_type in ("country", "state"):
        selected = [f for f in features if f["properties"]["type"] == region_type]
        if not selected:
            continue
        frame = gpd.GeoDataFrame(
            {"id": [f["properties"]["id"] for f in selected],
             "name": [f["properties"]["name"] for f in selected]},
            geometry=[shape(f["geometry"]) for f in selected], crs="EPSG:4326",
        )
        cube = regionmask.from_geopandas(frame, names="name", abbrevs="id", overlap=False).mask_3D(lon, lat, drop=False)
        for index, feature in enumerate(selected):
            masks[feature["properties"]["id"]] = np.asarray(cube.isel(region=index)).ravel()
    land = np.logical_or.reduce([mask for region_id, mask in masks.items() if len(region_id) == 3])
    for item in NAMED + OCEANS:
        region_id = item["id"]
        if region_id == "NR-LAND":
            mask = land
        elif region_id == "NR-OCEAN":
            mask = ~land
        else:
            mask = np.zeros(xx.shape, dtype=bool)
            for west, south, east, north in item.get("boxes", [item["bbox"]]):
                mask |= (xx >= west) & (xx <= east) & (yy >= south) & (yy <= north)
            mask = mask.ravel()
            if item["land_only"]:
                mask &= land
            elif region_id.startswith("OCN-"):
                mask &= ~land
        masks[region_id] = mask
    rows, cols, data = [], [], []
    fallback = set()
    for column, feature in enumerate(features):
        region_id = feature["properties"]["id"]
        indices = np.flatnonzero(masks[region_id])
        if len(indices) == 0:
            point = shape(feature["geometry"]).centroid
            distance = ((xx.ravel() - point.x) * np.cos(np.deg2rad(point.y))) ** 2 + (yy.ravel() - point.y) ** 2
            if region_id in {item["id"] for item in NAMED if item["land_only"]}:
                distance = np.where(land, distance, np.inf)
            indices = np.array([int(np.argmin(distance))])
            fallback.add(region_id)
        rows.extend(indices.tolist())
        cols.extend([column] * len(indices))
        data.extend(cosine[indices].tolist())
    return csc_matrix((np.asarray(data, dtype=np.float32), (rows, cols)), shape=(len(cosine), len(features))), fallback


def build(variables: list[str], countries_zip: Path | None, states_zip: Path | None, output: Path, end_year: int | None) -> None:
    import fsspec
    import xarray as xr

    country_rows, state_rows = load_50m_sources(countries_zip, states_zip)
    features = all_region_features(country_rows, state_rows)
    regions = region_records(features)
    if len(regions) < 280:
        raise RuntimeError(f"Expected >=280 regions; got {len(regions)}")
    output.mkdir(parents=True, exist_ok=True)
    preserve_existing_validity(regions, output, variables)
    region_ids = np.asarray([region["id"] for region in regions])
    open_stores = {}
    grids = {}
    try:
        for variable in variables:
            url = CERES_URL if variable in CERES_VARS else MERRA2_URL
            if url not in open_stores:
                open_stores[url] = xr.open_zarr(fsspec.get_mapper(url), consolidated=True)
            ds = open_stores[url]
            if variable not in ds:
                raise ValueError(f"{variable} is absent from {url}")
            field = ds[variable]
            if end_year is not None:
                field = field.sel(time=slice(None, f"{end_year}-12-31"))
            months = field.time.values.astype("datetime64[M]")
            if len(months) == 0 or np.any(np.diff(months.astype(int)) != 1):
                raise ValueError(f"{variable}: expected contiguous monthly time axis")
            grid_key = (url, tuple(field.lat.values), tuple(field.lon.values))
            if grid_key not in grids:
                grids[grid_key] = mask_weights(features, field.lon.values, field.lat.values)
            weights, fallback = grids[grid_key]
            for region in regions:
                region["nearest_cell_fallback"] |= region["id"] in fallback
            chunks = []
            for start in range(0, len(months), 12):
                block = field.isel(time=slice(start, start + 12)).transpose("time", "lat", "lon").load().values
                chunks.append(weighted_means(block.reshape(block.shape[0], -1), weights))
            monthly = np.concatenate(chunks, axis=0)
            populated = np.flatnonzero(np.isfinite(monthly).any(axis=1))
            if not len(populated):
                raise ValueError(f"{variable}: no populated months; refusing to write an empty series")
            monthly = monthly[:populated[-1] + 1]
            first = str(months[0])
            np.savez_compressed(output / f"series_{variable}.npz", values=monthly.T.astype(np.float32), region_ids=region_ids, t0=first)
            for index, region in enumerate(regions):
                if variable in LAND_ONLY_VARS and (region["type"] == "ocean" or region["id"] == "NR-OCEAN"):
                    continue
                if np.isfinite(monthly[:, index]).any():
                    region["valid_variables"].append(variable)
            print(f"{variable}: {monthly.shape[0]} months, {sum(variable in r['valid_variables'] for r in regions)} regions")
    finally:
        for ds in open_stores.values():
            ds.close()
    (output / "regions.json").write_text(json.dumps(regions, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(regions)} regions to {output / 'regions.json'}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--vars", nargs="*", default=[])
    parser.add_argument("--geometry-only", action="store_true")
    parser.add_argument("--countries-zip", type=Path)
    parser.add_argument("--states-zip", type=Path)
    parser.add_argument("--out", type=Path, default=DATA_DIR)
    parser.add_argument("--end-year", type=int)
    args = parser.parse_args()
    if not args.vars and not args.geometry_only:
        parser.error("give --vars or --geometry-only")
    build(args.vars, args.countries_zip, args.states_zip, args.out, args.end_year)


if __name__ == "__main__":
    main()
