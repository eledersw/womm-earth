# Science pitch pack for Edur

**Owner:** Sergio. **Prepared:** 2026-11-14. **Delivery:** source text for the Story lead's slides, project page and judges' Q&A. No Story-owned file is edited here.

The scientific design and evidence packet are ready to explain. Engine validity remains open. Use current-status wording until Oier's fixes and the rerun actually pass; do not turn a design statement into a claim of working production behavior.

## Validity slide 1 — One comparable value per year

**On slide:** “A summer is one observation, not several independent votes.” Select the variable, region, interval and season; construct yearly annual/seasonal means; retain missing-data and boundary-season rules.

**Say:** “We test yearly values so repeating seasons are not counted as independent evidence. That reduces a major source of overconfidence, but neighboring years can still be related.”

**Show:** The selected Case's yearly chart and actual valid-year count. Wisconsin DJF uses January's year and excludes the incomplete boundary winter. Monthly anomalies remain useful for display and correlation.

**Limit:** Do not claim yearly aggregation eliminates autocorrelation or that the minimum length guarantees enough power. Use the actual chart sampling/provenance, including bounding-box or point fallback.

## Validity slide 2 — Two views of the same evidence

**On slide:** “Direction, uncertainty, and an explicit decision rule.” Sen's slope summarizes change. The design combines capped Hamed–Rao Mann–Kendall with AR(1)-adjusted OLS, using the less decisive p-value when both are usable.

**Say:** “The tests ask related questions using the same data. Agreement is a consistency check, not an independent replication, and statistical detection does not establish a cause.”

**Show:** A reviewed result with both labelled p-values, correctly scaled intervals and any disagreement/unavailable-test notice.

**Current-status qualifier:** The task-8 audit found the engine still follows MK alone and uses different uncertainty conventions. Say “our specified method” until the alignment rerun passes.

## Validity slide 3 — We checked the checks

**On slide:** “Reference arithmetic is testable; calibration still has limits.”

**Preferred evidence table:** Stored independent Gaussian AR(1) simulation, n = 24, 10,000 repetitions per setting; nominal threshold 5%. Combined capped-HR/adjusted-OLS rejection rates with no true trend:

| True dependence φ | False-positive rate in this experiment |
|---|---:|
| 0.0 | 2.83% |
| 0.3 | 7.39% |
| 0.6 | 12.12% |

**Say:** “Requiring both tests helps in these experiments, but persistent noise still produces too many detections. We disclose this limitation instead of promising that every result has a five-percent error risk.”

**Source:** tests/fixtures/golden/sim_results.json, part1_null; FALSE_POSITIVE_SIM.md. These are reference-method simulations, not proof that the current deployed engine implements the method or that real-world errors follow these exact rates.

**Existing figure:** figures/fpr.png and figures/fpr.csv may be used with an explicit legacy caption: “Naive MK versus the runtime's uncapped HR implementation in two different seeded experiments; this is not the combined capped-method comparison.” The white-noise row uses n = 30 and the persistent row n = 40, each with 1,000 trials. The CSV rates are 5.1% versus 9.7%, and 31.2% versus 24.6%, respectively. Do not label that image as validation of the capped combined method or mix its sample lengths with the table above. Oier owns its generator; request a correctly labelled replacement if Edur needs the combined-method graphic.

## Additional-years explanation for a slide or live question

**On slide:** “A conditional estimate, not a confirmation date.”

**Say:** “The calculation asks when an assumed unchanged slope and noise would meet an approximate single-test threshold. It is shown only for eligible Not proven yet results. It cannot promise that the combined verdict will become significant.”

A returned zero can be valid; an unavailable value is not zero or proof that a trend cannot exist. Never pitch even-odds power for the combined rule. Do not display a No case estimate just because an old API response contains one.

## Project-page science copy — safe at current status

“WOMM Earth helps users separate an estimated trend, its statistical evidence and possible physical explanations. NASA POWER supplies regional monthly data; our scientific design builds yearly annual or seasonal values, estimates change with Sen's slope and specifies two trend tests with approximate dependence corrections. We independently reproduce a nine-case reference key and compare the implementation with it. The current review identifies uncertainty and verdict discrepancies that must be resolved before scientific sign-off. The partner is constrained to returned numerical evidence and applicable cited process cards, with manual factual evaluation planned alongside numeric checks.”

“Regional bounding boxes can hide local differences. Reanalysis and satellite/model products retain uncertainty, statistical detection does not identify a cause, and selected examples are not a worldwide prevalence estimate. Map/scanner multiplicity and conditional detection-time claims are explicit review requirements, rather than promises that every apparent pattern is real.”

## Project-page replacement after the validity gate passes

Only after recording the passing revision and evidence, replace the implementation-status sentence above with: “The reviewed deployment agrees with the independent reference checks and our live-series comparisons within the documented tolerances.” Retain the calibration, spatial, attribution and selection limitations.

Do not claim complete test coverage, causal validation, a universal error rate, an accuracy score not yet measured, or a real-data map/mirror/scanner before those features actually pass. Add a real partner score only after the separate twenty-question run and Sergio's scoring.

## Science Q&A — source answers for Edur's table

| Judge question | Answer source | Show |
|---|---|---|
| Why should we trust the numbers? | We make the statistical conventions explicit and compare against independent expected results. The current audit found discrepancies; scientific approval waits for their resolution rather than ordinary tests alone. | METHODS.md and review/README.md |
| Why test yearly values? | Annual or selected-season means avoid treating repeated months as independent trend evidence. Dependence between years still needs correction and calibration checks. | Yearly chart and valid n |
| Why two tests? | Rank-based MK and adjusted linear fitting provide two views of the same observations. The specified maximum-p rule requires both available tests to meet the nominal threshold; they are not independent replication. | Both component p-values |
| Does Confirmed mean we know the cause? | No. It is the nominal trend decision under the selected dataset and assumptions; physical explanations remain conditional unless separate attribution evidence exists. | Verdict and applicable card |
| Does No case mean nothing changes? | No. This analysis did not detect the required trend evidence; smaller effects, noise, nonlinear behavior and other intervals can remain relevant. | No case example with slope/CI |
| With many regions, will some results occur by chance? | The specified map/scanner workflow applies BH over a defined full family before selecting results. BH addresses multiplicity under assumptions and does not fix miscalibrated component tests; the live map is not yet validated. | Method family definition; verified map only after repair |
| Is reanalysis just a model? | It combines observations with a model to estimate gridded conditions. Its coverage is useful, but model, observing-system and regional-sampling uncertainty still matter. | Actual source/provenance |
| How do you control AI errors? | Numbers must come from matching results and physical mechanisms from applicable cited cards. Numeric checks are supplemented by manual review of context, units, causality and reading level; no accuracy score is claimed yet. | EVAL.md and captured answer |
| Do opposite trends prove the same mechanism? | No. A qualified mirror supplies a comparison under matching settings and the defined selection rule, not a causal explanation. Each mechanism still needs relevant evidence. | Qualified, implemented mirror only |
| Can the slope predict a future temperature? | A fitted historical rate is not a validated forecast. Extending it assumes behavior that the trend test has not established. | Historical interval and limits |
| What does an additional-years estimate mean? | It is a conditional single-test threshold approximation under unchanged slope/noise. It is neither a deadline nor calibrated combined-rule detection power. | Eligible estimate and assumptions |
| Did outsiders test the product? | The team reports its own user testing and chose to omit the planned outsider session. We do not present that as independent usability evidence or as statistical validation. | Team decision in WORK_PLAN.md |

## NASA data and attribution copy

“The selected cases use NASA POWER: MERRA-2-derived meteorological/land variables and CERES SYN1deg-derived aerosol information. POWER AOD_55 is satellite-constrained and model-assisted; it is not the optional Aqua-only Giovanni import.”

Reuse DATA_CATALOG.md's verified parameter definitions, units and attribution list. Do not copy the old project-page placeholder that assumes a MODIS Aqua import occurred. Snow depth, snowfall and snow water equivalent differ; soil wetness is not groundwater; AOD is not surface PM2.5; EVPTRNS is reported in energy units until a justified conversion is available.

## Delivery and remaining work

Edur owns slide assembly, PROJECT_PAGE.md, JUDGES_QA.md and final pitch tone. The science source is delivered here and in LIMITATIONS.md; EVAL.md supplies the twenty-question rubric. Ekaitz owns the existing eval runner and answer capture. Actual live evaluation, demo-explanation approval, user-independent findings and a passing engine checkpoint are not claimed by this source handoff.
