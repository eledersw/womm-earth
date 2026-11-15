# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary:** high-school and college students, plus members of the public with some science background, who want to find out whether something on Earth is really changing in a place they care about.
- **Evaluators:** NASA Space Apps 2026 judges, who see the app demoed live on a **projector in a lit hall** (3–6 m away) and score Impact, Creativity, Validity, Relevance and Presentation from 1 to 5.

## Product Purpose

A guided "data detective" tool for the challenge *Be An Earth System Trend Detective!*. A user picks a variable measured or modelled by NASA, one or more regions, a period and a season. They get the time series, the rate of change, and a verdict on whether the trend is statistically significant, explained in plain language. Success means a student can answer "is this really changing here, and how sure are we?" and explain *why* the answer holds.

## Positioning

- **The case flow:** a five-step investigation (Lead → Scene → Timeline → Evidence → Verdict) instead of a chart-builder.
- **Rigorous statistics:** verdicts are tested on yearly values with an autocorrelation-aware Mann-Kendall test plus Sen's slope, next to OLS, and the app says how many more years of data would settle an unproven trend.
- **The mirror finder:** it shows where the same variable trends the opposite way.
- **The Claude partner:** it may only quote numbers our engine computed and physical explanations from curated, cited process cards.

## Operating Context

- **The 3D globe:** users select countries, US states, ocean basins or named regions (Sahel, Arctic and others) on it.
- **The left panel:** it carries the case flow.
- **Sharing:** every case lives in the URL, so it can be shared.
- **Demo:** 3 guided demo cases with a watchable tour. Case #1 rebuilds NASA's own example: MODIS Aqua aerosol optical depth over Wisconsin, summers since 2002.
- **Reading levels:** Student and Scientist.

## Capabilities and Constraints

- **Stack:** Next.js 16 (App Router), Tailwind v4 and shadcn/ui (Radix) on Vercel, with a Python FastAPI statistics engine. The globe uses `react-globe.gl`, the charts Observable Plot.
- **Data:**
  - NASA POWER monthly data (MERRA-2 reanalysis, CERES satellite-derived), averaged per region.
  - One Giovanni hero series (MODIS Aqua AOD).
  - Every chart labels its source as satellite or reanalysis/model.
- **Verdict tiers:** Confirmed / Not proven yet / No case / Too short to judge (thresholds in `docs/science/METHODS.md`).
- **Terminology:** use the glossary in `docs/PROJECT.md`.
- **Timebox:** about 30 hours, with a feature freeze at H26.
- **Undecided:** the final product name (Edur is choosing) and the partner persona.

## Brand Commitments

- Working name **Earth Case Files** (placeholder until the team votes).
- Team: WOMM.
- Tone (from the plan): curious, precise and encouraging, like a detective's notebook, not a cartoon.
- No visual identity has been committed yet.

## Evidence on Hand

- Real NASA data products: POWER (MERRA-2, CERES) and MODIS Aqua MYD08_M3 via Giovanni.
- Region geometry from Natural Earth.
- Test fixtures in `api/_fixtures/` are illustrative only and must be labelled as such.
- Absent, and not to be fabricated: testimonials, user counts, endorsements, press, and published validation of our results.

## Product Principles

1. **Evidence before verdict.** The user sees the data and the test before any conclusion.
2. **Honest uncertainty.** "Not proven yet" never reads as "no change", and every number has a source.
3. **One case at a time.** The five steps are the spine; nothing distracts from the current investigation.
4. **Legible from the back of the room.** The demo is judged on a projector.

## Accessibility & Inclusion

- Trend colours must be colourblind-safe, with a diverging ramp plus a non-colour cue for significance.
- Text contrast must survive projection in a lit hall.
- Keyboard selection has to work alongside globe clicking (region search).
- Plain-language definitions for every variable and statistical term.
