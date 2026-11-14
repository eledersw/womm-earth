# Playbook: Lead / integrator (coder)

**Mission:** one working app on the production URL that can always be demoed. You own the shell, the globe and the look; you unblock everyone and merge everything.
**Carries:** Presentation, Relevance.
**Owns:** Next.js shell and layout, the globe, URL state (nuqs), the design system (`app/tokens.css`), the Vercel project (deploys, env, Firewall rule), PR merges.

**Inputs you need:**

| What | From | By |
|---|---|---|
| Stub API + `openapi.json` | Coder B | H2 |
| Brand brief | Story lead | H2 |
| Panel and chart components | Coder C | H6–H8 |
| Real endpoints | Coder B | H8 (analyze) and H14 (trendmap, mirror) |
| Copy & consistency QA list | Story lead | H24 |

**Outputs others need:**

| What | To | By |
|---|---|---|
| Production URL + smoke results | everyone | H2 |
| A build ready for the user test | Story lead | H13 |
| Playwright screenshots for the slides | Story lead | H18 and H26 |

Tick each box as you finish it. Times are from `docs/STATUS.md`.

## Steps

- [ ] **H0–H0.5: kickoff.**
  - Share the repo link, `docs/TEAM.md` and each person's playbook.
  - Run a 15-min huddle: fill in names in TEAM/STATUS, confirm roles, pick the personalization options, and set the name vote for H2.
  - **Done when:** everyone has opened Claude Code with `/resume <role>`.
- [ ] **H0.5–H1: write your workstream plan.**
  - Run `superpowers:writing-plans` on this playbook plus `docs/ARCHITECTURE.md` → `docs/superpowers/plans/2026-11-14-frontend.md`.
  - Execute it with `superpowers:executing-plans`.
- [ ] **H1–H2: scaffold and smoke deploy.**
  - Scaffold Next.js (App Router, TS, Tailwind, shadcn) + FastAPI from Vercel's Next.js+FastAPI template. Use the 127.0.0.1 dev rewrite and the `vercel.json` include/exclude files described in ARCHITECTURE.
  - Run `vercel link`, push, and deploy.
  - Add `ANTHROPIC_API_KEY` with `vercel:env`. Set a workspace spend cap in the Anthropic Console.
  - **Done when:** the smoke checklist in STATUS is ticked (nested route + query, numpy/`scipy.special`, data-file read, cold-start time) and the production URL is posted in STATUS.
- [ ] **H2–H6: the globe.**
  - A `'use client'` wrapper using `dynamic(..., {ssr:false})`, with self-hosted textures and countries TopoJSON.
  - Hover and click to select. US states appear when zoomed in, one polygon layer per zoom level.
  - A search box fed by the stub `/regions`.
  - nuqs case state (`v, r, from, to, s, lvl`), with `r` kept in canonical sorted order.
  - **Done when:** clicking a country or searching "Wisconsin" updates the URL and the panel, and reloading the URL restores the selection.
- [ ] **H3–H4: design direction session** (with the Story lead's brand brief).
  - `impeccable` → direction contract.
  - `ui-ux-pro-max` design-system → fonts and palette → `app/tokens.css`.
  - `dataviz` → a colourblind-safe diverging palette for trends.
  - **Done when:** the tokens are applied to the shell and the Story lead has chosen between the options.
- [ ] **H6–H8: layout and merges.**
  - Lay out the panel and globe; merge Coder C's panel shell; run `code-review` before each merge.
  - **M1 done when:** a case can be built on stub data from the globe and panel together.
- [ ] **H8–H14: trend map and end-to-end.**
  - Colour the trend map from `/trendmap`: keep `polygonsData` stable and change only the colour accessor.
  - Wire the real API end to end on production.
  - Have a build ready for the H13 user test.
  - **M2 done when:** Case #1 (Wisconsin JJA AOD) runs fully on the production URL and a Playwright smoke test of it passes (swiftshader flags).
- [ ] **H14–H18: Should-features on the globe.**
  - Mirror highlight (an arc from the case region to the mirror, plus a linked chart).
  - Share-link button.
  - Predict-before-reveal (if chosen).
  - Wire up the tour engine.
  - Before sleeping, leave Playwright screenshots in `docs/pitch/screenshots/`.
- [ ] **H18–H22: sleep.**
- [ ] **H22–H26: polish and freeze.**
  - Merge M3 work.
  - Run the `impeccable-finish-reviewer` agent → fix the ordered list.
  - `taste-skill` pre-flight pass.
  - `performance-optimizer` agent.
  - Vercel Firewall rate-limit rule on `/api/partner`.
  - Apply the Story lead's QA list.
  - `impeccable-documenter` → `docs/DESIGN.md`.
  - **Done when:** frozen at H26, with Playwright E2E green for all 3 demo cases.
- [ ] **H26–H29: ship.**
  - Final deploy and keep-warm ping.
  - Fresh screenshots for the slides.
  - Help the Story lead make the video (`brag` reads the codebase and builds a launch video).
  - Tick `docs/pitch/SUBMISSION_CHECKLIST.md` together.
  - **Done when:** submitted and the receipt is confirmed.

## If you're blocked

- **No stub API yet:** mock `/regions` from the TopoJSON properties, and keep building the globe.
- **Globe performance is bad:** simplify the TopoJSON with mapshaper, use 110m countries, and reduce polygon altitude/resolution.
- **Python deploy fails:** check bundle size and `excludeFiles` first; plan B is FastAPI on Render/Fly, with the rewrite pointed there.
