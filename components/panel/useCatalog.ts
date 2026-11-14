"use client";

import { useCallback, useEffect, useState } from "react";
import { caseCopy } from "@/lib/copy/case";

// A single successful catalogue fetch per browser session, shared across mounts.
export function createCatalogHook<T extends { id: string }>(load: () => Promise<T[]>) {
  let request: Promise<T[]> | undefined;
  return function useCatalog() {
    const [data, setData] = useState<T[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const retry = useCallback(() => { setError(null); setAttempt((n) => n + 1); }, []);
    useEffect(() => {
      let disposed = false;
      request ??= load().catch((cause) => { request = undefined; throw cause; });
      void request.then(
        (items) => { if (!disposed) setData(items); },
        () => { if (!disposed) setError(caseCopy.error); },
      );
      return () => { disposed = true; };
    }, [attempt]);
    return { items: data ?? [], byId: Object.fromEntries((data ?? []).map((item) => [item.id, item])), loading: !data && !error, error, retry };
  };
}
