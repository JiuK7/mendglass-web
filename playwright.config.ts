import { defineConfig, devices } from "@playwright/test";

const port = 3000;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Tests run against the production build, so run `pnpm build` first.
  webServer: {
    command: `pnpm start --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    // A production build refuses to start without SITE_ENV (src/lib/env.ts).
    // The tests run as a preview, so enquiries go to the test sink. Set here
    // rather than in CI, so local runs and CI start the server the same way.
    env: { SITE_ENV: "preview" },
  },
});
