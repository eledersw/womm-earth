# Golden cases: the engine's answer key

**Current delivery (2026-11-14):** the answer key already exists as nine cases in `tests/fixtures/golden/`, with `golden_expected.json` and independent generation scripts. Do not recreate it using the historical six-folder plan below. All nine stored cases reproduced in the Methods verification; six numerical cases were additionally cross-checked with scipy, pymannkendall 1.4.3 and statsmodels. See `verification.json` and `verify_existing.py` in this folder.

**Methods authoring/delivery is complete. Engine acceptance is not.** The unmodified pytest golden harness still skips the flat delivery (one skipped test confirmed). A separate read-only comparison found only the too-short case matched all checked yearly-engine fields: six numerical cases have uncertainty differences, including one verdict difference. Oier owns integrating the existing key and correcting the engine; these are the engine-review gate, not a request for Sergio to generate another fixture set.

The original step-change/Pettitt fixture is deferred with that optional feature. The manually imported Aqua-only fixture is omitted with the separate hero import; real POWER series and independently computed results are now retained under `docs/science/demo/`. POWER AOD is not the Aqua-only dataset. This scope change follows the user's instruction to omit unnecessary work; it does not waive engine validation.

Reproduce without changing any source fixtures:

```powershell
docs/science/.venv-validation/Scripts/python.exe docs/science/golden_cases/verify_existing.py
```

The environment is ignored by Git. Required libraries and actual versions are recorded in `verification.json`. Running the source generators is not necessary and would rewrite Oier's fixtures.

## Historical starter plan (superseded by the nine-case delivery)

**Owner:** Methods lead (creates the cases and computes the expected values). **User:** Oier (copies them to `tests/fixtures/golden/` and asserts against them).
**Due:** H5. Cases 1–3 matter most; get those done first.

Each case lives in its own folder:

```
gc1-linear-white/
  series.csv       date,value   (monthly YYYY-MM, or yearly YYYY)
  expected.json    results computed independently of our engine
  recipe.md        how the series was generated (seed, parameters) and how expected.json was computed
```

## `expected.json` fields

Include the fields that apply to the case.

```json
{
  "series_used": "yearly | seasonal:JJA | monthly",
  "yearly_values": [/* optional: the yearly series our engine should build */],
  "ols":          {"slope": 0.0, "se_ar1": 0.0, "p": 0.0, "ci": [0.0, 0.0], "r2": 0.0, "n_eff": 0.0},
  "mk_naive":     {"p": 0.0, "tau": 0.0, "z": 0.0},
  "mk_hamed_rao": {"p": 0.0, "z": 0.0},
  "sen":          {"slope": 0.0, "ci": [0.0, 0.0]},
  "phi": 0.0,
  "verdict": "Confirmed | Not proven yet | No case | Too short to judge",
  "years_needed": null,
  "tolerance": {"slope": 1e-6, "p": 1e-3}
}
```

## The six cases

| # | Folder | What it is | Why it exists |
|---|---|---|---|
| 1 | `gc1-linear-white` | 30 yearly values: y = 0.05·t + N(0, 0.3), seed 1 | The slope is recovered within the CI; verdict Confirmed |
| 2 | `gc2-pure-noise` | 30 yearly values: N(0, 1), seed 2 | No trend; verdict No case |
| 3 | `gc3-ar1-noise` | 40 yearly values of AR(1) with φ=0.6 and no trend, chosen (or seeded) so that **naive MK gives p < 0.05** while Hamed-Rao gives p > 0.05 | Proves the autocorrelation correction matters. This is also a slide. |
| 4 | `gc4-step` | 30 yearly values: 0 for t<15, 1 for t≥15, plus N(0, 0.3) | Change point (Pettitt) near year 15; shows a trend test also reacts to a step |
| 5 | `gc5-djf-wrap` | Monthly 2000-01 … 2005-12 with value = the month number (1…12) | DJF yearly values are easy to compute by hand. Checks the §4 convention and edge trimming. |
| 6 | `gc6-wisconsin-aod-jja` | The Giovanni hero CSV (MODIS Aqua AOD, Wisconsin), JJA | A real-data check against your own independent calculation (and Giovanni's, where it has one) |

## How to compute the expected values (pick one and say which in `recipe.md`)

- **Excel/Sheets:** `LINEST` for OLS. MK and Sen's slope by formula (Claude can write the formulas).
- **R:** `lm`, `trend::mk.test`, `modifiedmk::mmkh` (Hamed-Rao), `trend::sens.slope`.
- **Colab:** `pymannkendall` (`original_test`, `hamed_rao_modification_test`, `sens_slope`) plus `scipy.stats.linregress`.
  - *Ask Claude:* "Write a Colab notebook that generates golden case N exactly as in this table and writes series.csv and expected.json."

Use an independent tool (anything other than our engine's code) so the check is real.
