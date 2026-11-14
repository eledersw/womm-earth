# VERDICT TEMPLATES and partner grounding rules

**Owner:** Methods lead, with the Story lead for tone. **Due:** H11. **Used by:** Coder C, for the template verdict (always shown) and Claude's system prompt.

Placeholders: `{variable}` `{region}` `{period}` `{season}` `{slope}` `{unit}` `{total_change}` `{pct}` `{p}` `{test}` `{years_needed}` `{n_years}`

## Verdict wording (draft; edit freely)

| Tier | Student | Scientist |
|---|---|---|
| **Confirmed** | "Over {period}, {variable} in {region} has been rising/falling by about {slope} {unit} per decade. That's a real trend: random ups and downs would rarely produce a pattern this strong (p = {p})." | "{test}: Sen's slope {slope} {unit}/decade (95% CI …), p = {p}, n = {n_years} yearly values; OLS with AR(1)-adjusted SE agrees/disagrees." |
| **Not proven yet** | "{variable} in {region} seems to be rising/falling, but the evidence isn't strong enough to be sure yet. At this rate, about {years_needed} more years of data could settle it." | "Suggestive but not significant at α = 0.05 (p = {p}). Estimated detection time at the current slope and noise: ≈{years_needed} more years." |
| **No case** | "We can't see a clear trend in {variable} for {region} over {period}. The ups and downs look like natural variation." | "No detectable monotonic trend (p = {p}). This doesn't rule out a small trend hidden by variability." |
| **Too short to judge** | "There aren't enough years of data here to judge a trend. Try a longer period." | "Fewer than the minimum {min_years} valid yearly values." |
| *Tests disagree (badge)* | "Our two tests don't agree here, so treat this with caution." | "MK and OLS-AR(1) disagree at α = 0.05; the verdict follows MK." |

## Misconceptions the wording must avoid

- "Not significant" means *we can't be sure yet*. It never means *nothing is changing*.
- A small p-value tells us the trend is unlikely to be chance. It says nothing about *why* it is happening.
- Two variables trending together are not necessarily connected (correlation ≠ causation).
- A regional average can hide places inside the region that move the opposite way.
- _add more_

## Partner grounding rules (go verbatim into Claude's system prompt)

1. Every number you state must come from a tool result in this conversation. If you don't have it, call a tool or say you don't know.
2. Name the test behind any claim of significance (e.g. "Mann-Kendall, p = 0.01").
3. Never describe a "Not proven yet" or "No case" verdict as "no change".
4. Physical explanations ("why") come only from process cards (`get_process_card`). If none applies, say so and label anything further as general knowledge.
5. Separate what the data shows from what may cause it.
6. Match the reading level: Student means short sentences and no jargon without a definition; Scientist means test names, CIs and caveats.
7. _add or edit_
