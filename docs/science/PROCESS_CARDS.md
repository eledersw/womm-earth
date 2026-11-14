# Process cards

**Owner:** Sergio, Methods & Validity lead. **Reviewed:** 2026-11-14. **Status:** ten source-backed cards ready for Ekaitz to convert; not yet installed in the partner.

These cards authorize conditional physical explanations, not attribution of an individual case. A trend test detects a statistical pattern; it does not identify its cause. Read the actual variable, region, period, season and tool results before choosing a card. Never imply that a citation independently reproduces our POWER bounding-box series. Case-specific numbers and verdicts must come from tools.

The lists below give explicit initial applicability for reviewed demo candidates; they do not assert a trend in each region. Additional regions require reviewing the conditions. If no card supports a physical explanation, say the cause is not covered by the available evidence.

### Demo coverage and handoff

| Case in DEMO_CASES.md | Primary card | Optional supporting cards |
|---|---|---|
| FINAL co-temperature: T2M, US-CO, Annual | regional-warming | natural-variability; reanalysis-and-regional-means |
| FINAL az-wetness: GWETROOT, US-AZ, Annual | southwest-soil-moisture | evaporative-demand; natural-variability; reanalysis-and-regional-means |
| FINAL wi-snow: SNODP, US-WI, DJF | snow-depth-and-season | snow-albedo, conditionally; natural-variability; reanalysis-and-regional-means |
| BACKUP wi-aod: AOD_55, US-WI, JJA | smoke-aod | aerosol-mixtures |
| BACKUP wi-precipitation: PRECTOTCORR, US-WI, Annual | precipitation-variability | natural-variability; reanalysis-and-regional-means |

Ekaitz: convert each card into the existing id, title, student, scientist, citations and applies_to fields in lib/partner/process-cards.json. Use the exact variable and region IDs below. Preserve limitations inside both reading-level strings: get_process_card does not itself enforce applicability, and the existing shape has no separate conditions field. Keep source titles and URLs. No schema or seam change is requested. Check coverage of these five cases after conversion. This authoring sign-off does not approve generated explanations or pass the engine validity checkpoint. No mirror pair is currently a FINAL selection; an opposite slope alone does not establish a shared mechanism.

## regional-warming: Regional warming and the greenhouse effect

- Applies to (variables): T2M
- Applies to (regions): US-CO, US-AZ, US-WI
- Use when: explaining air temperature; Colorado-specific research supplies context only for Colorado.

**Student version:**

Greenhouse gases slow the escape of heat from Earth, raising the background temperature on which local weather unfolds. Colorado's climate assessment documents warming and connects it to human-caused global warming using evidence beyond this app. Local winds, elevation and year-to-year weather still shape a regional record. A rising air-temperature series can therefore fit that wider picture without revealing how much each influence contributed. Our trend test measures change in the selected dataset; it does not perform that attribution. Check the chosen season and period before comparing results, and remember that a regional average can hide differences between mountains, valleys and towns.

**Scientist version:**

Increasing greenhouse-gas concentrations alter Earth's radiative energy balance, providing a well-established background forcing for regional warming. The Colorado assessment reports observed warming and interprets it within externally established anthropogenic climate change. That assessment is contextual evidence, not validation of our particular POWER series, spatial support or fitted slope. Regional air temperature also responds to circulation, topography and land-surface conditions, with internal variability affecting finite-period estimates. T2M represents near-surface air temperature rather than surface skin temperature. A significant trend in this app is detection within the selected product and interval; quantitative causal attribution requires additional observations, model experiments and an explicit attribution framework.

**Citations:**

- [Colorado Climate Center (2024), Climate Change in Colorado, executive summary](https://climatechange.colostate.edu/chapters/exec_summ.html)
- [IPCC (2021), AR6 WGI Chapter 7: Earth’s Energy Budget](https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/)

**Common misconception to avoid:** A small trend-test p-value measures the probability that greenhouse gases caused this regional slope.

## southwest-soil-moisture: Southwestern soil water reflects supply and loss

- Applies to (variables): GWETROOT, GWETTOP
- Applies to (regions): US-AZ, US-NV, US-CO
- Use when: discussing southwestern soil wetness; distinguish root-zone and surface layers.

**Student version:**

Soil gets wetter when rain or melting snow supplies water, and drier when water drains away, evaporates or passes through plants. In the southwestern United States, drought research shows that unusually warm conditions can worsen dryness alongside low precipitation. That makes both water supply and water loss useful clues for an Arizona soil-wetness case. It does not prove which process caused the app's particular trend. POWER reports a model soil-wetness index, not a measurement of groundwater or a percentage of soil volume filled with water. Compare precipitation and temperature as supporting evidence, while checking the season, soil layer and dataset limitations.

**Scientist version:**

Soil moisture integrates precipitation and snowmelt inputs with drainage, runoff, evaporation and plant water uptake. Southwestern drought research identifies contributions from precipitation deficits and warming-related drying, providing regional context rather than attribution of this fitted series. GWETROOT and GWETTOP are dimensionless MERRA-2 wetness indices for different modeled soil layers; their trends must not be interpreted as groundwater depletion, volumetric water content or a direct irrigation diagnosis. Atmospheric demand and available soil water can constrain evapotranspiration differently. Evaluate candidate mechanisms using corresponding hydroclimatic variables and appropriate time scales, recognizing that a bounding-box mean may combine contrasting elevations, vegetation and water-management regimes.

**Citations:**

- [NASA, The Water Cycle](https://science.nasa.gov/earth/earth-observatory/the-water-cycle/)
- [Williams et al. (2022), Rapid intensification of the emerging southwestern North American megadrought](https://doi.org/10.1038/s41558-022-01290-z)

**Common misconception to avoid:** A declining root-zone wetness index directly measures aquifer depletion or proves less rainfall.

## snow-depth-and-season: Snow depth depends on accumulation and melt

- Applies to (variables): SNODP
- Applies to (regions): US-WI, US-CO
- Use when: interpreting snow depth in a snow-relevant season; the FINAL Wisconsin case uses DJF.

**Student version:**

Snow depth is the thickness of snow lying on the ground. Snowfall adds to it, while melting, settling and compaction can reduce it. Temperature also affects whether precipitation arrives as rain or snow. These processes mean a shallower winter snowpack need not mean less precipitation or fewer snowfall events. Great Lakes research links snow-depth variation to temperature and precipitation, but does not establish the cause of our selected Wisconsin trend. Compare like seasons and check the winter labels: December belongs with the following January and February. Depth also differs from snow water equivalent, which describes the water stored in the snow.

**Scientist version:**

Snow depth is a state variable affected by solid precipitation, melt, sublimation, compaction and redistribution. Temperature influences precipitation phase and melt conditions, while accumulation can offset losses. Great Lakes basin research documents spatially variable relationships among snow depth, temperature and precipitation; its stations, interval and aggregation do not reproduce our POWER regional estimate. Depth cannot substitute for snowfall totals, snow-cover duration or snow water equivalent, because density and coverage can vary independently. Interpret SNODP within the selected season and product. Our DJF convention assigns December to the following winter, and an incomplete first winter is excluded rather than treated as a complete season.

**Citations:**

- [Suriano, Robinson and Leathers (2019), Changing snow depth in the Great Lakes basin, NOAA manuscript record](https://repository.library.noaa.gov/view/noaa/57950)
- [US EPA (2021), Snowpack indicator technical documentation](https://www.epa.gov/sites/default/files/2021-04/documents/snowpack_td.pdf)

**Common misconception to avoid:** Snow depth, snowfall, snow-covered area and snow water equivalent are interchangeable measures.

## smoke-aod: Smoke is one possible contributor to aerosol optical depth

- Applies to (variables): AOD_55
- Applies to (regions): US-WI
- Use when: explaining column aerosol optical depth, including the JJA backup; smoke attribution needs additional evidence.

**Student version:**

Aerosol optical depth describes how strongly particles through an atmospheric column block and scatter light. Wildfire smoke can raise it, and transported smoke can affect places far from a fire. Research shows that wildfire smoke has affected progress in United States surface air quality, but that is a different measurement from this app's column aerosol record. Other particles also contribute, so a hazier summer cannot automatically be called a wildfire effect. Our POWER series combines satellite information with modeling; it is not an Aqua-only observation. The backup case's verdict must come from its tool result, without turning isolated smoky years into a claimed long-term trend.

**Scientist version:**

AOD_55 is column-integrated aerosol extinction at the product's reference wavelength. Smoke transport can influence regional AOD, but the optical signal is not specific to wildfire emissions and is not equivalent to surface particulate concentration or personal exposure. United States wildfire research concerns smoke contributions to surface air-quality trends; transferring its attribution to our Wisconsin AOD series would require independent transport, composition and vertical-distribution evidence. POWER derives this variable from CERES SYN1deg aerosol information incorporating satellite retrievals and modeling. Describe smoke as a possible process, preserve the selected season and interval, and use the returned trend verdict rather than inferring a trend from memorable events.

**Citations:**

- [NASA POWER, Clouds and aerosols data sources](https://power.larc.nasa.gov/docs/methodology/data/sources_clds_aerosols/)
- [Burke et al. (2023), The contribution of wildfire to PM2.5 trends in the USA](https://doi.org/10.1038/s41586-023-06522-6)

**Common misconception to avoid:** AOD directly measures smoke at breathing height, and a smoky event proves a long-term increase.

## precipitation-variability: Rainfall responds to moisture and circulation

- Applies to (variables): PRECTOTCORR
- Applies to (regions): US-WI, US-NV, US-AZ, US-CO
- Use when: explaining regional precipitation; global moisture changes do not automatically predict local rainfall.

**Student version:**

Rain and snow depend on both available moisture and weather systems that lift and move air. A warmer atmosphere can contain more water vapor, but winds and storm paths help determine where precipitation actually falls. A region can therefore have wet and dry years around a weak long-term trend, and different seasons can behave differently. The app's precipitation variable is a mean daily rate over the selected months, not an annual water total. A No case verdict means the selected analysis did not detect the required trend evidence. It does not show that rainfall never changes, that extremes are unchanged, or that natural variability is the only cause.

**Scientist version:**

Regional precipitation reflects moisture availability, convergence, circulation and storm occurrence. Thermodynamic moistening does not imply a uniform increase in local mean precipitation; circulation changes and internal variability can produce regional and seasonal contrasts. Annual aggregation can also conceal offsetting seasonal behavior or changes in event intensity and frequency. PRECTOTCORR is the provider's corrected precipitation rate, reported here as a seasonal or annual mean daily rate, not a period accumulation. Its product correction does not remove all uncertainty. Interpret a non-detection within the chosen record and tests; do not infer absence of hydroclimatic change, unchanged extremes or attribution to any particular forcing from that verdict.

**Citations:**

- [IPCC (2021), AR6 WGI Chapter 8: Water Cycle Changes](https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-8/)
- [NASA POWER, Meteorology data sources](https://power.larc.nasa.gov/docs/methodology/data/sources_meteorology/)

**Common misconception to avoid:** A warmer atmosphere guarantees a wetter local mean, or No case proves an unchanging rainfall regime.

## aerosol-mixtures: Different aerosol sources can move in different directions

- Applies to (variables): AOD_55
- Applies to (regions): US-WI
- Use when: explaining why total aerosol measurements cannot identify individual sources or their trends.

**Student version:**

Air contains a changing mixture of particles from sources such as combustion, dust and sea spray. The total optical effect can change differently from any one ingredient. Research across the United States finds that aerosol components and regions can have different trends, so one national story need not fit every place. Decreases in one source and increases in another could partly offset each other, but our total AOD series cannot show that this happened in Wisconsin. Its satellite and model information does not provide source attribution in this analysis. Use the mixture idea to frame follow-up questions, not to invent an explanation for a flat or uncertain trend.

**Scientist version:**

Total aerosol optical depth aggregates extinction from a mixture of aerosol species and size distributions. United States research shows heterogeneous trends among components and regions, illustrating why total AOD cannot uniquely diagnose emissions from a particular source. Counteracting component changes are a possible explanation for a weak aggregate trend, but demonstrating cancellation requires component-resolved evidence on a compatible spatial and temporal basis. The POWER SYN1deg-derived series used here is not a source-apportionment result. Do not infer specific sulfate, dust or smoke contributions, emission-control effects or health exposure changes from its slope alone. Treat composition and transport as follow-up hypotheses requiring additional data.

**Citations:**

- [Jin and Pryor (2020), Long-Term Trends of High Aerosol Pollution Events and Their Climatic Impacts in North America](https://doi.org/10.1029/2019JD031137)
- [NASA POWER, Clouds and aerosols data sources](https://power.larc.nasa.gov/docs/methodology/data/sources_clds_aerosols/)

**Common misconception to avoid:** A nearly flat total AOD record proves all sources stayed constant or their changes canceled.

## snow-albedo: Snow can change how much sunlight the surface absorbs

- Applies to (variables): SNODP, T2M, TS
- Applies to (regions): US-WI, US-CO
- Use when: describing a conditional feedback where snow cover and sunlight matter; SNODP alone does not establish it.

**Student version:**

Bright snow reflects much of the sunlight that reaches it. If snow retreats and exposes a darker surface, that surface can absorb more sunlight and warm, helping further snow loss. This is a feedback that can strengthen an initial change. Its importance depends on sunlight, snow cover and the surface underneath. Snow depth alone does not tell us how much bright area disappeared: a thinner snow layer can still cover the same ground. For the Wisconsin winter case, this card explains a possible process, not a measured cause. We would need snow-cover and surface-energy evidence to show that this feedback affected the selected trend.

**Scientist version:**

Snow-albedo feedback couples surface reflectivity to absorbed shortwave radiation: snow retreat can expose darker ground, increasing solar absorption and potentially reinforcing warming and melt. Its magnitude depends on insolation, fractional snow cover, vegetation masking and snow properties. A depth trend does not uniquely determine a cover or albedo trend, and the mechanism cannot be diagnosed from SNODP or temperature alone. For a DJF regional mean, seasonal illumination and spatial snow distribution are particularly relevant. Establishing a contribution would require compatible snow-cover or albedo observations and surface-energy analysis. Present the feedback conditionally, without treating a snow-depth decrease as proof that it operated.

**Citations:**

- [NASA Snow, Snow Science](https://snow.nasa.gov/science)
- [NSIDC, Why snow matters](https://nsidc.org/learn/parts-cryosphere/snow/why-snow-matters)

**Common misconception to avoid:** Less depth automatically means less snow-covered area and proves a snow-albedo feedback.

## evaporative-demand: Atmospheric demand differs from actual water loss

- Applies to (variables): GWETROOT, GWETTOP, T2M, RH2M, QV2M, EVPTRNS
- Applies to (regions): US-AZ, US-NV, US-CO, US-WI
- Use when: discussing soil-water supply and atmospheric demand; temperature or humidity alone does not measure actual evapotranspiration.

**Student version:**

Dry air can draw water from moist surfaces and plants. Scientists describe part of that demand using the difference between vapor pressure at saturation and the vapor pressure actually present. Warming can increase this gap if moisture does not keep pace. But demand and actual water loss differ: dry soil can limit the water available, and plants can reduce water loss through their leaves. A soil-wetness decline therefore needs both supply and demand clues. POWER's EVPTRNS is expressed as energy per area per day in our catalog; do not read its numbers directly as a depth of water lost.

**Scientist version:**

Vapor-pressure deficit is the difference between saturation vapor pressure at air temperature and actual vapor pressure. It characterizes atmospheric dryness, while actual evapotranspiration also depends on soil-water supply, available energy and surface or stomatal resistance. Ecosystem research shows that atmospheric demand and soil moisture can independently constrain water and carbon exchange. Increased demand therefore need not produce increased actual flux under water limitation. Neither temperature nor relative humidity alone quantifies that flux. In this POWER catalog, EVPTRNS has energy units; conversion to water depth requires confirming the represented flux components and an appropriate latent-heat conversion. Do not substitute it directly for a hydrologic accumulation.

**Citations:**

- [Novick et al. (2016), The increasing importance of atmospheric demand for ecosystem water and carbon fluxes](https://doi.org/10.1038/nclimate3114)
- [NASA POWER, Hydrology data sources and energy-flux units](https://power.larc.nasa.gov/docs/methodology/data/sources_hydrology/)

**Common misconception to avoid:** Greater demand guarantees greater actual water loss, or EVPTRNS is already measured in millimeters.

## natural-variability: Circulation can strengthen or obscure a regional trend

- Applies to (variables): T2M, PRECTOTCORR, GWETROOT, GWETTOP, SNODP
- Applies to (regions): US-CO, US-AZ, US-WI, US-NV
- Use when: explaining finite-record variation; an ENSO attribution needs evidence for the selected variable, place and season.

**Student version:**

The ocean and atmosphere move heat and moisture around, producing natural swings in regional weather. El Niño and La Niña can shift circulation and influence temperature and precipitation, but their effects vary by place, season and event. Such swings can strengthen or oppose a background trend over a chosen interval. They can also leave two regions moving differently without proving that one caused the other. A short or noisy record may make a trend harder to detect. A No case verdict does not prove a natural cause or rule out human influence. More years may clarify a pattern, but cannot guarantee future significance.

**Scientist version:**

Internal climate variability redistributes energy and alters circulation, generating regional temperature and hydroclimatic fluctuations superimposed on externally forced changes. ENSO provides one example of seasonally and geographically dependent teleconnections; it is not a universal explanation for a regional slope. Finite-period estimates depend on sampled variability and may differ across intervals or regions. Opposite trends or correlations are descriptive findings until a shared mechanism is independently supported. A non-significant trend cannot attribute the record to internal variability, exclude anthropogenic influence or establish stationarity. Extending the record can improve inference under suitable conditions, but the trend, variability and data quality may themselves change.

**Citations:**

- [IPCC (2021), AR6 WGI Chapter 3, including FAQ 3.2](https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-3/)
- [NOAA National Weather Service Boulder, ENSO and its regional impacts](https://www.weather.gov/bou/enso)

**Common misconception to avoid:** No case proves natural variability, or an opposite-trend mirror proves a causal connection.

## reanalysis-and-regional-means: A regional estimate combines observations and modeling

- Applies to (variables): T2M, T2M_MAX, T2M_MIN, TS, PRECTOTCORR, RH2M, QV2M, WS10M, PS, GWETROOT, GWETTOP, SNODP, EVPTRNS
- Applies to (regions): US-CO, US-AZ, US-WI, US-NV, NR-ARAL
- Use when: explaining MERRA-2-derived meteorology or land variables; the aerosol product has separate provenance cards.

**Student version:**

A reanalysis combines observations with a weather model to estimate conditions consistently across a grid. This helps fill gaps between measuring sites, but the result still depends on the model, its inputs and their uncertainties. The observing network can change over time, which matters when studying trends. Our regional series averages the returned grid cells inside a bounding box, with latitude weighting. It does not trace the exact state boundary or describe every town, mountain or field. A regional trend is useful evidence about that dataset and area. Comparing independent observations can help check whether its direction and size are robust.

**Scientist version:**

MERRA-2 uses a fixed modeling and data-assimilation framework to combine heterogeneous observations into gridded estimates. A consistent framework does not imply a constant observing system or eliminate structural and sampling uncertainty. NASA documents observing-system effects on reanalysis precipitation time series; their presence or magnitude in a particular local variable requires investigation. In this app, POWER regional cells are averaged with latitude weighting over a bounding box rather than an administrative polygon mask. Spatial averaging can conceal local contrasts and include areas outside the named boundary. Interpret significance conditionally on the product and sampling, and seek independent evidence before claiming a geographically exact physical change.

**Citations:**

- [NASA GMAO, MERRA-2 overview](https://gmao.gsfc.nasa.gov/gmao-products/merra-2/)
- [NASA GMAO, MERRA-2 Global Precipitation Time Series](https://gmao.gsfc.nasa.gov/science-snapshots/merra-2-global-precipitation-time-series/)

**Common misconception to avoid:** Reanalysis is a direct measurement everywhere, or a state-labeled bounding box is an exact state average.
