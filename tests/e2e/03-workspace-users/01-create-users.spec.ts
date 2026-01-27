/**
 * User Creation Tests - creates users and saves auth states
 *
 * These tests run in PARALLEL after workspace setup.
 * Each test:
 *   1. Uses owner's auth state (logged in as owner)
 *   2. Creates one user via Settings > Users
 *   3. Logs in as that user
 *   4. Saves auth state for use by other tests
 */

import { test, expect, chromium } from '@playwright/test';
import { USERS } from '@fixtures/users';
import { createUserViaUI, AUTH_DIR, WORKSPACE_ID } from './helpers';
import * as fs from 'fs';
import * as path from 'path';

// Use owner's auth state - we need to be logged in as owner to create users
test.use({ storageState: '.auth/owner.json' });

// Generate a test for each user
for (const user of USERS) {
  test(`create ${user.key} user and save auth state`, async ({ page }) => {
    // 1. Create user via UI (already logged in as owner)
    await createUserViaUI(page, user);

    // 2. Login as the new user and save auth state
    // Launch completely isolated browser
    const browser = await chromium.launch({ headless: true });
    const freshContext = await browser.newContext({
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
      storageState: undefined,  // Explicitly no storage state
    });
    const freshPage = await freshContext.newPage();

    // Clear any potential cookies before navigating
    await freshContext.clearCookies();

    // Login
    await freshPage.goto('/account/login');
    await freshPage.waitForLoadState('networkidle');

    // Debug: check if we're on login page
    const url = freshPage.url();
    if (!url.includes('/login')) {
      console.log(`⚠️ Unexpected URL: ${url}, expected login page`);
      // Force navigation to login
      await freshPage.goto('/account/login', { waitUntil: 'networkidle' });
    }

    await freshPage.waitForSelector('form', { timeout: 10000 });
    await freshPage.fill('[data-testid="login-input-wsid"]', WORKSPACE_ID);
    await freshPage.fill('[data-testid="login-input-email"]', user.email);
    await freshPage.fill('[data-testid="login-input-password"]', user.password);
    await freshPage.click('[data-testid="login-button-submit"]');

    await freshPage.waitForFunction(
      () => !window.location.pathname.includes('/login'),
      { timeout: 20000 }
    );
    await freshPage.waitForLoadState('networkidle');

    // Save auth state
    await freshContext.storageState({ path: path.join(AUTH_DIR, `${user.key}.json`) });

    // Cleanup
    await freshPage.close();
    await freshContext.close();
    await browser.close();

    // 3. Verify auth file was created
    const authFile = path.join(AUTH_DIR, `${user.key}.json`);
    expect(fs.existsSync(authFile)).toBe(true);

    console.log(`✅ Created user ${user.key} (${user.roles.join(', ')}) and saved auth state`);
  });
}
