# coder-c · Task 5 Explain · H4.1

## Done
- Local branch `ekaitz/task5-explain` from main 45dc58c; no push/PR/merge by agent.
- Added lazy server-only Anthropic client, planned Opus model/fallback, adaptive thinking/low effort, stable SYSTEM and summarized analysis JSON.
- Explain route validates bounded payloads, origin and content type, returns SSE, supports cancellation and sanitizes errors.
- Stream handles refusal, max_tokens, rate limits, API failures and numeric grounding; logs only cache_read_input_tokens as operational metric.
- ExplainBox auto-streams, cancels stale cases/levels, stops/retries, skips too_short and supports canonical demo lookup (JSON initially empty).
- Draft text is labelled as being checked; invalid/partial output is discarded. Template verdict always remains visible.
- Added URL-backed Student/Scientist switch. Prevented Strict Mode effect replay from duplicating requests.

## Decisions made
- No curated process cards exist yet: process-cards.json is [], so prompts prohibit physical explanations; no placeholder facts imported.
- SDK types require spreading FALLBACK.betas into a mutable array; model/fallback settings follow the plan.

## State of things
- Pass: npm run check; 93 Vitest tests; 10 Chromium E2E with mock SDK and official HTTP fixtures. Reviewed offline fallback screenshot.
- User confirms ANTHROPIC_API_KEY exists only in Vercel and explicitly requested deferring real streaming/cache verification.
- Task 5 steps 1/2/4 done; live step 3 and publication/merge step 5 pending. Task 6 not started.
- No Python files changed; scientific data pipeline and production not verified in this task.

## For other roles
- Eleder: confirm Vercel firewall rate limit for /api/partner, Protection Bypass and spend cap before public rollout.
- Sergio/Edur: provide reviewed process cards/persona/copy; numerical checking does not replace scientific review.

## Next step for whoever continues
- User pushes branch, creates PR and merges; then run two identical Explain requests on Vercel and confirm actual text + second cache_read_input_tokens > 0 before closing step 3.
