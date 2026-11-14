# MERGING: branches, PRs and integration checkpoints

`main` auto-deploys to production on Vercel. It must always build and be demoable. Every PR gets a Vercel preview URL.

## Branches

- **Coders:** one short-lived branch per task, `<name>/<topic>` (e.g. `oier/engine-mk`, `ekaitz/verdict-card`). Keep each one open for at most ~3 hours.
- **Non-coders (Sergio, Edur):** commit docs straight to `main`, inside their own folders only.
- **Docs edits by coders** (STATUS, handoffs, playbook ticks) also go straight to `main`. Make them from a checkout that has `main` checked out (see `docs/process/handoff.md`), never from inside a feature branch.

## The PR loop (every coder, every task)

```bash
git fetch origin && git rebase origin/main      # at least every 2 hours, and before opening a PR
npm run check                                   # typecheck + lint + build (front-end changes)
python -m pytest -q                             # API/engine changes
git push -u origin <name>/<topic>               # then open the PR on GitHub
```

The PR body uses `.github/pull_request_template.md`: which area it touches, whether it changes a seam, the checks you ran, and the preview URL checked.

## Who merges

| The PR touches | Merged by | Condition |
|---|---|---|
| Only your own area | **You** (squash merge) | CI green, preview opens, no seam change |
| A seam (additive) | You | As above, plus a heads-up in STATUS before merging |
| A seam (breaking) or someone else's area | **Eleder** | The affected owner approves on the PR |
| `package.json`/lock only (deps PR) | You | CI green; merge right away |
| After the H26 freeze | **Eleder** | P0 fixes only; Eleder reviews each one |

Squash merges keep `main` readable. Delete the branch after merging.

## Integration checkpoints

All three coders merge what they have in a **fixed order**, rebasing in between:

1. **Oier** (contract/API) →
2. **Eleder** (shell/state/globe) →
3. **Ekaitz** (panel/partner).

After the last merge, Eleder runs the production smoke test and records the result in STATUS.

| When | What lands | Smoke check after |
|---|---|---|
| **H2** (14:00) | Seams: Eleder's scaffold + state + client stubs, Oier's stub API + types, Ekaitz's panel shell | The page loads; `/api/py/health` and `/api/partner` answer |
| **H8** (20:00) | M1: real `/analyze`, `/regions` and `/variables`; a globe that selects; panel + chart; Explain | Building a case on the preview works |
| **H14** (02:00) | M2: Case #1 end to end, trend map | Playwright smoke green on production. **Nobody sleeps with an unmerged branch.** |
| **H22** (10:00) | Wave-2 work: hardening, partner tools, Should-features | Smoke + E2E |
| **H26** (14:00) | **Freeze.** Last feature merges | Full E2E on production |

Between checkpoints, merge whenever a task is done (the PR loop above). A checkpoint is the moment everyone **is** merged; it doesn't stop you merging earlier.

## Resolving conflicts

- **Generated files** (`lib/api-types.ts`, `api/openapi.json`): run `npm run gen:types`, then `git add` the results.
- **`package-lock.json`:** keep both dependencies in `package.json` by hand, then run `git checkout origin/main -- package-lock.json && npm install` and `git add` both files.
- **`docs/STATUS.md`:** keep every row; each person edits only their own row.
- **A conflict inside someone else's file** means your branch edited outside your area. Revert your change to that file and ask the owner.

## CI (Eleder sets it up in the scaffold; `.github/workflows/ci.yml`)

- **web:** `npm ci`, then `npm run check`.
- **api:** `pip install -r requirements-dev.txt`, then `python -m pytest -q`.
- **ownership** (warning only): `node scripts/check-ownership.mjs` lists files changed outside the branch owner's area, so a stray edit is visible in the PR.
