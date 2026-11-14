// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { createCatalogHook } from "./useCatalog";

afterEach(cleanup);
it("shares one successful request across catalogue consumers", async () => {
  const load = vi.fn().mockResolvedValue([{ id: "T2M" }]);
  const useCatalog = createCatalogHook<{ id: string }>(load);
  const first = renderHook(useCatalog);
  const second = renderHook(useCatalog);
  await waitFor(() => expect(second.result.current.loading).toBe(false));
  expect(first.result.current.byId.T2M).toEqual({ id: "T2M" });
  expect(load).toHaveBeenCalledTimes(1);
});
it("allows retry after a failed catalogue request", async () => {
  const load = vi.fn().mockRejectedValueOnce(new Error("private"))
    .mockResolvedValueOnce([{ id: "US-WI" }]);
  const useCatalog = createCatalogHook<{ id: string }>(load);
  const { result } = renderHook(useCatalog);
  await waitFor(() => expect(result.current.error).not.toBeNull());
  expect(result.current.error).not.toContain("private");
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.byId["US-WI"]).toBeDefined());
  expect(result.current.error).toBeNull();
});
