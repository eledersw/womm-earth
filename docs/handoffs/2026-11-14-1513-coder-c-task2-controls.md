# coder-c · Task 2 controls · H3.2

## Done
- Task 2 implemented locally on `ekaitz/task2-case-controls`, based on `origin/main` at eb06ece (fetched via public HTTPS).
- Lead: grouped variable selector, regional availability, reading-level definitions and coverage clamping.
- Scene: named removable chips, max 4 via canonical codec, nearest-cell hint; adding stays with Eleder's globe/search.
- Timeline: slider commits on release; standard seasons and cyclic custom months use the shared URL state.
- Shared-client catalogue hooks fetch once with retry; analysis caches completed results, aborts stale requests and hides stale data.
- Removed fixture imports from CasePanel; retained basic yearly chart/tier from HTTP results until Task 3.

## Decisions made
- Consumed existing frozen seams; no contract, state, client, dependencies or other ownership areas changed.
- Current user Git rules override the older docs workflow: feature branch only; user handles push, PR and merge.

## State of things
- Pass: npm run check; 66 Vitest tests; 4 Chromium E2E (URL/reload, availability/resize, errors/retry, tabs).
- Screenshot reviewed at 1280 px; no overflow checked at 1280/768/390 px. Browser data is mocked from official HTTP fixtures.
- Python checks unavailable: `python -m pytest -q` reports no module named pytest; no Python files changed.
- Real-data backend, production and Claude were not exercised. Partner route remains a 501 stub.

## For other roles
- Eleder: Task 2 now consumes useCase inside Suspense and the existing API client/types; adding Scene regions remains in globe/search.
- Edur: control copy remains provisional in lib/copy/case.ts while COPY.md is draft.

## Next step for whoever continues
- Ekaitz: manually push this branch, create PR and merge; Task 3 adds full Evidence/Verdict presentation per the official plan.
