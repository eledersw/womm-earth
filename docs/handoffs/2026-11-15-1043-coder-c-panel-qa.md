# coder-c · panel QA and correlation availability · H22.7

## Done
- H8 panel polish: Verdict before Evidence, compact healthy cards with reviewed methods in details; critical notices stay expanded.
- Opaque footer, accessible search, X/pen Scene chips; lazy charts, 260px plots and axis-label space.
- Controlled flat-OLS CI-band alignment regression; historical production fits still require Methods review.
- Correlation UI and Partner return unavailable, preventing requested-Case claims from the backend fixture.
- STATUS/own plan/Claude architecture updated; stale joint CI blocker resolved (web/api green on f0cabfe).

## Decisions made
- Private capability gate stays false until Oier delivers live correlation and Sergio reviews it; no HTTP seam changes.
- Preserve fresh Investigate requests per PROJECT.md; Lead must resolve conflicting cache request.
- User Git rules prevail: feature branch only, no push/PR/merge; all docs travel with this branch.

## State of things
- Branch ekaitz/panel-qa-polish, rebased onto afee5a2 (#53 POWER transient retry).
- npm run check passed; 219 Vitest; 22 Chromium E2E passed, one opt-in live Claude test skipped.
- Python 3.12: 73 passed, one upstream regionmask deprecation warning; EVAL dry-run 20/20 both levels, no API calls.
- Key only in Vercel; real Claude checks remain deferred per user. Tours/cache are still empty; no eval score claimed.

## For other roles
- Oier: real correlation + inclusive q=0.05 mirror cutoff. Sergio: serving-deployment/map QA, demo/eval approval.
- Eleder: shared components/ui/checkbox.tsx, cache-policy decision and production rate limit. Edur: approved tour captions.

## Next step for whoever continues
- User pushes ekaitz/panel-qa-polish and handles PR/merge; then integrate approved captions or live correlation when supplied.
- With live checks authorized and a reviewed serving revision: generate demo texts for approval and capture/manual-score EVAL.
