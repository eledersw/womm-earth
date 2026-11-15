import { describe, expect, it } from "vitest";
import { isWorldRanking } from "./scope";

describe("isWorldRanking", () => {
  it.each([
    "What is the hottest country?",
    "Which country is warming fastest?",
    "Where on Earth is it raining the most?",
    "Rank the countries by temperature change",
    "Top 10 driest places",
    "Show me the trend for every country",
    "List all regions with a confirmed trend",
    "Which state has the strongest warming?",
  ])("blocks %s", (q) => expect(isWorldRanking(q)).toBe(true));

  it.each([
    "Is the Arctic warming faster than the Sahel?",
    "Which of my regions is warming fastest?",
    "Which is drier, Spain or Italy?",
    "Between Spain and Greece, which warmed most?",
    "Is this a real trend, or just natural ups and downs?",
    "What could be causing this change?",
    "Where is the opposite trend happening?",
    "What's the most important caveat here?",
    "Is Wisconsin getting smokier in summer?",
  ])("allows %s", (q) => expect(isWorldRanking(q)).toBe(false));
});
