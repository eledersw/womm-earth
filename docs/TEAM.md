# TEAM

Fill in the names at the H0 huddle.

| Role | Person | Playbook | Carries (judging) | One-line mission |
|---|---|---|---|---|
| Lead / integrator (coder) | _name_ | [lead.md](roles/lead.md) | Presentation, Relevance | One working app on the production URL that can always be demoed. Owns the look; unblocks everyone. |
| Coder B: data & stats engine | _name_ | [coder-b.md](roles/coder-b.md) | Validity | Turns NASA data into region series and implements `METHODS.md` exactly. |
| Coder C: panel, charts & partner | _name_ | [coder-c.md](roles/coder-c.md) | Impact, Creativity | The 5-step case experience, the charts and the Claude partner. |
| Methods & Validity lead (statistician) | _name_ | [methods-lead.md](roles/methods-lead.md) | Validity | Every number is correct, correctly explained and defensible in front of a judge. Writes the stats spec, the test answer key and the sign-off. |
| Story & Submission lead | _name_ | [story-lead.md](roles/story-lead.md) | Presentation, Impact | Turns the work into the project page, slides, video and every word in the app. Makes sure we submit correctly. |

## Who works with whom

- **Methods ↔ Coder B:** Methods writes the spec (`METHODS.md`) and the answer key (golden cases); B implements and tests against them; Methods signs off at the H11–H14 review gate.
- **Methods ↔ Story (the pair):** Methods supplies the content and checks it is correct; Story shapes it for the audience. Fixed pairing points:
  - H2–H5: in-app wording for statistical terms.
  - H8: demo cases → demo script.
  - H13: user test.
  - **H18–H22: pitch block** (the Lead and Coder C are asleep).
  - H26–H28: rehearsal.
- **Story → Lead:** the brand brief at H2 feeds the design direction session at H3–H4; the copy & consistency QA list arrives before the H26 freeze.
- **Story → Coder C:** `COPY.md` and the tour captions.
- **Methods → Coder C:** the verdict templates, partner grounding rules, process cards and the eval.

## Rhythm

- **Stand-ups (5 min, walking through `docs/STATUS.md`):** H2, H6, H10, H14, H22, H26.
- **Sleep:**
  - Wave 1, H14–H18: Coder B, Methods, Story.
  - Wave 2, H18–H22: Lead, Coder C.
- **Freeze at H26.** Submit by H29.
- The clock table (H → local time) is in `docs/STATUS.md`.

## How to work with Claude

- **Everyone:** open Claude Code in the repo. Start with `/resume <role>` and end with `/handoff <role>`.
- **Non-coders:**
  - Work in the main checkout on `main` and commit only inside your own folder (`docs/science/` or `docs/pitch/`). Claude can do the git part for you: say *"commit and push my changes in docs/science"*.
  - For research, ask Claude to use deep research. For anything that turns your writing into app data (e.g. `variables.json`, `process_cards.json`, tour JSON), ask Claude to convert it and tell the coder who owns that file.
- **Coders:** feature branches in your own worktree (`superpowers:using-git-worktrees`), small PRs written with `mattpocock:pr`, and `code-review` before merge. The Lead merges.
