import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import cards from "./process-cards.json";
import { SYSTEM } from "./prompts";
it("preserves Sergio's reviewed text, applicability, conditions, misconceptions and source citations", () => {
  const source = readFileSync("docs/science/PROCESS_CARDS.md", "utf8");
  expect(cards).toHaveLength(10);
  expect(new Set(cards.map((c) => c.id)).size).toBe(10);
  for (const card of cards) {
    const section = source.split(`## ${card.id}: `)[1].split(/\n## /)[0];
    expect(section.startsWith(card.title)).toBe(true);
    const student = section.split("**Student version:**")[1].split("**Scientist version:**")[0].trim();
    const scientist = section.split("**Scientist version:**")[1].split("**Citations:**")[0].trim();
    expect(card.student.startsWith(student)).toBe(true);
    expect(card.scientist.startsWith(scientist)).toBe(true);
    const when = section.match(/- Use when: (.+)/)![1];
    const avoid = section.split("**Common misconception to avoid:**")[1].trim();
    for (const text of [card.student, card.scientist]) { expect(text).toContain(when); expect(text).toContain(`Do not claim: ${avoid}`); }
    expect(card.applies_to.variables.join(", ")).toBe(section.match(/- Applies to \(variables\): (.+)/)![1]);
    expect(card.applies_to.regions.join(", ")).toBe(section.match(/- Applies to \(regions\): (.+)/)![1]);
    expect(card.citations.length).toBeGreaterThan(0);
    for (const citation of card.citations) expect(section).toContain(`[${citation.title}](${citation.url})`);
  }
});
it("covers all selected FINAL and BACKUP demo candidates without treating cards as case attribution", () => {
  for (const [id, variable, region] of [
    ["regional-warming", "T2M", "US-CO"],
    ["southwest-soil-moisture", "GWETROOT", "US-AZ"],
    ["snow-depth-and-season", "SNODP", "US-WI"],
    ["smoke-aod", "AOD_55", "US-WI"],
    ["precipitation-variability", "PRECTOTCORR", "US-WI"],
  ]) {
    const card = cards.find((c) => c.id === id)!;
    expect(card.applies_to.variables).toContain(variable);
    expect(card.applies_to.regions).toContain(region);
  }
  expect(SYSTEM).toContain("Keep the engine's reported verdict distinct from scientific approval");
  expect(SYSTEM).toContain("Significance establishes neither");
});
