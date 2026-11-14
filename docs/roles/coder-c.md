# Playbook: Coder C, panel, charts & partner (Ekaitz, Codex)

**Mission:** the experience of working a case. A 5-step panel, charts that make the evidence obvious, and a Claude partner that is helpful and never makes up a number.
**Carries:** Impact, Creativity.
**Your area:** `components/{panel,charts,partner,tour}/**`, `app/api/partner/**`, `lib/partner/**`, `lib/tour/**`, `lib/copy/{case,partner,tour}.ts` and your scripts and E2E specs. The full list is in `docs/process/OWNERSHIP.md`. **Edit nothing outside it.**
**Your plan:** [`docs/superpowers/plans/2026-11-14-partner-panel.md`](../superpowers/plans/2026-11-14-partner-panel.md). It has the exact files, interfaces, tests and **verified Anthropic SDK code**. This playbook is the timeline.

**How you work (Codex):**
1. Open Codex in the repo; it reads `AGENTS.md` automatically. Type **`resume coder-c`**.
2. Tell it *"work Task N of my plan"*. For anything touching the Anthropic SDK, tell it to use the snippets in the plan as written; Codex's memory of that SDK is likely out of date.
3. Follow the PR loop in `docs/process/MERGING.md`: an `ekaitz/<topic>` branch, rebase, `npm run check` + `npx vitest run`, PR, then self-merge if the PR only touches your area.
4. End every session with **`handoff coder-c`**.

**You consume, and never edit, these seams** (from Eleder at H2):
- `useCase()`, `caseToQuery`, `caseFromQuery`, `caseKey`, `normalizeCase`
- `useUiStore`
- `api` / `serverApi`
- `lib/api/types.ts`
- the CSS variables in `app/tokens.css`

Need something added to a seam? Ask Eleder; additive changes take minutes.

**Inputs you need:**

| What | From | By |
|---|---|---|
| Scaffold | Eleder | H1.5 |
| Seams + stub API | Eleder, Oier | H2 |
| `COPY.md` | Edur | H5 |
| Real API | Oier | H8 |
| Process cards | Sergio | H10 |
| Tour captions | Edur | H10 |
| Verdict templates + grounding rules | Sergio | H11 |
| `EVAL.md` | Sergio | H20 |
| Copy QA list | Edur | H24 |

**Outputs others need:**

| What | To | By |
|---|---|---|
| Panel shell | Eleder | H2 |
| Explain streaming | everyone | H14 |
| Partner with tools | Sergio (eval) | H18 |
| Demo explanations | Sergio (approval) | H24 |

## Timeline

- [x] **H0.5–H2: plan Task 1,** panel shell + PlotFigure. Branch from `main` after Eleder's scaffold. Merge **last** at the H2 checkpoint (after Oier, then Eleder).
- [x] **H2–H5: plan Task 2,** Lead/Scene/Timeline wired to the case state.
- [x] **H5–H8: plan Task 3,** evidence charts + verdict card. Merge last at the **H8 checkpoint**.
- [ ] **H8–H10: plan Task 4,** SSE helpers + number check.
- [ ] **H10–H14: plan Task 5,** Explain mode. Merge last at the **H14 checkpoint**: Case #1 explains on production.
- [ ] **H14–H18: plan Tasks 6–8,** partner chat with tools; correlation, mirror, years meter, predict; tours. Merge before sleeping.
- [ ] **H18–H22: sleep.**
- [ ] **H22–H26: plan Task 9,** demo explanations (Sergio approves), the eval run with Sergio, E2E, copy QA fixes. Merge before the **H26 freeze**.
- [ ] **H26–H29:** P0 fixes only, merged by Eleder.

## If you're blocked

- **No real API yet:** keep building on the fixtures and types; the contract is frozen.
- **Claude errors or rate limits:** the template verdict covers the UI; work on the charts or tours meanwhile.
- **No `COPY.md` yet:** use the glossary terms from `docs/PROJECT.md` as placeholders in `lib/copy/*`.
- **You need a change in Eleder's or Oier's files:** ask them. Don't edit those files yourself.
