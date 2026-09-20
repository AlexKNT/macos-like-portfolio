import { defineConfig, devices } from '@playwright/test'

/** Its own port, so a run never fights the dev server you have open on 5173. */
const PORT = 4174
const BASE_URL = `http://127.0.0.1:${PORT}`

/**
 * End to end configuration: the app is exercised in a real browser, one project
 * (Chromium) to keep the check fast. The suite owns its server, starting one and
 * stopping it again, unless a run is already serving that port.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  timeout: 20_000,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
  },
})
