import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load .env as fallback (don't override Doppler/shell vars)
dotenv.config({ override: false });

// Stage environment uses HTTP Basic Auth
const isStage = process.env.BASE_URL?.includes('stage.kompot.ai');
const stageHttpCredentials = isStage ? {
  username: process.env.STAGE_HTTP_USER || 'kompot',
  password: process.env.STAGE_HTTP_PASSWORD || 'stage2025!',
} : undefined;

// Check if running in shard mode (auth state already exists)
// When SHARD_MODE=true, skip dependencies since auth is pre-loaded
const isShardMode = process.env.SHARD_MODE === 'true';

// Check if auth files exist (for local development with existing auth)
const authExists = fs.existsSync('.auth/owner.json');

// Skip dependencies if in shard mode OR auth already exists and we're running specific projects
const skipDeps = isShardMode || (authExists && process.env.SKIP_DEPS === 'true');

// Opt-in projects: only included when explicitly requested via --project or env var
const includeAgreements = process.env.INCLUDE_AGREEMENTS === 'true';

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
  // Workers: configurable via env, default 4 locally, 1 in CI
  workers: process.env.PW_WORKERS ? parseInt(process.env.PW_WORKERS) : (process.env.CI ? 1 : 4),
  // Stop on first failure in CI (configurable via command line --max-failures)
  maxFailures: process.env.CI ? 1 : undefined,

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

    // HTTP Basic Auth for stage environment
    ...(stageHttpCredentials && { httpCredentials: stageHttpCredentials }),

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
    // 03a: Workspace Users - create users and save auth states
    {
      name: 'workspace-users-create',
      testDir: './tests/e2e/03-workspace-users',
      testMatch: '01-create-users.spec.ts',
      dependencies: skipDeps ? [] : ['company-owner'],
      fullyParallel: true,  // Can create users in parallel
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/owner.json',
      },
    },
    // 03b: Workspace Users - verify login (must wait for users to be created)
    {
      name: 'workspace-users-verify',
      testDir: './tests/e2e/03-workspace-users',
      testMatch: '02-users-login.spec.ts',
      dependencies: skipDeps ? [] : ['workspace-users-create'],
      fullyParallel: true,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/owner.json',
      },
    },
    // Security: Role-based access control tests
    {
      name: 'security',
      testDir: './tests/e2e/02-security',
      dependencies: skipDeps ? [] : ['workspace-users-create'],
      fullyParallel: false,  // Sequential - login first, then access tests
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    // 04: Contacts - CRUD operations on contacts
    {
      name: 'contacts',
      testDir: './tests/e2e/04-contacts',
      dependencies: skipDeps ? [] : ['company-owner'],
      fullyParallel: false,  // Sequential - CRUD operations can conflict with parallel execution
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/owner.json',
      },
    },
    // 05: Agreements - Templates and Agreements CRUD
    // Opt-in: run with INCLUDE_AGREEMENTS=true or --project=agreements
    ...(includeAgreements ? [{
      name: 'agreements',
      testDir: './tests/e2e/05-agreements',
      dependencies: skipDeps ? [] : ['company-owner'] as string[],
      fullyParallel: false, // Sequential - templates before agreements
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/owner.json',
      },
    }] : []),
    // 06a: Email Campaigns - Email providers, templates, campaigns
    {
      name: 'email-campaigns',
      testDir: './tests/e2e/06-email-campaigns',
      dependencies: skipDeps ? [] : ['company-owner'],
      fullyParallel: false, // Sequential - provider setup first
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/owner.json',
      },
    },
    // 06b: Opportunities - CRUD operations on opportunities
    {
      name: 'opportunities',
      testDir: './tests/e2e/06-opportunities',
      dependencies: skipDeps ? [] : ['company-owner'],
      fullyParallel: true,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/owner.json',
      },
    },
    // 07: Invoices - invoice related entities
    {
      name: 'invoices',
      testDir: './tests/e2e/07-invoices',
      dependencies: skipDeps ? [] : ['company-owner'],
      fullyParallel: true,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/owner.json',
      },
    },
    // 08: Jobs - job related entities
    {
      name: 'jobs',
      testDir: './tests/e2e/08-jobs',
      dependencies: skipDeps ? [] : ['company-owner'],
      fullyParallel: true,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/owner.json',
      },
    },
    // 09: Projects - project management and related entities
    {
      name: 'projects',
      testDir: './tests/e2e/09-projects',
      dependencies: skipDeps ? [] : ['company-owner'],
      fullyParallel: true,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/owner.json',
      },
    },
    // 10: Chat - messaging and chat functionality
    {
      name: 'chat',
      testDir: './tests/e2e/10-chat',
      dependencies: skipDeps ? [] : ['company-owner'],
      fullyParallel: true,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/owner.json',
      },
    },
    // 11: Pipelines - pipeline settings and stages management
    {
      name: 'pipelines',
      testDir: './tests/e2e/10-pipelines',
      dependencies: skipDeps ? [] : ['company-owner'],
      fullyParallel: false, // Sequential - pipelines before stages
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/owner.json',
      },
    },
    // 11: Products - product CRUD and categories
    {
      name: 'products',
      testDir: './tests/e2e/11-products',
      dependencies: skipDeps ? [] : ['company-owner'],
      fullyParallel: true,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/owner.json',
      },
    },
    // 16: Expenses - expense CRUD operations
    {
      name: 'expenses',
      testDir: './tests/e2e/16-expenses',
      dependencies: skipDeps ? [] : ['company-owner'],
      fullyParallel: false,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/owner.json',
      },
    },
    // 17: Refunds - refund CRUD operations
    {
      name: 'refunds',
      testDir: './tests/e2e/17-refunds',
      dependencies: skipDeps ? [] : ['company-owner'],
      fullyParallel: false,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/owner.json',
      },
    },
    // Regression: Bug fixes and regression tests
    {
      name: 'regression',
      testDir: './tests/e2e/regression',
      dependencies: skipDeps ? [] : ['company-owner'],
      fullyParallel: true,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/owner.json',
      },
    },
    // 12: AI Assistant - Internal AI chatbot tests
    {
      name: 'ai-assistant',
      testDir: './tests/e2e/12-ai-assistant',
      dependencies: skipDeps ? [] : ['company-owner'],
      fullyParallel: true,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/owner.json',
      },
    },
    // 13: Payments - payment access and workflows
    {
      name: 'payments',
      testDir: './tests/e2e/13-payments',
      dependencies: skipDeps ? [] : ['company-owner'],
      fullyParallel: false, // Sequential - payment operations depend on each other
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/owner.json',
      },
    },
    // 14: Tasks - CRUD operations on tasks
    {
      name: 'tasks',
      testDir: './tests/e2e/14-tasks',
      dependencies: skipDeps ? [] : ['company-owner'],
      fullyParallel: false, // Sequential - CRUD operations
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/owner.json',
      },
    },
    // 15: Events - event management
    {
      name: 'events',
      testDir: './tests/e2e/15-events',
      dependencies: skipDeps ? [] : ['company-owner'],
      fullyParallel: false,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/owner.json',
      },
    },
    // 19: General Settings - workspace settings
    {
      name: 'general-settings',
      testDir: './tests/e2e/19-general-settings',
      dependencies: skipDeps ? [] : ['company-owner'],
      fullyParallel: false,
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


