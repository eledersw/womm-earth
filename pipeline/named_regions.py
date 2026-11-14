"""Stable, human-readable regions in longitude/latitude degrees."""

NAMED = [
    {"id": "NR-GLOBE", "name": "Globe", "bbox": (-180, -90, 180, 90), "land_only": False},
    {"id": "NR-LAND", "name": "Land", "bbox": (-180, -90, 180, 90), "land_only": True},
    {"id": "NR-OCEAN", "name": "Ocean", "bbox": (-180, -90, 180, 90), "land_only": False},
    {"id": "NR-ARCTIC", "name": "Arctic", "bbox": (-180, 66.5, 180, 90), "land_only": False},
    {"id": "NR-SAHEL", "name": "Sahel", "bbox": (-18, 10, 38, 20), "land_only": True},
    {"id": "NR-MED", "name": "Mediterranean land", "bbox": (-10, 30, 37, 46), "land_only": True},
    {"id": "NR-ARAL", "name": "Aral Sea region land", "bbox": (55, 41, 65, 48), "land_only": True},
    {"id": "NR-AMAZON", "name": "Amazon region land", "bbox": (-75, -15, -48, 5), "land_only": True},
    {"id": "NR-CONGO", "name": "Congo region land", "bbox": (12, -8, 32, 6), "land_only": True},
    {"id": "NR-TIBET", "name": "Tibetan Plateau land", "bbox": (78, 28, 103, 38), "land_only": True},
    {"id": "NR-SIBERIA", "name": "Siberia land", "bbox": (60, 50, 140, 72), "land_only": True},
    {"id": "NR-METRO-LA", "name": "Los Angeles metro box", "bbox": (-119.1, 33.1, -117.1, 35.1), "land_only": True},
    {"id": "NR-METRO-DELHI", "name": "Delhi metro box", "bbox": (76.2, 27.6, 78.2, 29.6), "land_only": True},
    {"id": "NR-METRO-BEIJING", "name": "Beijing metro box", "bbox": (115.4, 39.0, 117.4, 41.0), "land_only": True},
]

OCEANS = [
    {"id": "OCN-NATL", "name": "North Atlantic", "bbox": (-100, 0, 20, 66.5), "land_only": False},
    {"id": "OCN-SATL", "name": "South Atlantic", "bbox": (-70, -50, 20, 0), "land_only": False},
    {"id": "OCN-NPAC", "name": "North Pacific", "bbox": (-180, 0, 180, 66.5), "boxes": [(-180, 0, -100, 66.5), (100, 0, 180, 66.5)], "land_only": False},
    {"id": "OCN-SPAC", "name": "South Pacific", "bbox": (-180, -50, 180, 0), "boxes": [(-180, -50, -70, 0), (120, -50, 180, 0)], "land_only": False},
    {"id": "OCN-IND", "name": "Indian Ocean", "bbox": (20, -50, 120, 30), "land_only": False},
    {"id": "OCN-SO", "name": "Southern Ocean", "bbox": (-180, -90, 180, -50), "land_only": False},
    {"id": "OCN-ARC", "name": "Arctic Ocean", "bbox": (-180, 66.5, 180, 90), "land_only": False},
]
