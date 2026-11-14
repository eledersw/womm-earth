// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { withNuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import { describe, expect, it } from "vitest";
import { useCase } from "./use-case";

function setup(searchParams = "") {
  const updates: UrlUpdateEvent[] = [];
  const hook = renderHook(() => useCase(), {
    wrapper: withNuqsTestingAdapter({ searchParams, onUrlUpdate: (e) => updates.push(e) }),
  });
  return { hook, updates };
}

describe("useCase", () => {
  it("reads the case from the URL, normalised", () => {
    const { hook } = setup("?v=T2M&r=USA,US-WI,USA&from=2020&to=1990&s=JJA");
    expect(hook.result.current.state).toMatchObject({
      variable: "T2M",
      regions: ["US-WI", "USA"],
      from: 1990,
      to: 2020,
      season: "JJA",
      level: "student",
    });
  });

  it("setCase merges a patch, normalises, and replaces history", async () => {
    const { hook, updates } = setup("?v=T2M&r=USA");
    await act(async () => hook.result.current.setCase({ regions: ["US-WI", "USA", "US-WI"] }));
    expect(hook.result.current.state.regions).toEqual(["US-WI", "USA"]);
    expect(hook.result.current.state.variable).toBe("T2M");
    // nuqs flushes URL writes on a short throttle
    await waitFor(() => expect(updates.length).toBeGreaterThan(0));
    const last = updates.at(-1)!;
    expect(last.searchParams.get("r")).toBe("US-WI,USA");
    expect(last.options.history).toBe("replace");
  });

  it("replaceCase drops custom months when the season is not CUSTOM", async () => {
    const { hook } = setup("?v=T2M&s=CUSTOM&m=6,7,8");
    expect(hook.result.current.state.months).toEqual([6, 7, 8]);
    await act(async () =>
      hook.result.current.replaceCase({ ...hook.result.current.state, season: "DJF", months: [6, 7, 8] }),
    );
    expect(hook.result.current.state.season).toBe("DJF");
    expect(hook.result.current.state.months).toBeNull();
  });
});
