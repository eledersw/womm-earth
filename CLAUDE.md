# Earth Case Files: NASA Space Apps 2026 (team WOMM)

A guided "data detective" web app for the challenge *Be An Earth System Trend Detective!* On a 3D globe you pick a variable, region(s), period and season. The app returns:
- the time series and its rate of change;
- a significance verdict;
- correlations and an opposite-trend "mirror" region;
- a plain-language explanation from a Claude partner.

Under the hood it is statistically rigorous. Team: 5 people (3 coders, 2 non-coders), ~30 hours. The deadline and current hour are in `docs/STATUS.md`.

## Session protocol

- **Start** every session with `/resume <role>`. Roles: `lead`, `coder-b`, `coder-c`, `methods-lead`, `story-lead`. Then work the next unchecked step in your playbook, `docs/roles/<role>.md`.
- **End** every session with `/handoff <role>`. It ticks your playbook, updates `docs/STATUS.md` and writes a note in `docs/handoffs/`.
- **Docs live on `main`.** Status and handoff edits are made in the checkout that has `main` checked out. Feature work happens in worktrees.

## Read when

- `docs/STATUS.md`: **first, every session.** Current hour, milestone, blockers, who is on what.
- `docs/roles/<role>.md`: your step-by-step playbook with "Done when" criteria.
- `docs/PROJECT.md`: when deciding what to build or what to call something. It holds the scope (Must/Should/Could), judging map, glossary and decisions log.
- `docs/ARCHITECTURE.md`: before writing or changing code. Endpoints, data shapes, repo layout, known gotchas.
- `docs/science/METHODS.md`: before touching `api/engine/` or any verdict wording. It is the source of truth for every statistical choice.
- `docs/DATA_CATALOG.md`: when adding, labelling or describing a variable.
- `docs/pitch/COPY.md`: when writing any user-facing text.
- `docs/TEAM.md`: who owns what, pairing points, sleep waves.
- `docs/superpowers/specs/2026-11-14-earth-case-files-design.md`: the approved design snapshot. Where it differs from the living docs above, the living docs win.

## Rules

- **Contract first:** the Pydantic models in `api/` define every request and response. After changing them, run `npm run gen:types`.
- **Engine code is test-first,** written against the golden cases in `tests/fixtures/` (copied from `docs/science/golden_cases/`).
- **The partner is grounded:** every number it states comes from a tool result, and every physical explanation comes from a process card.
- **UI text comes from `docs/pitch/COPY.md`.** Labels, tooltips and verdict names all match the glossary in `docs/PROJECT.md`.
- **Secrets stay in Vercel env.** `ANTHROPIC_API_KEY` is read server-side only.
- **Git:**
  - Coders work on feature branches in their own worktrees and open small PRs; the Lead merges to `main`.
  - Non-coders commit only inside their own folder (`docs/science/` or `docs/pitch/`).
- **Feature freeze at H26.** After it, only P0 fixes.

## Stack

- Next.js (App Router, TypeScript, Tailwind, shadcn).
- FastAPI as a Vercel Python function under `api/`, with routes at `/api/py/*`.
- Globe and charts: `react-globe.gl` and Observable Plot.
- URL state: `nuqs`.
- Claude: `claude-opus-5-5` via `@anthropic-ai/sdk`.

Commands: `package.json` scripts, and `docs/ARCHITECTURE.md` once scaffolded.

## Plugins to reach for

- **Process:** superpowers (writing-plans, executing-plans, test-driven-development, systematic-debugging, verification-before-completion, using-git-worktrees, requesting-code-review), mattpocock-skills (tdd, pr, code-review, grilling).
- **UI:** impeccable (direction contract, finish review, DESIGN.md), ui-ux-pro-max (tokens, fonts, brand, slides, banners), taste-skill (anti-slop pre-flight before UI merges), frontend-design, dataviz (every chart).
- **Platform:** vercel (nextjs, vercel-functions, deploy, env, vercel-firewall, performance-optimizer), claude-api (all Claude code), playwright (E2E and screenshots; launch with the swiftshader WebGL flags), brag (launch video).
