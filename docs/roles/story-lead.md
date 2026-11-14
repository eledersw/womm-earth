# Playbook: Story & Submission lead

**Mission:** make Presentation and Impact a 5, and make sure we submit everything correctly and on time. You turn the team's work into the project page, the slides, the video and every word in the app, and you speak for the student who will use it.
**Carries:** Presentation, Impact.
**Owns (all under `docs/pitch/`):**
- `SUBMISSION_CHECKLIST.md`
- `BRAND_BRIEF.md`
- `COPY.md` (every user-facing string)
- `PROJECT_PAGE.md`
- `DEMO_SCRIPT.md` (including the tour captions)
- `USER_TEST.md`
- `JUDGES_QA.md`
- the slides, the video, and the banner/thumbnail

**How you work:**
- Open Claude Code in the repo, run `/resume story-lead`, then say *"help me with step N"*.
- Commit only inside `docs/pitch/`; Claude can commit and push for you.
- You work as a pair with the Methods lead. They own scientific correctness; you own clarity and story. Run every statistical sentence past them.
- End with `/handoff story-lead`.

**Inputs you need:**

| What | From | By |
|---|---|---|
| `DATA_CATALOG.md` definitions | Methods lead | H6 |
| `DEMO_CASES.md` | Methods lead | H8 |
| A build for the user test | Lead | H13 |
| Screenshots | Lead | H18 and H26 |
| Validity slide content | Methods lead | H22 |

**Outputs others need:**

| What | To | By |
|---|---|---|
| Submission rules + deadline | everyone (in STATUS) | **H1** |
| `BRAND_BRIEF.md` | Lead | **H2** |
| `COPY.md` | Coder C | **H5** |
| Tour captions | Coder C | H10 |
| User-test fixes | Lead, Coder C | H14 |
| Copy & consistency QA list | Lead, Coder C | **H24** |

## Steps

- [ ] **H0–H1: submission recon.**
  - Find this event's Space Apps rules and the submission form, and record each of these in `SUBMISSION_CHECKLIST.md`:
    - deadline + time zone;
    - required fields (title, summary, demo link, repo link);
    - video and slide limits (length, format);
    - AI-use disclosure;
    - NASA data attribution;
    - team members;
    - whether the URL must stay live after judging.
  - Give each item an owner and a due hour. Correct the **Deadline** line at the top of `docs/STATUS.md`.
  - *Ask Claude:* "Help me find the NASA Space Apps 2026 submission requirements and turn them into SUBMISSION_CHECKLIST.md."
  - **Done when:** the Lead has read the checklist and the deadline in STATUS is official.

- [ ] **H1–H2: brand brief.**
  - Fill in `BRAND_BRIEF.md`: 3 name options (the team votes at H2), a one-line pitch, the tone of voice, 3–5 visual references with what you like about each, and mood words.
  - *Ask Claude (ui-ux-pro-max:brand):* "Propose names and a tone of voice for a data-detective app for students, based on docs/PROJECT.md."
  - **Done when:** the name vote has happened and the brief is with the Lead.

- [ ] **H3–H4: design direction session.** Sit with the Lead while they run `impeccable` and `ui-ux-pro-max`. Your job is to pick between the options against your brief.
  - **Done when:** a direction is chosen and written down.

- [ ] **H2–H5: `COPY.md`, every word in the app.**
  - Fill in each section: the partner's onboarding questions, the 5 step labels + helper text, the variable-card template, verdict tier names and badges, tooltips for statistical terms, empty/error states, and the About page.
  - Co-write the statistical tooltips with the Methods lead.
  - Keep sentences short, use the glossary words from `docs/PROJECT.md`, and pitch it at a curious 16-year-old.
  - **Done when:** every section is filled and Coder C has been told.

- [ ] **H4–H8: `PROJECT_PAGE.md` v1.**
  - Follow the section structure in the file, which mirrors the submission form; adjust it to the real form after the H1 recon.
  - Leave the science section to the Methods lead.
  - *Ask Claude (docs):* "Draft PROJECT_PAGE.md from docs/PROJECT.md and docs/ARCHITECTURE.md in plain language."
  - **Done when:** v1 is complete except for screenshots and the science section.

- [ ] **H8–H10: demo script and tour captions.**
  - From the Methods lead's final 3 cases, write `DEMO_SCRIPT.md`:
    - a 3-minute live demo (who says what, what is clicked);
    - a 30–60 s video storyboard (shot list);
    - tour captions for each case (1–2 sentences per step).
  - Tell Ekaitz when the captions are ready; he converts them into `lib/tour/tours.json`. App code is his area, so don't write it yourself.
  - **Done when:** the script is timed and Coder C has the captions.

- [ ] **H10–H12: slides v1.**
  - Build the deck with `ui-ux-pro-max:slides` or a Slides artifact, using the brand tokens. Suggested order:
    1. title;
    2. the problem (the 5 steps, and "the same process, opposite trends");
    3. the demo moments;
    4. how it works;
    5. validity (from the Methods lead);
    6. impact;
    7. team;
    8. what's next.
  - Use screenshot placeholders for now.
  - **Done when:** v1 exists and follows `DEMO_SCRIPT.md`.

- [ ] **H12–H14: user test.**
  - Recruit 2–3 people outside the team at the venue, ideally students, and run the script in `USER_TEST.md`.
  - Observe silently and note where they hesitate or misread; the Methods lead watches for statistical misreadings.
  - Turn the findings into the top 5 fixes, each posted in STATUS with an owner.
  - **Done when:** the fixes are in STATUS before H14.

- [ ] **H14–H18: sleep.**

- [ ] **H18–H22: pitch block with the Methods lead.** The Lead and Coder C are asleep, so this is the two of you.
  - **Slides v2:** real screenshots from `docs/pitch/screenshots/` or production, plus the validity slides.
  - **`JUDGES_QA.md`:** 20 likely questions with answers; the Methods lead answers the science ones.
  - **`PROJECT_PAGE.md` v2.**
  - **Banner/thumbnail:** `ui-ux-pro-max:banner-design`.
  - **Final video storyboard.**
  - **Done when:** the slides are complete, the Q&A doc is done and the project page is final apart from the links.

- [ ] **H22–H24: copy & consistency QA.**
  - Go through the production app against `COPY.md` and the brief: typos, inconsistent terms, unclear labels, anything a student would trip on.
  - **Done when:** the list is in STATUS for the Lead and Coder C **before the H26 freeze**.

- [ ] **H24–H27: video.**
  - Screen-record the storyboard (OBS or the OS recorder) and/or have the Lead run `brag`, which builds a polished launch video from the codebase.
  - Add captions; voiceover is optional. Export it within the limits from the H1 recon.
  - **Done when:** the final file is exported and the team has watched it once.

- [ ] **H26–H28: rehearse.** Do the live pitch twice with the Methods lead, timing it against the rules.

- [ ] **H27–H29: submit.**
  - Finalize the project page, upload the video and slides, and fill in the form.
  - Tick every item on `SUBMISSION_CHECKLIST.md` with the Lead.
  - **Done when:** submitted **by H29** and the receipt is confirmed. Screenshot the receipt.

## If you're blocked

- **No demo cases yet at H8:** write the script around Case #1 (Wisconsin smoke, NASA's own example) and leave slots for the other two.
- **No build for the user test:** test with the slides and the stub app, asking about wording and verdict names.
- **Spare time:** improve `JUDGES_QA.md`, write social posts, or make the banner.
