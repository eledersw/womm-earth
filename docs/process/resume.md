# Resume procedure (start of every session)

This is triggered by `/resume <role>` in Claude Code, or by typing "resume <role>" in Codex or any other agent. Roles: `lead`, `coder-b`, `coder-c`, `methods-lead`, `story-lead`.

If no role is given, ask for it before continuing.

1. Read `docs/STATUS.md`, `docs/PROJECT.md`, `docs/TEAM.md` and `docs/process/OWNERSHIP.md`.
2. Read the playbook, `docs/roles/<role>.md`.
3. For coder roles:
   - Read `docs/process/MERGING.md` and `docs/ARCHITECTURE.md`.
   - For `methods-lead`, read `docs/science/METHODS.md`.
   - For `story-lead`, read `docs/pitch/SUBMISSION_CHECKLIST.md`.
4. Read the 3 newest notes in `docs/handoffs/` (filenames sort by time; skip README.md).
5. Run `git fetch origin`. Then `git status -sb` and `git log --oneline -10 origin/main`. If the current branch is a feature branch, check whether it is behind `origin/main` and say so.

Reply in under 200 words:
- the current hour (H) and milestone, from the clock table in STATUS.md and the current local time;
- the next unchecked step in the playbook or plan, with its "Done when";
- blockers or handoff notes that involve this role;
- the first concrete action, then wait for the go-ahead.
