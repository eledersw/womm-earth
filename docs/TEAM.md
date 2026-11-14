# TEAM

Fill in the names at the H0 huddle.

| Role | Person | Playbook | Carries (judging) | One-line mission |
|---|---|---|---|---|
| Lead / integrator (coder) | Eleder | [lead.md](roles/lead.md) | Presentation, Relevance | One working app on the production URL that can always be demoed. Owns the look; unblocks everyone. |
| Coder B: data & stats engine | Oier | [coder-b.md](roles/coder-b.md) | Validity | Turns NASA data into region series and implements `METHODS.md` exactly. |
| Coder C: panel, charts & partner | Ekaitz | [coder-c.md](roles/coder-c.md) | Impact, Creativity | The 5-step case experience, the charts and the Claude partner. |
| Methods & Validity lead (statistician) | Sergio | [methods-lead.md](roles/methods-lead.md) | Validity | Every number is correct, correctly explained and defensible in front of a judge. Writes the stats spec, the test answer key and the sign-off. |
| Story & Submission lead | Edur | [story-lead.md](roles/story-lead.md) | Presentation, Impact | Turns the work into the project page, slides, video and every word in the app. Makes sure we submit correctly. |

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

## How to work with your AI agent

- **Who uses what:** Eleder, Sergio and Edur use Claude Code. Oier and Ekaitz use Codex.
- **Start and end:** in Claude Code, start with `/resume <role>` and end with `/handoff <role>`. In Codex, type `resume <role>` and `handoff <role>`: Codex reads `AGENTS.md`, which points it to `docs/process/`.
- **Non-coders:**
  - Work in the main checkout on `main` and commit only inside your own folder (`docs/science/` or `docs/pitch/`). Claude can do the git part for you: say *"commit and push my changes in docs/science"*.
  - For research, ask Claude to use deep research.
  - You never write app files. When a doc of yours is ready (DATA_CATALOG, PROCESS_CARDS, COPY, tour captions), tell its converter; the table in `docs/process/OWNERSHIP.md` says who that is.
- **Coders:**
  - Each coder works only in their own area (`docs/process/OWNERSHIP.md`) and follows `docs/process/MERGING.md`: `<name>/<topic>` branches, rebase before each PR, CI green.
  - Self-merge PRs that touch only your own area; Eleder merges cross-area PRs.
  - Integration checkpoints at H2, H8, H14, H22 and H26, merging in the order Oier → Eleder → Ekaitz.
