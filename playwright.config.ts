import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  // Tests share one database, so run them one at a time for determinism.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Production build against a fresh in-memory Postgres (PGlite) per run.
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    env: {
      // Always the throwaway in-memory DB, even if .env.local has a real DATABASE_URL.
      DATABASE_URL: "",
      PGLITE_DIR: "memory://",
      ADMIN_EMAIL: "admin@e2e.test",
      ADMIN_PASSWORD: "e2e-admin-password",
      // Turns the AI box on; the e2e test mocks /api/ai/parse, so no real call is made.
      ANTHROPIC_API_KEY: "e2e-placeholder",
    },
  },
});
