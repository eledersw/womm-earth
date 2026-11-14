---
description: Load the project context at the start of a session and say what to do next
argument-hint: lead | coder-b | coder-c | methods-lead | story-lead
---
You are joining the Earth Case Files hackathon project partway through. Build context first, then propose the next step.

Role: $ARGUMENTS. If it is empty, ask which role I am (lead, coder-b, coder-c, methods-lead, story-lead) before continuing.

1. Read `docs/STATUS.md`, `docs/PROJECT.md` and `docs/TEAM.md`.
2. Read my playbook, `docs/roles/<role>.md`.
3. Read the 3 newest notes in `docs/handoffs/` (filenames sort by time; skip README.md).
4. For coder roles, read `docs/ARCHITECTURE.md` too. For `methods-lead`, read `docs/science/METHODS.md`. For `story-lead`, read `docs/pitch/SUBMISSION_CHECKLIST.md`.
5. Run `git pull --rebase` if the working tree is clean, then `git log --oneline -15`.

Reply in under 200 words:
- the current hour (H) and milestone, worked out from the clock table in STATUS.md and the current local time;
- my next unchecked playbook step, with its "Done when";
- blockers or handoff notes that involve my role;
- the first concrete action you propose, then wait for my go-ahead.
