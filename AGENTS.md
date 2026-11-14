# Earth Case Files: NASA Space Apps 2026 (team WOMM)

These instructions are for any coding agent (Codex, Claude Code, others).

**What we're building.** A guided "data detective" web app for the challenge *Be An Earth System Trend Detective!* On a 3D globe you pick a variable, region(s), period and season. You get the time series, its rate of change, a significance verdict, correlations and an opposite-trend "mirror" region, explained in plain language by a Claude partner. It is statistically rigorous under the hood.

**Team.** 5 people, ~30 hours. The deadline and current hour are in `docs/STATUS.md`. Eleder uses Claude Code; Oier and Ekaitz use Codex.

## Session protocol

- **"resume <role>"** at the start of a session: follow `docs/process/resume.md`.
- **"handoff <role>"** at the end of a session: follow `docs/process/handoff.md`.
- **Roles:** `lead` (Eleder), `coder-b` (Oier), `coder-c` (Ekaitz), `methods-lead` (Sergio), `story-lead` (Edur).
- **Coders** work through the plan their playbook names: one task at a time, ticking checkboxes, committing after each task.

## Ownership (read before editing anything)

Every file has one owner; the map is `docs/process/OWNERSHIP.md`. **Edit only files in the area of the person you are working for.**
- If a task seems to need a change in another area, stop and tell your user what to ask the owner for. Don't make the edit.
- Seams between areas (the HTTP contract, case state, UI store, API client, panel slot, tokens) are frozen after H2. Additive changes need a heads-up; breaking changes need agreement.

## Merging

Follow `docs/process/MERGING.md`:
- **Branches:** `<name>/<topic>`, short-lived.
- **Rebase** on `origin/main` before each PR.
- **Checks:** `npm run check` and `python -m pytest -q` must pass.
- **Merging:** self-merge PRs that touch only your area; Eleder merges cross-area PRs.
- **Checkpoints:** fixed integration merges at H2, H8, H14, H22, H26, in the order Oier → Eleder → Ekaitz.

## Read when

- `docs/STATUS.md`: **first, every session.**
- `docs/roles/<role>.md`: your playbook. It links your implementation plan in `docs/superpowers/plans/`.
- `docs/ARCHITECTURE.md`: before writing or changing code (endpoints, data shapes, layout, gotchas).
- `docs/science/METHODS.md`: before touching `api/_engine/` or any verdict wording. It is the source of truth for every statistical choice.
- `docs/PROJECT.md`: scope (Must/Should/Could), judging map, **glossary** (use these words in code and UI), decisions log.
- `docs/DATA_CATALOG.md`: when adding or describing a variable.
- `docs/pitch/COPY.md`: when writing user-facing text.

## Rules

- **Contract first.** The Pydantic models in `api/_models.py` define every request and response. After changing them, run `npm run gen:types` and commit the generated files.
- **Engine code is test-first,** written against the golden cases in `tests/fixtures/golden/`.
- **Claude partner:**
  - Every number it states comes from a tool result, and every physical explanation comes from a process card.
  - Model id `claude-opus-5-5`.
  - The API key is read server-side only, from `ANTHROPIC_API_KEY`.
- **UI text** comes from `lib/copy/*`, which follows `docs/pitch/COPY.md`.
- **Freeze at H26:** only P0 fixes after it.

## Commands (after the scaffold lands)

| Command | Does |
|---|---|
| `npm run dev` | Next.js + FastAPI together (FastAPI on 127.0.0.1:8000) |
| `npm run check` | typecheck + lint + build |
| `npm run gen:types` | dump the OpenAPI schema and regenerate `lib/api-types.ts` |
| `npm run test:e2e` | Playwright |
| `python -m pytest -q` | Python tests |
| `python scripts/case_cli.py --help` | run a case from the terminal |
