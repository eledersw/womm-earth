---
description: Record progress at the end of a session so the next chat can continue cold
argument-hint: lead | coder-b | coder-c | methods-lead | story-lead
---
Close out this session so a fresh Claude chat can continue without me re-explaining anything.

Role: $ARGUMENTS. If it is empty, ask which role I am.

**Docs live on `main`.** Run `git worktree list` and find the checkout that has `main` checked out (usually the original clone). Make every docs edit below **in that checkout**. If none has `main`, create one with `git worktree add ../womm-earth-main main`. Then run `git pull --rebase` there.

1. Review this session: the files changed, the decisions made, what works and what doesn't yet.
2. Tick the finished steps in `docs/roles/<role>.md`.
3. Update `docs/STATUS.md`:
   - my row in Workstreams (Now / Next / State);
   - milestone states and checkpoints;
   - Blockers: add new ones with an owner, remove resolved ones;
   - the **Updated** line at the top.

   Edit only these parts, so you don't conflict with teammates.
4. If a decision changed scope, architecture or naming, add a row to the Decisions log in `docs/PROJECT.md`. If it changed statistics, add one to the change log in `docs/science/METHODS.md`.
5. Write `docs/handoffs/YYYY-MM-DD-HHMM-<role>-<topic>.md` from the template in `docs/handoffs/README.md` (under 30 lines, local time).
6. Commit only these docs files, with the message `docs(handoff): <role> <topic>`, and push. If the push is rejected, run `git pull --rebase` and push again. Code changes go in their own commits on their own branch.

Finish with a 3-line summary: what was recorded, the next step, and anything a teammate must see.
