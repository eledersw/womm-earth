# Playbook: Coder C, panel, charts & partner

**Mission:** the experience of working a case. The 5-step panel, charts that make the evidence obvious, and a Claude partner that is helpful and never makes up a number.
**Carries:** Impact, Creativity.
**Owns:** `components/panel`, `components/charts` (`<PlotFigure>`), `components/tour`, the correlation view, `app/api/partner/route.ts`, the prompts, the number check, `api/data/demo_explanations.json`.

**Inputs you need:**

| What | From | By |
|---|---|---|
| Stub API + types | Coder B | H2 |
| `COPY.md` | Story lead | H5 |
| Verdict templates + grounding rules | Methods lead | H11 |
| Process cards | Methods lead | H10 |
| Tour captions | Story lead | H10 |
| `EVAL.md` | Methods lead | H20 |
| Copy & consistency QA list | Story lead | H24 |

**Outputs others need:**

| What | To | By |
|---|---|---|
| Panel shell | Lead | H6 |
| Explain streaming | everyone | H8 |
| Partner with tools | Methods lead (eval) | H18 |
| Pre-generated demo explanations | Methods lead (approval) | H24 |

## Steps

- [ ] **H0–H1: plan and read up.**
  - Create your worktree.
  - Run `superpowers:writing-plans` on this playbook plus ARCHITECTURE → `docs/superpowers/plans/2026-11-14-partner-panel.md`.
  - Load the `claude-api` skill and read the TS `README.md`, `tool-use.md` and `streaming.md`.
- [ ] **H1–H2: shells.**
  - The `<PlotFigure>` client wrapper (`useRef`, cleanup, `ResizeObserver`, CSS-variable colours).
  - Panel component shells against the stub types.
- [ ] **H2–H8: the case flow.**
  - The 5-step panel: variable picker with definition cards, period slider (commits on release), season filter, region chips.
  - Main chart: raw/anomaly toggle, the yearly series with the OLS line + CI band, and the Sen line (`dataviz` rules for marks and legends).
  - The verdict card, using the template text.
  - The Explain route: Opus 5.5, effort `low`, SSE events `text`/`error`; the client posts the stats JSON.
  - **M1 done when:** on stub data, choosing a case shows the chart and verdict, and Explain streams a paragraph.
- [ ] **H8–H14: real data.**
  - Wire everything to the real API; multi-region overlay (up to 4).
  - Student/Scientist toggle.
  - Number-check utility: extract the numbers from the output and compare them with the tool JSON.
  - Correlation view skeleton.
  - Swap all strings to `COPY.md`.
- [ ] **H14–H18: the partner and the Should-features.**
  - Partner chat: Tool Runner with `betaZodTool` tools (`list_variables`, `analyze_case`, `correlate`, `find_mirror`, `scan_region`, `get_process_card`, `propose_case`), an iteration cap, and a `propose_case` → "Open this case" button.
  - Finish the correlation view, including the "both rising ≠ connected" warning.
  - Years-until-significant meter.
  - Tour player reading the tour JSON.
  - **Done when:** the partner answers "Is Wisconsin getting smokier in summer?" by running the case and offering to open it.
- [ ] **H18–H22: sleep.**
- [ ] **H22–H26: quality.**
  - Pre-generate the 3 demo explanations (both reading levels) → `demo_explanations.json`. The Methods lead approves them.
  - Run `EVAL.md` with the Methods lead (number check + manual review); fix the prompts.
  - Playwright E2E for the 3 demo cases.
  - Apply the copy QA list.
  - **Done when:** the eval score is recorded in STATUS and the app is frozen at H26.
- [ ] **H26–H29:** P0 fixes only.

## If you're blocked

- **No real API yet:** keep building on fixtures; the types are already final.
- **Claude errors or rate limits:** the template verdict covers the UI; work on the charts and tour meanwhile.
- **No `COPY.md` yet:** use the glossary terms from `docs/PROJECT.md` as placeholder text.
