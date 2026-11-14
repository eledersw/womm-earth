import { defineConfig, devices } from "@playwright/test";

const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    // Reach protected Vercel previews.
    extraHTTPHeaders: bypass ? { "x-vercel-protection-bypass": bypass } : {},
    // WebGL in headless Chromium (the globe) needs SwiftShader.
    launchOptions: {
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--use-gl=swiftshader"],
    },
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
