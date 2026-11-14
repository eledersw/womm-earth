# Catalog sign-off and provider evidence

**Owner:** Sergio. **Reviewed:** 2026-11-14. **Branch:** `sergio/methods`.

The DATA_CATALOG playbook task is complete: 16 POWER variables have scientific definitions, student definitions of at most 25 words, units, source/kind, native grid, verified coverage, source-method DOI, interpretation and caveats. All 16 are marked signed off. The separate MODIS Aqua hero stays candidate because its CSV/field/quality/area selection has not been imported and verified.

This is a curated subset of the dynamic monthly Manager catalog, not approval of every parameter it contains. Sign-off approves the documented meanings and limitations, not the deployed app's current metadata or engine implementation. Edur's tone review remains a handoff rather than a claimed completed conversation.

## What was checked

`verify_power_catalog.py` uses only Python's standard library and never imports the application. It queries monthly AG metadata, then makes one regional request for each selected variable (at most three concurrent requests). The saved evidence is `power_verification.json`.

The test rectangle is west −91°, south 43°, east −89°, north 45°. It is a Wisconsin-area rectangle, not the Wisconsin administrative shape. Meteorological requests start in 1981; radiation requests start in 1984; all end in 2025. Fill values are excluded, as are YYYY13 annual summaries. The evidence stores provider metadata, returned units/header/version, coordinate samples, coverage counts and response hashes; the climate values themselves are not retained.

| Group | Variables | Finite coverage in this check | Source header |
|---|---|---|---|
| Meteorological/land | T2M, T2M_MAX, T2M_MIN, TS, PRECTOTCORR, RH2M, QV2M, WS10M, PS, GWETROOT, GWETTOP, SNODP, EVPTRNS | 1981-01 through 2025-12; 540 distinct months each | MERRA2 |
| Solar/cloud | ALLSKY_SFC_SW_DWN, CLOUD_AMT | 1984-01 through 2025-12; 504 distinct months each | SRB, SYN1DEG |
| Aerosol | AOD_55 | 2001-01 through 2025-12; 300 distinct months | SYN1DEG |

The provider API version in the saved headers is v2.10.0. Source product editions are not pinned by those headers. Coverage is not guaranteed elsewhere, and a successful provider request is not an application end-to-end test. Prefer 2001 onward for a simpler CERES-era solar/cloud demo; disclose source-transition limitations rather than attributing the whole record to one satellite edition.

Reproduce from the repository root with network access:

```powershell
python docs/science/catalog/verify_power_catalog.py --output docs/science/catalog/power_verification.json --end-year 2025
```

## Corrections relative to the starter catalog

- AG radiation and EVPTRNS energy units are MJ/m^2/day; no silent conversion to kWh/m²/day or mm/day.
- T2M_MAX and T2M_MIN are named monthly period extrema according to the Manager definition, not average daily highs/lows. Yearly/seasonal means of these monthly values are not yearly extremes.
- SNODP is the verified snow-depth code, and AOD_55 has no question mark. Soil wetness is a dimensionless model index, not groundwater depth or volumetric water percentage.
- EVPTRNS is signed off only as the provider-labelled energy variable. Its name is not permission to claim total evaporated water volume; component coverage and latent-heat assumptions must be verified before any conversion.
- Source-method paper DOIs are explicitly distinguished from product/download DOIs. MODIS Aqua has its own product DOI and is not interchangeable with POWER AOD.

## Handoff to Oier and Edur

**Update:** the team subsequently fixed the alphanumeric user parameter upstream. All five selected demo cases now succeed through the unmodified CLI (`../demo/cli_checks.json`). Item 1 below records the original reproduction and is resolved locally; metadata integration and statistical acceptance remain separate.

1. **Oier: fix the regional request user.** With valid two-degree bounds, the current app's `user=womm_earth` produces HTTP 422 with the sole message “Please supply a an alphanumeric user.” The same provider request with `user=wommearth` succeeds. `regional_request_rejection.json` records the exact failing URL and response. `api/_engine/power.py` is Oier's file and was not edited here.
2. **Oier: respect regional-size constraints.** The initial one-degree probe was also rejected because NASA requires at least a two-degree span in each coordinate. Check small/large region behaviour and communicate any sampling fallback accurately. Do not expand a bbox silently or claim exact polygon means.
3. **Oier: overlay approved metadata on the dynamic catalog by exact ID.** Preserve NASA request-community units, while adding the reviewed definitions, source, DOI semantics, land restrictions and safe reporting behaviour. The current `_variable` mapping marks all parameters unsigned, uses names as student definitions, sets land_only and ratio_scale false and defaults missing start dates to 1981. AOD's finite record starts in 2001, demonstrating why that date default is insufficient. Other parameters remain unreviewed. Do not alter the frozen contract without the required heads-up.
4. **Oier: keep the legacy exporter separate.** `scripts/catalog_to_json.py` requires local finite `.npz`/hero observations to determine end years. The live provider snapshot is not such a data library; the script was not run against or used to overwrite app data. The catalog's 13-column shape and status strings are preserved for a later compatible integration.
5. **Edur: review student wording and reuse the attribution list.** Scientific definitions are complete. Tone review is pending; preserve the distinctions between maxima and averages, rates and totals, energy and water depth, relative percent and percentage points, and column AOD and surface pollution.

These owner actions do not undo completion of the scientific catalog task. They remain prerequisites for claiming that the reviewed metadata is visible and correct on production. No app/API/engine files were changed and no engine validity sign-off was issued.

## Validation record

- All 16 provider checks returned usable monthly values and matching Manager/response units.
- All 17 catalog rows preserve exactly 13 nonempty fields; IDs are unique. All student definitions are 11–15 words. No starter placeholders remain.
- Signed-off rows match the 16 provider-verified IDs, their finite coverage and their units (°C is the display spelling of provider code C).
- The probe executed successfully; Markdown diff whitespace is checked before commit. No new application tests were added for this documentation change.
- Full app checks were attempted on this branch: `npm run check` could not start because npm is unavailable; `python -m pytest -q` could not start because pytest is not installed. Neither is a passing result. Existing upstream CI issues are not certified as fixed by this catalog work.
