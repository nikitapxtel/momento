import { defineConfig, devices } from '@playwright/test'

// End-to-end tests run against a production build in demo mode (no backend needed).
const port = 4173
const chromePath = process.env.CHROME_PATH

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${port}/momento/`,
    trace: 'retain-on-failure',
    launchOptions: chromePath ? { executablePath: chromePath } : {},
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 960 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npx vite build && npx vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}/momento/`,
    reuseExistingServer: !process.env.CI,
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
    timeout: 120_000,
  },
})
