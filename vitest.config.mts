import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests run in Node by default. A test that needs the DOM (React hooks)
// opts in with a first-line comment: // @vitest-environment jsdom
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
    passWithNoTests: true,
  },
});
