import { defineConfig } from '@playwright/test';

const baseURL = process.env.PKA2XML_TEST_BASE_URL || 'http://127.0.0.1:3108';

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: '../test-results/browser-results.json' }]],
  outputDir: '../test-results/browser',
  use: {
    baseURL,
    browserName: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
    launchOptions: {
      executablePath: process.env.PKA2XML_CHROMIUM_EXECUTABLE || undefined,
    },
  },
  webServer: process.env.PKA2XML_TEST_BASE_URL ? undefined : {
    command: 'npm run start -- --hostname 127.0.0.1 --port 3108',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
