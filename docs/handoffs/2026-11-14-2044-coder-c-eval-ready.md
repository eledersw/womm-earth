# coder-c · EVAL readiness / Methods follow-up · H8.7

## Done
- Branch ekaitz/methods-handoff-update from b42f471; rebased onto main 9a7a8d7 (science pack #42, METHODS/contract #44, shell polish #43, dev launcher #45).
- Sergio's 20/20 explicit questions resolve offline at both reading levels, independent of the empty tour collection.
- Real eval runs will save full answers, named tool evidence, rubric, partial/error history and timestamps under lib/partner/eval-runs; no overwrites, no automatic scientific score.
- Remote revision/model/settings are not exposed in SSE; optional --revision is caller-supplied, not verified by the harness.
- Fixed ignored showExplanation=false and added evidence checks before every Explain cache/stream entry point, including the separate pane. Removed redundant visible heading, kept accessible label.
- Added regression checks from archived Sergio B2/B3; no production recheck claimed. Nullable OLS/CI/agree and missing chart bands are supported/tested.
- Shared displayUnit is consumed for provider C units; dimensionless magnitudes remain visible.
- Check + 214 Vitest + 22 Chromium E2E pass; one real-Claude E2E skipped.
- Isolated Python 3.12 /tmp/womm-coder-c-validation: 71 pytest pass, including active golden key; no backend files changed.

## State of things
- Source questions are ready. Actual live eval and Sergio's manual score/approval are not performed.
- tours.json remains []; demo-explanations.json remains {}. Edur captions are still placeholders.
- Engine fixes merged #44; earlier failed gate is historical evidence. Repaired deployment identity and scientific re-review remain pending.
- Key only in Vercel; user deferred live Claude checks. No generated text, score or validity approval invented.
- scripts/run-eval.ts wrapper is still uncreated pending ownership authorization; CLI is lib/partner/run-eval.ts.
- Remaining Lead H8 layout/performance requests stay queued; no other owner's files modified.

## Next step
- User publishes this branch and handles PR/merge. Await approved captions and scientific/deployment review before demos; arrange actual eval with Sergio when live checks resume.
- Preflight: npx tsx lib/partner/run-eval.ts --dry-run. Real run: --base URL [--output NAME.json] [--revision VERIFIED_REVISION].
- Repeat backend QA with /tmp/womm-coder-c-validation/bin/python -m pytest -q. Environment is temporary; dev servers stopped after verification.
