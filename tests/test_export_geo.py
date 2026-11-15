from pipeline.export_geo import admin1_region_features, country_feature, simplify_geometry


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


def test_us_admin1_units_form_few_macroregions_including_alaska_and_hawaii():
    from shapely.geometry import box, mapping

    countries = [({"ADM0_A3": "USA", "NAME": "United States of America"}, mapping(box(-125, 24, -66, 50)))]
    units = [
        ({"adm0_a3": "USA", "name_en": name, "region": region}, mapping(box(index, 0, index + 1, 1)))
        for index, (name, region) in enumerate([
            ("California", "West"), ("Alaska", "West"), ("Hawaii", "West"),
            ("New York", "Northeast"), ("Texas", "South"), ("Ohio", "Midwest"),
        ])
    ]
    features = admin1_region_features(countries, units)
    assert {feature["properties"]["id"] for feature in features} == {
        "ADM1-USA-west", "ADM1-USA-alaska", "ADM1-USA-hawaii",
        "ADM1-USA-northeast", "ADM1-USA-south", "ADM1-USA-midwest",
    }
