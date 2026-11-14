# PROJECT: Earth Case Files (working name)

## In one line

A guided data-detective web app. You choose *what*, *where* and *when* on a 3D globe, and get a statistically rigorous verdict on whether it is trending, explained in plain language by a Claude partner.

## The challenge

NASA Space Apps 2026, *Be An Earth System Trend Detective!* The app must let users:
1. choose variable(s);
2. choose a region (it can be the whole world);
3. choose a period;
4. create and examine the time series;
5. test the trend for significance.

**Audience:** high-school and college students, plus members of the public with some science background. The full brief and NASA's example (Wisconsin AOD, MODIS Aqua, summers since 2002) are in `docs/context/`.

## Direction: hybrid A+B+C

- **Case Files** (the backbone). Lead (variable) → Scene (region) → Timeline (period + season) → Evidence (charts) → Verdict. Claude acts as the partner detective: it asks what you are curious about, suggests leads and explains verdicts at two reading levels.
- **Mirror Earth.** A global trend map, plus a mirror finder that shows regions where the same variable trends the opposite way and explains the shared cause.
- **Signal Scanner.** A "years until significant" meter. A full scan of every variable for one region is a stretch goal.

## Judging map (each criterion scored 1–5)

| Criterion | What earns it | Owner |
|---|---|---|
| Relevance | Follows the challenge's 5 steps exactly; NASA's own example rebuilt as Case #1; plain definitions; watchable demo cases | Lead, Story |
| Validity | Verdicts tested on yearly values; Hamed-Rao Mann-Kendall + Sen's slope next to OLS with an autocorrelation-corrected CI; area-weighted means; data source on every chart; false-positive simulation; Claude's numbers checked automatically | Methods, Coder B |
| Creativity | Mirror finder; years-until-significant; predict-before-reveal; detective framing | Coder C, Lead |
| Impact | Students learn *why* a trend is or isn't significant; share links; Student/Scientist reading levels | Coder C, Story |
| Presentation | Polished non-template UI; a tight 3-case demo with instant explanations; launch video | Lead, Story |

## Scope

**Must** (end to end on production by H14):
- **Globe.** Countries when zoomed out, US states when zoomed in, plus ocean basins and about 15 named regions. Select by click or by search, up to 4 regions at once. The trend map is coloured by the current case.
- **Left panel.** The 5-step flow, a period slider and a season filter (Annual / DJF / MAM / JJA / SON / custom).
- **Chart.** Raw monthly values and anomalies, the yearly series, an OLS line with its CI band, a Sen's slope line, and an overlay when several regions are selected.
- **Statistics engine and verdicts** as defined in `docs/science/METHODS.md`, plus a template verdict that works without Claude.
- **Claude Explain,** streamed, with a Student/Scientist toggle. The demo cases use pre-generated explanations.
- **Variables.** The Lead catalogue is discovered from NASA POWER's monthly parameter metadata; region and period availability is checked by POWER when a case is calculated.
- **Demo.** 3 demo cases, each with a "Watch this case" tour.
- **Deployment** on Vercel.

**Should** (H14–H22):
- Correlation view: anomalies, detrended values, lag ±6 months, and a "both rising ≠ connected" warning.
- Years-until-significant meter.
- Mirror finder.
- Partner chat with tools, including `propose_case`.
- Share link.
- Predict-before-reveal.

**Could:** Signal Scanner (with BH-FDR correction); Pettitt change point; a live custom area via the POWER REST API; PNG/PDF case report.

**Won't:** accounts, a database, mobile-first layout.

**Cut order if behind:** scanner → mirror finder → partner tools (keep Explain) → correlation lag search.

## Personalization (decided at the H0–H1 huddle; record results in the Decisions log)

- **Name and partner persona.** The Story lead proposes 3 names; the team votes at H2.
- **A local "home" case** using admin-1 regions of your own country (about 10 min in the pipeline).
- **A signature moment.** Pick from: predict-before-reveal, a time-machine scrubber that animates the trend map across years, sonification of the series, or classroom challenge codes.

## Glossary

Use these words in code, UI and docs.

| Term | Meaning |
|---|---|
| Case | One investigation: variable + region(s) + period + season + reading level. It lives in the URL. |
| Lead | The variable under investigation. |
| Scene | The region(s) under investigation. |
| Timeline | The period plus the season filter. |
| Evidence | The charts and statistics for a case. |
| Verdict | **Confirmed** / **Not proven yet** / **No case**, with the thresholds set in `METHODS.md`. |
| Yearly series | One value per year (an annual or seasonal mean). Verdicts are tested on this series. |
| Anomaly | A monthly value minus that calendar month's average over the period. Used for display and correlation. |
| Mirror | A region of the same type whose trend is significant with the opposite sign, for the same variable, period and season. |
| Years until significant | The estimated extra years of data needed, at the current rate and noise level, before the trend would reach significance. |
| Process card | A curated, cited physical explanation. The partner may make physical claims only from these. |
| Hero series | A satellite series imported from Giovanni for a demo case (e.g. MODIS Aqua AOD over Wisconsin). |
| Golden case | A test series with independently computed expected results; the engine's answer key. |
| Explain / Partner | The two Claude modes: an automatic explanation of the verdict, and a chat with tools. |
| Freeze | H26. After it, only P0 fixes. |

## Decisions log

| When | Decision | Why |
|---|---|---|
| H0 | Hybrid A+B+C direction | Gives judges a memorable story and gives science-minded judges rigour |
| H0 | Pre-built regional library from NASA POWER's monthly Zarr, plus Giovanni hero series | The trend map and mirror need every region precomputed; the demo must not depend on live NASA services |
| H0 | `claude-opus-5-5` for all Claude calls | Team choice |
| H0 | Verdicts tested on one value per year; monthly anomalies only for display and correlation | Autocorrelation in monthly data inflates significance |
| H0 | Case state lives in the URL (nuqs); no database | Share links for free; less to build |
| H0 | 3D globe (`react-globe.gl`): countries zoomed out, states zoomed in, plus a search box | The team requires a globe; small regions need search |
| H0 | Non-coder roles: Methods & Validity lead and Story & Submission lead, working as a pair | The statistician owns validity; the story lead owns presentation and submission |
| H0.5 | Oier and Ekaitz use Codex; shared agent rules live in tool-neutral `AGENTS.md` (CLAUDE.md imports it) and `docs/process/` | Not everyone uses Claude Code |
| H0.5 | Every file has one owner (`docs/process/OWNERSHIP.md`); seams frozen at H2; self-merge own-area PRs, Eleder merges cross-area ones; integration checkpoints at H2/H8/H14/H22/H26, merging Oier → Eleder → Ekaitz | Three coders working in parallel without stepping on each other |
| H0.5 | Python engine and data under `api/_engine/` and `api/_data/` (underscore prefix) | Vercel turns every non-underscore `.py` file in `api/` into its own function |
| H3.5 | Visual direction: **Strip-Chart Recorder** (impeccable seed 3670b4b9, chosen on the decision page). Ruled chart-paper panel, enamel instrument frame, dark globe window, four pen inks = region channels, verdict as a calibration stamp. Placeholder brand until Edur's brief. | Instrument metaphor carries the mechanism (trace before verdict); light paper survives a lit-hall projector |
| 2026-11-14 | Case analysis fetches monthly observations from NASA POWER Regional when `/api/py/analyze` is called; Python computes the regional monthly series and statistics. The prebuilt Zarr/NPZ pipeline remains offline tooling, not the Case Files runtime source. The POWER Manager monthly catalogue is dynamic; its metadata may be cached in process, but observation responses are fetched for every calculation. | The product requirement is to calculate the selected variable, bbox and time period from POWER on demand. |
| H6 | A case runs on an explicit button (Lead decision): pick the parameters, press it, then the evidence, verdict and Explain appear | A clear reveal moment for the demo, no half-finished results while choosing, and Claude is only called on request |
| H6 | `main` requires the `web` and `api` CI checks (GitHub ruleset); direct docs pushes still allowed | Two PRs merged with red CI and left `main` red |
| H7 | Product name **WOMM Earth** (Eleder); visual world **Silver Orbit**: fragment.im's silver-on-black type and controls, clear liquid-glass panes, starfield, one scheme | The team picked fragment.im as the reference; replaces the Strip-Chart Recorder |

The Case panel now searches the dynamic POWER catalogue, treats POWER as the authority for regional support, and sends analysis only when Calculate is pressed. Each Calculate click triggers a fresh request, including when the case fields are unchanged.
