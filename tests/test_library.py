import json
from pathlib import Path

import numpy as np

from pipeline.named_regions import NAMED, OCEANS
from pipeline.build_library import mask_weights, preserve_existing_validity, weighted_means


ROOT = Path(__file__).resolve().parents[1]


def test_named_region_ids_and_bounds():
    ids = {region["id"] for region in NAMED + OCEANS}
    assert {"NR-GLOBE", "NR-LAND", "NR-OCEAN", "NR-SAHEL", "OCN-NATL", "OCN-ARC"} <= ids
    assert len(ids) == len(NAMED + OCEANS)
    assert next(region for region in NAMED if region["id"] == "NR-SAHEL")["bbox"] == (-18, 10, 38, 20)


def test_weighted_means_ignore_missing_cells_and_fill_values():
    values = np.array([[10, -999, 30], [np.nan, np.nan, 20]], dtype=np.float32)
    weights = np.array([[1, 0], [1, 1], [0, 1]], dtype=np.float32)
    result = weighted_means(values, weights)
    np.testing.assert_allclose(result, [[10, 30], [np.nan, 20]], equal_nan=True)


def test_mask_weights_keeps_regions_with_no_cell_centres():
    from shapely.geometry import box, mapping

    def feature(region_id, kind, bounds):
        return {"type": "Feature", "properties": {"id": region_id, "name": region_id, "type": kind}, "geometry": mapping(box(*bounds))}

    features = [feature("AAA", "country", (40, 40, 41, 41)), feature("BBB", "country", (-2, -2, 2, 2))]
    features += [feature(item["id"], "ocean" if item["id"].startswith("OCN-") else "named", item["bbox"]) for item in NAMED + OCEANS]
    weights, fallback = mask_weights(features, np.array([-10, 0, 10]), np.array([-10, 0, 10]))
    assert weights.shape == (9, len(features))
    assert "AAA" in fallback
    assert weights[:, 0].count_nonzero() == 1
    assert "BBB" not in fallback


def test_incremental_run_preserves_existing_variable_validity(tmp_path):
    (tmp_path / "regions.json").write_text(json.dumps([{
        "id": "ESP", "valid_variables": ["T2M", "GWETROOT"], "nearest_cell_fallback": True,
    }]))
    (tmp_path / "series_T2M.npz").write_bytes(b"present")
    regions = [{"id": "ESP", "valid_variables": [], "nearest_cell_fallback": False}]
    preserve_existing_validity(regions, tmp_path, ["GWETROOT"])
    assert regions[0]["valid_variables"] == ["T2M"]
    assert regions[0]["nearest_cell_fallback"] is True


def test_region_ids_consistent():
    regions_path = ROOT / "api/_data/regions.json"
    if not regions_path.exists():
        return
    regions = json.loads(regions_path.read_text())
    ids = {region["id"] for region in regions}
    assert len(ids) == len(regions) and len(regions) >= 280
    assert {"US-WI", "NR-SAHEL", "ESP"} <= ids
    for path in (ROOT / "api/_data").glob("series_*.npz"):
        with np.load(path) as series:
            assert set(series["region_ids"].tolist()) == ids
            assert series["values"].shape[0] == len(regions)
    for path in (ROOT / "public/geo").glob("*.geojson"):
        features = json.loads(path.read_text())["features"]
        assert {feature["properties"]["id"] for feature in features} <= ids
