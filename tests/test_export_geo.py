from pipeline.export_geo import country_feature, simplify_geometry


def test_country_feature_keeps_only_shared_region_properties():
    source = {
        "properties": {"ADM0_A3": "ESP", "NAME": "Spain", "POP_EST": 48000000},
        "geometry": {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 0]]]},
    }

    feature = country_feature(source["properties"], source["geometry"])

    assert feature["properties"] == {"id": "ESP", "name": "Spain", "type": "country"}
    assert feature["geometry"] == source["geometry"]


def test_simplify_geometry_reduces_collinear_ring_points_and_keeps_closure():
    geometry = {
        "type": "Polygon",
        "coordinates": [[[0, 0], [0.05, 0], [0.1, 0], [0.1, 0.05], [0.1, 0.1], [0.05, 0.1], [0, 0.1], [0, 0.05], [0, 0]]],
    }

    simplified = simplify_geometry(geometry, tolerance=0.02)
    ring = simplified["coordinates"][0]

    assert len(ring) < len(geometry["coordinates"][0])
    assert ring[0] == ring[-1]
