# DATA CATALOG

**Owner:** Methods lead (definitions, kind, caveats). Story lead edits the student wording for tone. Coder B confirms each variable exists in the POWER store and fills in its id, grid and period.

**Status values:** `candidate` (not yet confirmed) → `in store` (Coder B confirmed) → `signed off` (Methods lead approved). Only `signed off` rows ship in `api/data/variables.json`, which Claude can generate from this table.

## Variables

| Id | Name | Student definition (≤25 words) | Scientist definition | Units | Source / instrument | Kind | Grid | Period | DOI | A trend here could mean | Caveats | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| T2M | Air temperature | How warm the air is about 2 m above the ground, roughly head height. | Monthly mean 2 m air temperature | °C | NASA POWER / MERRA-2 | reanalysis | 0.5°×0.625° | 1981– | _fill_ | Warming or cooling of the near-surface climate | Reanalysis, not a direct measurement | candidate |
| T2M_MAX | Daily high temperature | _fill_ | | °C | POWER / MERRA-2 | reanalysis | | | | | | candidate |
| T2M_MIN | Daily low temperature | _fill_ | | °C | POWER / MERRA-2 | reanalysis | | | | | | candidate |
| TS | Surface (skin) temperature | _fill_ | | °C | POWER / MERRA-2 | reanalysis | | | | | | candidate |
| PRECTOTCORR | Rainfall (precipitation) | _fill_ | | mm/day | POWER / MERRA-2 (bias-corrected) | reanalysis | | | | | Model-based where there are few rain gauges | candidate |
| RH2M | Relative humidity | _fill_ | | % | POWER / MERRA-2 | reanalysis | | | | | | candidate |
| QV2M | Specific humidity | _fill_ | | g/kg | POWER / MERRA-2 | reanalysis | | | | | | candidate |
| WS10M | Wind speed | _fill_ | | m/s | POWER / MERRA-2 | reanalysis | | | | | | candidate |
| PS | Surface pressure | _fill_ | | kPa | POWER / MERRA-2 | reanalysis | | | | | | candidate |
| GWETROOT | Root-zone soil wetness | _fill_ | | 0–1 | POWER / MERRA-2 | reanalysis | | | | | Land only | candidate |
| GWETTOP | Topsoil wetness | _fill_ | | 0–1 | POWER / MERRA-2 | reanalysis | | | | | Land only | candidate |
| _snow id?_ | Snow depth | _fill_ | | cm | POWER / MERRA-2 | reanalysis | | | | | Land only; confirm the id | candidate |
| _ET id?_ | Evapotranspiration | _fill_ | | | POWER / MERRA-2 | reanalysis | | | | | Confirm the id and units | candidate |
| ALLSKY_SFC_SW_DWN | Sunlight reaching the ground | _fill_ | | kWh/m²/day | POWER / CERES SYN1deg | satellite-derived | 1°×1° | 2001– | | | | candidate |
| CLOUD_AMT | Cloud cover | _fill_ | | % | POWER / CERES SYN1deg | satellite-derived | 1°×1° | 2001– | | | | candidate |
| AOD_55? | Aerosol optical depth (POWER) | _fill_ | | unitless | POWER (confirm source) | _fill_ | | | | | Only if present in the store | candidate |
| MODIS_AQUA_AOD | Aerosol optical depth (MODIS Aqua), hero series | How hazy the air is: how much smoke, dust or pollution dims sunlight passing through it. | AOD at 550 nm, Dark Target + Deep Blue combined, MYD08_M3 | unitless | MODIS on Aqua via Giovanni | satellite | 1°×1° | 2002-07– | _fill_ | More smoke, dust or pollution in the air over time | Area-averaged over Wisconsin only (hero series) | candidate |

## Attribution list (for the About page and project page)

- NASA POWER: _citation to fill_
- MERRA-2: _citation / DOI_
- CERES SYN1deg: _citation / DOI_
- MODIS Aqua MYD08_M3 (via Giovanni): _citation / DOI_
- Natural Earth boundaries: naturalearthdata.com (public domain)
