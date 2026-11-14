import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { outsideArea, parseAreas } from "./check-ownership.mjs";

const areas = parseAreas(readFileSync("docs/process/OWNERSHIP.md", "utf8"));

describe("check-ownership", () => {
  it("parses all three areas, including multi-file lines", () => {
    expect(Object.keys(areas).sort()).toEqual(["Ekaitz", "Eleder", "Oier"]);
    expect(areas.Eleder).toContain("package.json");
    expect(areas.Eleder).toContain("next.config.ts");
    expect(areas.Oier).toContain("api/**");
    expect(areas.Oier).toContain("scripts/case_cli.py");
    expect(areas.Ekaitz).toContain("app/api/partner/**");
  });

  it("ignores parenthesised comments", () => {
    expect(areas.Eleder.some((g: string) => g.startsWith("("))).toBe(false);
  });

  it("flags files outside the owner's area and skips docs", () => {
    const files = ["api/_engine/trend.py", "components/globe/Globe.tsx", "docs/STATUS.md"];
    expect(outsideArea(files, areas.Oier)).toEqual(["components/globe/Globe.tsx"]);
  });

  it("accepts files inside the area", () => {
    expect(outsideArea(["components/panel/steps/LeadStep.tsx", "lib/partner/sse.ts"], areas.Ekaitz)).toEqual([]);
  });
});
