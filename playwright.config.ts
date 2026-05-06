import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/*.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }]
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    launchOptions: {
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-setuid-sandbox']
    }
  },
  projects: [
    {
      name: 'chromium',
      use: {
        launchOptions: {
          executablePath: '/Users/liuyang/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell',
          args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-setuid-sandbox']
        }
      }
    }
  ]
})
