# STATUS: live board

**Updated:** Sat 2026-11-14 16:07 (H4.1), by Ekaitz (coder-c Explain local implementation)

**Production:** https://womm-earth.vercel.app (auto-deploys from `main`; every PR gets a preview URL. Previews require a Vercel login or the bypass header.)

> 📣 **Scaffold is on `main`: branch from it now.** Run `npm ci`, and create a Python venv for `requirements.txt` + `uvicorn`. Then `npm run dev` starts Next.js plus FastAPI on 127.0.0.1:8000. `npm run check` must pass before every PR.
> 🎨 **Visual direction live (H4.2, PR #12): Strip-Chart Recorder.** The panel sits on ruled chart paper, the globe sits in a dark viewing window, and region channels are pen inks. @Ekaitz: use `var(--series-1..4)` for each region's pen, `.scale-label` for labels, only `text-panel` (18px) and `text-scale` (14px), no nested cards, and the verdict as an outlined condensed uppercase stamp. The plan's stepped 5-step rail down the panel edge belongs in `CasePanel`. Tokens: `app/tokens.css`. @Edur: the name plate reads "Earth Case Files" until your brand brief; it is one string in `lib/copy/globe.ts`.

> 🔒 **Seams frozen (H2.8, PR #7).** Use `useCase()` from `@/lib/state/use-case` (inside `<Suspense>`), `useUiStore` from `@/lib/state/ui-store`, `api` / `serverApi` from `@/lib/api/client`, and types from `@/lib/api/types`. Additive changes: ask Eleder. Breaking changes: agreement from everyone affected.

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
| Lead | Eleder | Task 3 done: visual direction **Strip-Chart Recorder**, tokens, app shell (#12) | Task 4: globe (render, layers, select, search) | 🟡 |
| Coder B (data & stats) | Oier | Engine core and live `/analyze`, `/variables`, `/regions` plus CLI implemented locally. Run `python scripts/case_cli.py --var T2M --region US-WI --start 2002 --end 2025 --season JJA --json` after the data library lands. FPR check: Hamed–Rao 9.7% (white) / 24.6% (AR1), matching pymannkendall; Sergio to review slide claim. | Integrate the region library and Sergio's golden cases; validate real-data endpoints. | 🟡 |
| Coder C (panel, charts, partner) | Ekaitz | Tasks 1–4 integrated. Task 5 Explain implemented locally on `ekaitz/task5-explain`: validated SSE route, planned SDK/model, Student/Scientist, cancellation/retry, numeric checks and template fallback. Check + 93 tests + 10 Chromium E2E pass (mock SDK/HTTP fixtures). | User publishes/PR/merges; live Claude + cache-read verification pending in Vercel (key configured there per user, absent locally; user requested deferral). Process cards still draft, so no physical explanations. | 🟡 |
| Methods & Validity lead | Sergio | — | `METHODS.md` v1, Giovanni hero series | ⬜ |
| Story & Submission lead | Edur | — | Submission recon, brand brief | ⬜ |

## Checkpoints

- [x] Smoke deploy (Lead). **Production ✅ at H3.5** (https://womm-earth.vercel.app)
  - [x] nested route with a query string answers (`/api/py/health?x=1`) → 200
  - [x] numpy 2.5.4 + scipy 1.18.1 import on Vercel
  - [x] `/api/partner` answers alongside `/api/py/*` (stub → 501); Oier's `/api/py/regions` stub → 200
  - [x] cold start: 0.64 s import on Vercel (0.08 s locally); a warm request takes ~0.55 s round trip from Spain to iad1
  - [x] Python 3.12.16 on Vercel (from `.python-version`)
- [ ] Validity checkpoint passed (Methods lead, by H14)
- [ ] Accuracy eval score: ___ / 20 (Methods lead + Coder C, H22–H24)
- [ ] Submission checklist complete (Story lead + Lead, H29)

## Blockers

- [Eleder] Protection Bypass for Automation and Anthropic spend cap · Eleder (dashboard); ANTHROPIC_API_KEY is configured in Vercel per user report · since H3.5

- [coder-c] Confirm production rate limit for `/api/partner` before public Explain rollout · Eleder (Vercel firewall) · since H4.1

Format: `- [owner] what is blocked · who can unblock it · since H?`
