# coder-c · Task 6 Partner chat · H5.7

## Done
- Local branch `ekaitz/task6-partner-chat` from origin/main 4011f19; no push or merge.
- Added 7 betaZodTool tools: list_variables, analyze_case, correlate, find_mirror, scan_region, get_process_card, propose_case.
- Tools validate identifiers/periods/months, use fixed typed API paths, summarize arrays away, sanitize failures and emit call/result events; proposals validate every id before clamping to 4.
- Chat route uses same-origin serverApi, server-only Vercel bypass header, 20 text messages max, 6 SDK iterations/16000 tokens, 20 tool invocations, bounded outputs and abort/timeout signals.
- PartnerChat: ephemeral history, starters, tool progress, streamed drafts, numeric checks, cancellation and explicit Open this case; history persists between tabs.
- Refusal/limits/unsupported numbers discard the draft; proposals are only exposed after a successful turn.
- Fixed Coder C regressions introduced by PR #16: manual Calculate stays explicit; no set-state-in-effect lint; tests updated to submit explicitly and support dynamic provider availability.
- Explain validation no longer treats empty live-provider valid_variables as unavailable.

## State of things
- Pass: npm run check; 124 Vitest tests; 12 Chromium E2E with mocks/official HTTP fixtures; chat screenshot reviewed.
- Tests cover the SDK runner invoking actual analyze/propose tools, fixed backend payloads, summary shape, errors, cancellation, history and proposal acceptance.
- Live Claude/tool smoke remains pending in Vercel (key only there). Process cards are empty; physical explanations are prohibited. No Task 7 started.
- Python CI remains Oier's issue per STATUS; no Python or generated-contract files changed.
- Shell header has pre-existing ~2px overflow at 390px (Eleder); E2E checks owned panel bounds/content separately.

## For other roles
- Eleder: web-side regressions fixed locally; Python check still needs Oier. Confirm firewall/bypass/spend cap before rollout.
- Sergio/Edur: curated process cards and copy still pending.

## Next step for whoever continues
- User publishes branch and handles PR/merge; then ask "Is Wisconsin getting smokier in summer?" on Vercel, verify actual tool calls and explicit proposal. Keep Step 4 open until real smoke/integration succeeds.
