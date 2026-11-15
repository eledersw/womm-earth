# Selectable subregions for large countries

## Intent

Let users select recognizable parts of large countries directly on the globe, so a case can analyze a state, province, or first-level administrative area instead of the entire country.

## Scope and decisions

- Use Natural Earth 1:10m Admin-1 states and provinces as the source of first-level boundaries. Keep the existing US states layer and avoid adding duplicate US regions.
- Include Admin-1 regions for countries whose existing POWER tiling requires at least 15 tiles and that have usable first-level polygons: Australia, Brazil, Canada, China, Greenland, India, Norway and Russia. The United States keeps its existing state layer. Countries without usable Admin-1 features keep whole-country selection.
- Show the subregion boundaries when zoomed in. Keep whole countries selectable when zoomed out.
- Give each subregion a stable ID and a parent country ID. Selecting a subregion replaces its parent country in the active case.
- Analyze each subregion using its own bounding tiles and exact polygon mask, with the current cosine-latitude weighted monthly aggregation. Do not use the bounding rectangle as the regional mean.
- Keep the current limit of four selected regions. No changes to trend methods or NASA POWER products.

## Approaches considered

- Natural Earth Admin-1 polygons: recognizable names and boundaries; requires adding geometry and region metadata. Chosen.
- Fixed POWER tile grid: easy to derive, but arbitrary and not suitable as named geographic areas.
- Hand-built subdivisions for Russia only: smaller initial dataset, but leaves other large countries with the same problem and adds manual maintenance.

## Implementation notes

Generate the supported subregion catalog and GeoJSON from the pinned Natural Earth dataset. Extend the region index, globe layer and backend polygon mask together. Parent and subregion IDs must remain unique; exclude regions that cannot be matched unambiguously to an existing country ID. Preserve exact country selection at the zoomed-out level.

## Success criteria

- Russia, Canada, China, Brazil, Australia, India, Greenland and Norway expose named Admin-1 areas when zoomed in.
- A selected subregion appears as a single case region and its backend series only includes POWER grid cells inside that subregion polygon.
- Whole-country selection and existing US state selection still work.
- Selection, max-four handling, parent replacement, polar/multipart geometry and boundary-cell deduplication have regression coverage.

## Data source

Natural Earth, 1:10m Admin-1 States and Provinces, version 5.1.1: https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/
