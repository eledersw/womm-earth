## What

<!-- One or two lines. Link the plan task, e.g. "data-engine plan, Task 3". -->

## Area

- [ ] Only my own area (`docs/process/OWNERSHIP.md`): I can self-merge once CI is green
- [ ] Touches someone else's area: the owner approved below, and Eleder merges

## Seam change

- [ ] None
- [ ] Additive (new optional field / endpoint / store field): heads-up posted in `docs/STATUS.md`
- [ ] Breaking: agreed with everyone affected; Eleder merges

## Checks

- [ ] Rebased on `origin/main`
- [ ] `npm run check` (front-end changes)
- [ ] `npx vitest run` / `python -m pytest -q`
- [ ] Opened the Vercel preview and checked the change: <!-- preview URL -->
- [ ] Generated files regenerated (`npm run gen:types`) if the contract changed
