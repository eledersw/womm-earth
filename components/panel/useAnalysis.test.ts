// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { DEFAULT_CASE } from "@/lib/state/case-codec";
import fixture from "@/api/_fixtures/analyze.json";
import { api } from "@/lib/api/client";
import { useAnalysis } from "./useAnalysis";

vi.mock("@/lib/api/client", () => ({ api: { POST: vi.fn() } }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

it("useAnalysis aborts stale requests", async () => {
  const pending: { signal: AbortSignal; resolve: (value: unknown) => void }[] = [];
  vi.mocked(api.POST).mockImplementation(((_path: unknown, options: { signal: AbortSignal }) =>
    new Promise<unknown>((resolve) => pending.push({ signal: options.signal, resolve }))) as unknown as typeof api.POST);
  const first = { ...DEFAULT_CASE, regions: ["US-WI"], from: 2002 };
  const { result, rerender } = renderHook((state) => useAnalysis(state), { initialProps: first });
  await waitFor(() => expect(pending).toHaveLength(1));
  rerender({ ...first, from: 2003 });
  expect(result.current.data).toBeNull();
  await waitFor(() => expect(pending).toHaveLength(2));
  expect(pending[0].signal.aborted).toBe(true);
  const latest = { ...fixture, case: { ...fixture.case, start: 2003 } };
  await act(async () => pending[1].resolve({ data: latest }));
  expect(result.current.data).toEqual(latest);
  await act(async () => pending[0].resolve({ data: fixture }));
  expect(result.current.data).toEqual(latest);
});

it("skips empty scenes", () => {
  const { result } = renderHook(() => useAnalysis(DEFAULT_CASE));
  expect(api.POST).not.toHaveBeenCalled();
  expect(result.current).toMatchObject({ data: null, error: null, loading: false });
});

it("reuses completed analysis across reading levels and aborts on unmount", async () => {
  vi.mocked(api.POST).mockResolvedValue({ data: fixture } as unknown as Awaited<ReturnType<typeof api.POST>>);
  const state = { ...DEFAULT_CASE, regions: ["ESP"], from: 2005 };
  const { result, rerender, unmount } = renderHook((current) => useAnalysis(current), { initialProps: state });
  await waitFor(() => expect(result.current.data).toEqual(fixture));
  rerender({ ...state, level: "scientist" });
  expect(api.POST).toHaveBeenCalledTimes(1);
  unmount();
  const cached = renderHook(() => useAnalysis(state));
  expect(cached.result.current.data).toEqual(fixture);
  expect(api.POST).toHaveBeenCalledTimes(1);
  cached.unmount();
  let signal: AbortSignal | undefined;
  vi.mocked(api.POST).mockImplementation(((_path: unknown, options: { signal: AbortSignal }) => {
    signal = options.signal;
    return new Promise<unknown>(() => {});
  }) as unknown as typeof api.POST);
  const pending = renderHook(() => useAnalysis({ ...state, from: 2006 }));
  await waitFor(() => expect(signal).toBeDefined());
  pending.unmount();
  expect(signal?.aborted).toBe(true);
});

it("reports errors without leaking backend details and supports retry", async () => {
  vi.mocked(api.POST).mockRejectedValueOnce(new Error("private backend details"))
    .mockResolvedValueOnce({ data: fixture } as unknown as Awaited<ReturnType<typeof api.POST>>);
  const { result } = renderHook(() => useAnalysis({ ...DEFAULT_CASE, regions: ["USA"], from: 2010 }));
  await waitFor(() => expect(result.current.error).not.toBeNull());
  expect(result.current.error).not.toContain("private");
  expect(result.current.data).toBeNull();
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.data).toEqual(fixture));
  expect(result.current.error).toBeNull();
});
