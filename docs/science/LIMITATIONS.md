# Limitations: student and scientist wording

**Owner:** Sergio. **Prepared:** 2026-11-14. **Status:** scientific source ready for Edur/Ekaitz; not a deployment validity sign-off.

Use these sentences in About/How we test, the project page and the science Q&A. Preserve the distinctions when adapting tone. METHODS.md defines intended behavior; review/README.md records implementation failures. Product fixes can change implementation status but do not remove the general scientific limitations.

## Reanalysis and satellite/model provenance

**Student:** Many variables combine observations with a model; the aerosol series also uses satellite and model information, so none should be described as a direct measurement everywhere.

**Scientist:** MERRA-2-derived POWER variables are reanalysis/model estimates, and POWER AOD_55 uses CERES SYN1deg satellite-constrained, model-assisted information; observing-system, retrieval and structural uncertainty remain distinct from trend-test uncertainty.

## Regional averages and spatial support

**Student:** A regional average can hide places changing differently, and our bounding rectangle can include areas outside the named region.

**Scientist:** The runtime uses latitude-weighted POWER grid-cell means over region bounding boxes rather than administrative polygon masks, so spatial heterogeneity, resolution and boundary mixing limit local interpretation.

## Trend shape and change points

**Student:** Our trend tests look for an overall direction, so a step or a changing pattern can produce evidence without showing a steady rate.

**Scientist:** Mann–Kendall detects monotonic association and Sen/OLS summarize rates; their significance does not establish linearity, exclude structural breaks or validate extrapolation beyond the observed interval.

## Short records and natural variability

**Student:** A short or noisy record may hide change, but a longer record does not guarantee that a trend will become detectable.

**Scientist:** The minimum-length gate is an eligibility threshold rather than a power guarantee; finite-period estimates depend on sampled variability, while non-detection neither establishes stationarity nor attributes variability to natural causes.

## Dependence between years and calibration

**Student:** Neighboring years can resemble each other, and our approximate corrections can still make persistent patterns look more certain than they are.

**Scientist:** Capped Hamed–Rao and adjusted OLS are approximate corrections whose stored AR(1) experiments show inflated rejection under persistence; the combined rule is nominal, not a universally calibrated false-positive guarantee.

## Two methods and the confidence interval

**Student:** The tests use the same data, and a slope interval that excludes zero can still accompany an unconfirmed combined verdict.

**Scientist:** The decision uses the larger usable component p-value, with a disclosed MK-only fallback, while the approximate Sen interval is not obtained by inverting that combined rule and is not independent corroboration.

## Missing observations and seasons

**Student:** Missing months can change a yearly average, and incomplete boundary winters are excluded rather than filled with invented data.

**Scientist:** Annual means require at least ten months and seasonal/custom means all selected months; eligibility also requires valid-year coverage, but inference across retained missing calendar years still needs its separately reviewed policy.

## Coverage, tiling and small regions

**Student:** Available data and regional size limit what we can analyze, and a small place may use a nearby model grid cell instead.

**Scientist:** POWER regional-size limits require bounded tiling and deduplication, centroid point fallback for undersized boxes, or explicit failure for excessive extent; the returned sampling/provenance warning must govern interpretation.

## Testing many hypotheses and choosing examples

**Student:** Searching many places can produce chance findings, so a few selected demonstrations do not show how common trends are worldwide.

**Scientist:** The specified map/scanner BH families address multiplicity under dependence assumptions, not component calibration or individual truth probabilities, and screened demonstration cases are illustrative rather than a representative confirmatory sample.

## Additional years are conditional estimates

**Student:** An additional-years estimate assumes the slope and variability stay the same and does not promise a future confirmation date.

**Scientist:** The single-test signal-to-noise threshold approximation is restricted to eligible Not proven yet results and is not validated power for the combined decision rule, especially under persistent or changing noise.

## Correlation, mirrors and physical causes

**Student:** Variables moving together, or regions moving oppositely, do not establish a cause; process cards offer possible mechanisms rather than attribution of a particular trend.

**Scientist:** Raw/detrended anomaly correlations and lag searches require their own sampling and multiplicity checks, while qualified mirrors and applicable cited process cards do not replace a causal attribution framework.

## Measurement meaning and units

**Student:** Snow depth is not snowfall, soil wetness is not groundwater, AOD is not surface smoke exposure, and energy flux is not a depth of water.

**Scientist:** Interpret the exact parameter, request-community units and spatial/temporal aggregation; preserve per-year versus per-decade uncertainty scales, ratio-scale restrictions and the distinction between relative percent and percentage points.

## AI grounding and evaluation scope

**Student:** The partner should use returned numbers and cited process cards, but a number check alone cannot tell whether an explanation uses the right evidence.

**Scientist:** Numeric matching does not verify semantic attribution, source applicability, units, causal reasoning or context fidelity, so the twenty-question rubric and manual review remain necessary before any accuracy claim.

## Current implementation status

**Student:** The earlier numerical failures are repaired in local checks, but the corrected deployment and its live map still need scientific review.

**Scientist:** PR #44 resolves the checked yearly numerical failures and activates runtime map-family code locally; the separate exact-cutoff mirror issue and fresh deployment/full-family checks remain open, and neither passing tests nor team usability impressions establish calibration or production validity.

## Team usability decision

Sergio reported that the team tested the app themselves and liked its appearance, and explicitly omitted the planned outside-user session. Record that as team self-testing, not an independent participant study. The outside-user session is no longer a prerequisite for the Methods gate; numerical verification and scientific answer review remain required.

**Sources:** [METHODS.md](METHODS.md), [DATA_CATALOG.md](../DATA_CATALOG.md), [PROCESS_CARDS.md](PROCESS_CARDS.md), [VERDICT_TEMPLATES.md](VERDICT_TEMPLATES.md), [FALSE_POSITIVE_SIM.md](FALSE_POSITIVE_SIM.md) and [the task-8 evidence](review/README.md).
