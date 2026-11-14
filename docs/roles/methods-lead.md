# Playbook: Methods & Validity lead (statistician)

**Mission:** make the Validity score a 5. Every number the app shows is correct, explained correctly and defensible in front of a judge. You are the team's statistical authority:
- you write the spec the engine is built from;
- you write the answer key it is tested against;
- you decide whether it passes.

**Carries:** Validity (and half of Presentation, through the validity slides and judges' Q&A).
**Owns (all under `docs/science/` unless noted):** `METHODS.md`, `golden_cases/`, `DEMO_CASES.md`, `PROCESS_CARDS.md`, `VERDICT_TEMPLATES.md`, `EVAL.md`, `LIMITATIONS.md`, and `docs/DATA_CATALOG.md` (definitions and caveats).

**How you work:**
- Open Claude Code in the repo, run `/resume methods-lead`, then say *"help me with step N"*.
- Commit only inside `docs/science/` and `docs/DATA_CATALOG.md`; Claude can commit and push for you.
- No coding is required. Where a step needs computation, Claude writes a Colab notebook or spreadsheet formulas for you, and you check the statistics.
- End with `/handoff methods-lead`.

**Inputs you need:**

| What | From | By |
|---|---|---|
| Variable list from the Zarr spike | Coder B | H1 |
| `case_cli.py` | Coder B | H6 |
| Deployed `/analyze` | Coder B | H8 |
| False-positive simulation export | Coder B | H14 |
| Eval run session | Coder C | H22 |

**Outputs others need:**

| What | To | By |
|---|---|---|
| `METHODS.md` v1 | Coder B | **H2** |
| Hero CSVs | Coder B | H4 |
| Golden cases | Coder B | **H5** |
| `DATA_CATALOG.md` definitions | Story, Coder B | H6 |
| `DEMO_CASES.md` | Story | **H8** |
| Process cards | Coder C | H10 |
| Verdict templates + grounding rules | Coder C | H11 |
| "Validity checkpoint passed" | everyone | **H14** |
| Validity slide content | Story | H22 |

## Steps

- [ ] **H0–H0.5: set up.**
  - Create a free Earthdata Login account (urs.earthdata.nasa.gov) and open Giovanni (giovanni.gsfc.nasa.gov) to check you can sign in.
  - Skim `docs/context/` and `docs/PROJECT.md`.
  - **Done when:** both accounts work and `/resume methods-lead` ran.

- [ ] **H0.5–H2: `METHODS.md` v1, the spec Coder B implements.**
  - The file already has a section for every decision, a suggested default and its trade-off. Make each call and write it in the "Decision:" line.
  - The decisions to make:
    - minimum series length;
    - missing-data rule;
    - season construction and DJF;
    - the primary vs corroborating test, and what to show when they disagree;
    - CI level;
    - verdict tiers and cutoffs;
    - years until significant: formula and when to hide it;
    - correlation method;
    - mirror rule;
    - scanner FDR;
    - reporting units.
  - *Ask Claude:* "Walk me through each open decision in METHODS.md, with the textbook default, the risk of each option and what a judge might challenge."
  - **Done when:** every "Decision:" line is filled and you've reviewed it with Coder B for 10 min at H2.

- [ ] **H1–H4: the hero series (Giovanni).**
  - Make an area-averaged monthly time series of MODIS Aqua AOD at 550 nm (MYD08_M3, the Dark Target + Deep Blue combined product) over the Wisconsin state shape, from 2002-07 to the latest month. Download the CSV.
  - Record the product name, version and DOI in `DATA_CATALOG.md`.
  - Do the same for any candidate case that needs a satellite series (e.g. OMI NO₂ over a city).
  - **Done when:** the CSVs are in `docs/science/hero/` and Coder B is told.

- [x] **H2–H5: golden cases, the engine's answer key.**
  - Follow `golden_cases/README.md`. Build the 6 series:
    1. a linear trend with white noise;
    2. pure noise;
    3. AR(1) noise with φ=0.6;
    4. a step change;
    5. a DJF season wrap;
    6. the real Wisconsin JJA AOD.
  - Compute the expected results independently (Excel LINEST, R, or a Colab notebook Claude writes using pymannkendall/scipy), and save them as `expected.json`.
  - *Ask Claude:* "Write a Colab notebook that generates golden case 3 with seed 42 and computes OLS, naive MK, Hamed-Rao MK and Sen's slope."
  - **Done when:** all 6 folders have `series.csv` + `expected.json`, and Oier has copied them to `tests/fixtures/golden/`.

- [x] **H3–H6: `DATA_CATALOG.md`.**
  - For every variable Coder B marks `in store`, fill in:
    - the student definition (≤25 words) and the scientist definition;
    - units, source/instrument, kind (satellite vs reanalysis/model), grid, period, DOI;
    - "a trend here could mean";
    - caveats.
  - Then mark each row `signed off`. The Story lead edits the student wording for tone.
  - **Done when:** at least 12 variables are `signed off`.

- [x] **H6–H8: demo-case dry-run.**
  - Run every candidate in `DEMO_CASES.md` (plus backups) with `python scripts/case_cli.py ...`; Claude can run it for you.
  - Fill in each case's result table.
  - Check each result against published research. *Ask Claude with deep research:* "Does published research agree that <variable> over <region> has trended <up/down> since <year>? Give 1–2 citations."
  - Decide keep or swap, and pick the final 3 cases + 2 backups.
  - **Done when:** `DEMO_CASES.md` shows "FINAL" on 3 cases and the Story lead has it.

- [ ] **H8–H10: process cards.**
  - Fill in `PROCESS_CARDS.md`: 8–12 cards, each 80–120 words, in a student and a scientist version, with 1–2 citations. Start with the cards your final cases and mirror pairs need.
  - Tell Ekaitz when cards are ready; he converts them into `lib/partner/process-cards.json`. App code is his area, so don't write it yourself.
  - **Done when:** every final demo case has a card.

- [ ] **H8–H11: verdict templates and grounding rules.**
  - Fill in `VERDICT_TEMPLATES.md`: the wording for each tier × reading level with placeholders, the misconceptions to avoid, and the partner grounding rules for Claude's system prompt.
  - Review the statistical tooltips in `docs/pitch/COPY.md` with the Story lead.
  - **Done when:** Coder C has the templates and rules.

- [ ] **H11–H14: engine review gate.**
  - Run the golden cases against the deployed engine (`case_cli.py` or `/analyze`) and compare each result with your `expected.json`.
  - Spot-check 10 regions on the trend map for plausible sign and size (e.g. the Arctic warming far faster than the global land average).
  - At H13, watch the user test for statistical misreadings and adjust the templates.
  - Log any problem as a blocker in STATUS, with an owner.
  - **Done when:** you tick "Validity checkpoint passed" in STATUS. This is your sign-off; don't give it until the numbers match.

- [ ] **H14–H18: sleep.**

- [ ] **H18–H22: pitch block with the Story lead.** The Lead and Coder C are asleep, so this is the two of you.
  - **`EVAL.md`:** 20 partner questions, each with an expected answer and a "must not say" list.
  - **Validity slides:** use Coder B's false-positive figure (`docs/science/figures/`). Cover "why we test yearly values", "why two tests" and the years-until-significant explainer.
  - **`LIMITATIONS.md`:** reanalysis vs observation, regional means hiding spatial patterns, linear trends only, short records, multiple testing.
  - **Science content:** the science section of `docs/pitch/PROJECT_PAGE.md` and the science half of `docs/pitch/JUDGES_QA.md`.
  - **Done when:** the Story lead has every piece of science content for the slides and the project page.

- [ ] **H22–H24: accuracy eval.**
  - Run `EVAL.md` with Coder C (the number check plus your manual review) and record the score in STATUS. List the fixes.
  - Approve, or ask Coder C to correct, the 3 pre-generated demo explanations.
  - **Done when:** the eval score is in STATUS and the 3 explanations are approved.

- [ ] **H24–H26: final science QA on production.**
  - Check every number, unit, axis label and source badge in the 3 demo cases and the tour.
  - Check that the attribution list is on the About page.
  - **Done when:** your QA list is resolved before the freeze.

- [ ] **H26–H29: rehearse and present.**
  - Rehearse the judges' Q&A twice with the Story lead, and present the science part of the pitch.
  - Do a final read of the project page's science text.

## If you're blocked

- **No `case_cli.py` at H6:** dry-run the Wisconsin case yourself in Giovanni (it has its own time-series tool) and draft `DEMO_CASES.md` from the literature.
- **No deployed engine at H11:** review Coder B's test output together, and run the review gate as soon as the engine is deployed.
- **Spare time:** write more process cards, more eval questions, or the `LIMITATIONS.md` text.
