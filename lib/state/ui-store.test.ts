import { beforeEach, describe, expect, it } from "vitest";
import { useUiStore } from "./ui-store";

const initial = useUiStore.getState();

describe("ui-store", () => {
  beforeEach(() => useUiStore.setState(initial, true));

  it("starts with nothing highlighted, hovered or focused", () => {
    const s = useUiStore.getState();
    expect(s.hoveredRegion).toBeNull();
    expect(s.focus).toBeNull();
    expect(s.highlight).toEqual({ kind: null, regions: [], arcFrom: null });
  });

  it("clearHighlight resets kind and regions", () => {
    useUiStore.getState().setHighlight({ kind: "mirror", regions: ["NR-MED"], arcFrom: "NR-SAHEL" });
    expect(useUiStore.getState().highlight.kind).toBe("mirror");
    useUiStore.getState().clearHighlight();
    expect(useUiStore.getState().highlight).toEqual({ kind: null, regions: [], arcFrom: null });
  });

  it("flyTo sets focus and setHoveredRegion sets hover", () => {
    useUiStore.getState().flyTo({ lat: 44.5, lng: -89.5, altitude: 0.8 });
    useUiStore.getState().setHoveredRegion("US-WI");
    expect(useUiStore.getState().focus).toEqual({ lat: 44.5, lng: -89.5, altitude: 0.8 });
    expect(useUiStore.getState().hoveredRegion).toBe("US-WI");
  });
});
