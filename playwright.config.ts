import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load .env and OVERRIDE existing shell env vars
dotenv.config({ override: true });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  globalSetup: './global-setup.ts',
  testDir: './tests',

  // Maximum time one test can run for
  timeout: 30 * 1000,

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Limit workers to prevent overwhelming the remote server
  workers: process.env.CI ? 1 : 4,

  // Reporter configuration
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  // Shared settings for all projects
  use: {
    // Base URL for all tests (required)
    baseURL: process.env.BASE_URL,

    // Viewport size to support Tailwind 2xl breakpoint (≥1536px)
    viewport: { width: 1920, height: 1080 },

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Maximum time each action can take
    actionTimeout: 10 * 1000,

    // Navigation timeout
    navigationTimeout: 15 * 1000,
  },

  // Configure projects - sequential flow
  projects: [
    // 01: Super admin login (platform bootstrap)
    {
      name: 'super-admin',
      testDir: './tests/e2e/01-super-admin',
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
    },
    // 02: Company Owner - registration + workspace creation + platform actions
    {
      name: 'company-owner',
      testDir: './tests/e2e/02-company-owner',
      dependencies: ['super-admin'],
      fullyParallel: false,  // Sequential - uses test.describe.serial
      use: { ...devices['Desktop Chrome'] },
    },
    // 03: Workspace Users - owner creates users + users verify login
    {
      name: 'workspace-users',
      testDir: './tests/e2e/03-workspace-users',
      dependencies: ['company-owner'],
      fullyParallel: false,  // Sequential - create users first, then verify
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/owner.json',
      },
    },
  ],

  // Run your local dev server before starting the tests
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
