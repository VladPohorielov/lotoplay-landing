// Playwright config for local smoke tests
const { devices } = require('@playwright/test')

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  testDir: './tests',
  timeout: 30 * 1000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10 * 1000,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
  ,
  webServer: {
    command: 'npm run serve',
    url: 'http://127.0.0.1:5173',
    timeout: 30 * 1000,
    reuseExistingServer: true
  }
}
