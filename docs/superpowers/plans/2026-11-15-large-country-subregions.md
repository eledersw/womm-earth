# Large Country Subregions Implementation Plan

> **For agentic workers:** Use this plan task by task; steps use checkbox syntax.

**Goal:** Make first-level administrative areas in large countries selectable on the globe and analyzable with NASA POWER.

**Architecture:** Generate a compact Admin-1 catalog and geometry layer from pinned Natural Earth data for supported countries. The frontend reveals those polygons when zoomed in; the Python API resolves their exact geometry and masks POWER grid cells before computing the regional series.

**Tech Stack:** Next.js, React Globe, GeoJSON, Python/FastAPI, NASA POWER.

**Spec:** `docs/superpowers/specs/2026-11-15-large-country-subregions-design.md`

## Global constraints

- Preserve the four-region case limit and existing region ID contract.
- Keep country polygons selectable when zoomed out and US states selectable when zoomed in.
- Apply exact polygon masking and existing cosine-latitude area weights to subregion series.
- Include countries requiring at least 15 current POWER tiles and having usable Natural Earth Admin-1 matches; avoid duplicate US states.

## Review focus

- Multipart and antimeridian geometries do not produce invalid tiles or duplicate cell weights.
- Every generated subregion's parent ID resolves in the country catalog.
- Clicking a subregion replaces the parent country in the case selection.
- Subregion selections preserve existing max-four and duplicate prevention behavior.
- The added GeoJSON stays compact enough for the globe's zoomed-in layer.

## Tasks

### Task 1: Pin and inspect Natural Earth Admin-1 input

**Files:** `pipeline/regions_admin1.py`, `pipeline/requirements.txt`, `tests/test_admin1_regions.py`.

- [ ] Pin the official Natural Earth archive/version and record its checksum.
- [ ] Add a deterministic generator for eligible country Admin-1 features, stable IDs, parent IDs, centroids and bounds.
- [ ] Verify candidate matching for Canada, Russia, China and Brazil; exclude ambiguous/missing parent matches.
- [ ] Generate committed API region metadata and compact public GeoJSON.

### Task 2: Analyze exact subregion polygons

**Files:** `api/_models.py`, `api/_engine/power.py`, `api/_data/regions.json`, `api/_data/admin1.geojson`, `tests/test_power.py`, `tests/test_api.py`.

- [ ] Add regression coverage for an Admin-1 polygon mask, including a cell inside the bounding box but outside the polygon.
- [ ] Resolve each subregion geometry, tile its bounding box, mask grid cells by the polygon, and preserve existing weighted mean behavior.
- [ ] Verify country and US state requests retain current behavior.

### Task 3: Show selectable Admin-1 features on the globe

**Files:** `components/globe/useGeo.ts`, `components/globe/layers.ts`, `components/globe/GlobeView.tsx`, relevant globe tests.

- [ ] Add the generated Admin-1 layer to the zoomed-in globe features.
- [ ] Keep country features at the zoomed-out level and show subregions only when zoomed in.
- [ ] Replace a selected parent country with its chosen child region; retain four-region cap and duplicate prevention.
- [ ] Verify hover labels, selection pens, highlighting, and country/state interactions.

### Task 4: Regenerate contracts/docs and verify integration

**Files:** `api/openapi.json`, `lib/api-types.ts`, `docs/ARCHITECTURE.md`, `docs/DATA_CATALOG.md`.

- [ ] Document Natural Earth provenance and explain that country subregion estimates are weighted means of POWER grid cells within the administrative polygon.
- [ ] Regenerate API types if any public contract changed.
- [ ] Run focused Python and globe tests, then full required CI checks.
