# EVAL: partner accuracy test

**Owner:** Methods lead (writes and scores). **Runs with:** Coder C (the number-check harness). **Written by:** H22. **Run:** H22–H24. The score goes in `docs/STATUS.md`.

A question **passes** only if **all** of these hold:
- every number matches the tool output;
- the key facts are present;
- nothing on the "must not say" list appears;
- the reading level fits.

| # | Question (as a user would type it) | Case context | Key facts the answer must contain | Must not say | Pass? | Notes |
|---|---|---|---|---|---|---|
| 1 | Are Wisconsin summers getting smokier? | Case 1 | The direction, the slope per decade, the verdict tier, the test name | "climate change causes this" stated as fact | | |
| 2 | Is this caused by climate change? | Case 1 | That the data shows a trend, not its cause; cites the smoke-aod process card; hedges | A causal certainty | | |
| 3 | What does "not proven yet" mean? | any | Evidence insufficient yet; years until significant; not the same as no change | "There is no trend" | | |
| 4 | _fill_ | | | | | |
| … | _write 20 in total: 6 factual, 4 causal "why", 4 statistical-concept, 3 correlation, 3 trick questions (e.g. asking for a number it can't have)_ | | | | | |

**Score:** ___ / 20 · **Run on:** ___ · **Fixes made:** ___
