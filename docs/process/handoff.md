# Handoff procedure (end of every session)

This is triggered by `/handoff <role>` in Claude Code, or by typing "handoff <role>" in Codex or any other agent. If no role is given, ask for it.

The goal: a fresh agent session can continue without anyone re-explaining anything.

## Where to make the edits

**Docs live on `main`.** Make every edit below in a checkout that has `main` checked out:

- **Sergio, Edur:** your normal checkout (you are already on `main`).
- **Coders on a feature branch:** first commit or stash your code. Then use a second checkout of `main`:
  - Create it once with `git worktree add ../womm-earth-main main`.
  - After that, run `cd ../womm-earth-main && git pull --rebase`.

## Steps

1. Review this session: the files changed, decisions made, what works and what doesn't yet.
2. Tick the finished steps in `docs/roles/<role>.md`, and in the role's implementation plan if it has one.
   - Plan ticks on a feature branch travel with the PR.
   - Playbook ticks go to `main`.
3. Update `docs/STATUS.md`, editing only these parts:
   - your row in Workstreams (Now / Next / State);
   - milestone states and checkpoints you own;
   - Blockers: add new ones with an owner, remove resolved ones;
   - the **Updated** line.
4. If a decision changed scope, architecture or naming, add a row to the Decisions log in `docs/PROJECT.md`. If it changed statistics, add a row to the change log in `docs/science/METHODS.md`.
5. Write `docs/handoffs/YYYY-MM-DD-HHMM-<role>-<topic>.md` from the template in `docs/handoffs/README.md` (under 30 lines, local time).
6. Commit only these docs files, with the message `docs(handoff): <role> <topic>`, and push to `main`. If the push is rejected, run `git pull --rebase` and push again.
7. Coders: make sure your feature branch is pushed too (`git push`), so nothing is stranded on your laptop.

Finish with a 3-line summary: what was recorded, the next step, and anything a teammate must see.
