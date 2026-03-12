import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 1,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
  ],
  timeout: 15_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: "http://127.0.0.1:1420",
    browserName: "chromium",
    hasTouch: true,
    trace: "on-first-retry",
    video: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "bun run dev",
    url: "http://127.0.0.1:1420",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium-kiosk",
      use: {
        viewport: {
          width: 1920,
          height: 1080,
        },
      },
    },
    {
      name: "chromium-compact",
      testMatch: "**/smoke.spec.ts",
      use: {
        viewport: {
          width: 820,
          height: 1180,
        },
      },
    },
  ],
});
