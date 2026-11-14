"use client";
import type { Region } from "@/lib/api/types";
import { api } from "@/lib/api/client";
import { createCatalogHook } from "./useCatalog";

const useCatalog = createCatalogHook(async () => {
  const { data, error } = await api.GET("/api/py/regions");
  if (error || !data) throw new Error("catalogue unavailable");
  // openapi-fetch widens fixed-length tuples while parsing JSON.
  return data as Region[];
});
export function useRegions() {
  const { items, ...rest } = useCatalog();
  return { regions: items, ...rest };
}
