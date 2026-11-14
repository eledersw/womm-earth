# STATUS: live board

**Updated:** Sat 2026-11-14 12:00 (H0), by Claude (docs scaffold)
**Deadline:** target H30 ≈ Sun 2026-11-15 18:00 local. *The Story lead confirms the official time at H1 and corrects this line.* **We submit by H29.**
**Current milestone:** M0 (due H2)

State legend: ✅ done · 🟡 in progress · ⛔ blocked · ⬜ not started

## Clock (H0 = Sat 12:00)

| H | Local time | Event |
|---|---|---|
| H0 | Sat 12:00 | Plan approved; docs pushed; 15-min huddle |
| H2 | Sat 14:00 | **M0** · stand-up · name vote · METHODS v1 review (B + Methods) |
| H3–H4 | Sat 15:00–16:00 | Design direction session (Lead + Story) |
| H6 | Sat 18:00 | Stand-up · `case_cli.py` ready |
| H8 | Sat 20:00 | **M1** · demo cases picked |
| H10 | Sat 22:00 | Stand-up |
| H13 | Sun 01:00 | Outsider user test |
| H14 | Sun 02:00 | **M2** · stand-up · **sleep wave 1:** Coder B, Methods, Story |
| H18 | Sun 06:00 | **Sleep wave 2:** Lead, Coder C · pitch block (Methods + Story) |
| H22 | Sun 10:00 | Stand-up · everyone awake |
| H26 | Sun 14:00 | **FEATURE FREEZE** · stand-up |
| H29 | Sun 17:00 | **SUBMIT** |

## Milestones

| Milestone | Done when | State |
|---|---|---|
| M0 (H2) | Docs pushed; Next.js + FastAPI scaffolded; smoke checklist passes; stub API live; Anthropic key + spend cap set; submission rules checked; Zarr spike done | 🟡 |
| M1 (H8) | Data library committed; engine passes golden cases 1–3; globe selects and searches; panel + chart work on stub data; Explain streams; demo cases picked | ⬜ |
| M2 (H14) | Case #1 runs fully on the production URL; trend map live; "Validity checkpoint passed" recorded below | ⬜ |
| M3/M4 (H26) | Should-features merged; finish-review fixes applied; Playwright smoke green; frozen | ⬜ |
| M5 (H29) | Submitted, receipt confirmed | ⬜ |

## Workstreams

| Role | Person | Now | Next | State |
|---|---|---|---|---|
| Lead | Eleder | — | Scaffold + smoke deploy | ⬜ |
| Coder B (data & stats) | Oier | — | Zarr spike in Colab, stub API | ⬜ |
| Coder C (panel, charts, partner) | Ekaitz | — | claude-api skill, `<PlotFigure>`, panel shells | ⬜ |
| Methods & Validity lead | Sergio | — | `METHODS.md` v1, Giovanni hero series | ⬜ |
| Story & Submission lead | Edur | — | Submission recon, brand brief | ⬜ |

## Checkpoints

- [ ] Smoke deploy (Lead, H2):
  - [ ] nested route with a query string answers (`/api/py/health?x=1`)
  - [ ] numpy + `scipy.special` import
  - [ ] reads one file from `api/data/`
  - [ ] cold start: ___ s
- [ ] Validity checkpoint passed (Methods lead, by H14)
- [ ] Accuracy eval score: ___ / 20 (Methods lead + Coder C, H22–H24)
- [ ] Submission checklist complete (Story lead + Lead, H29)

## Blockers

_None yet._ Format: `- [owner] what is blocked · who can unblock it · since H?`
