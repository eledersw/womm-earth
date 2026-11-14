"use client";
import { api } from "@/lib/api/client";
import { createCatalogHook } from "./useCatalog";

const useCatalog = createCatalogHook(async () => {
  const { data, error } = await api.GET("/api/py/variables");
  if (error || !data) throw new Error("catalogue unavailable");
  return data;
});
export function useVariables() {
  const { items, ...rest } = useCatalog();
  return { variables: items, ...rest };
}
