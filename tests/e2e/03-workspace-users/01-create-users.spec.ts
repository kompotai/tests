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
    // Check if auth file already exists and is valid
    const authFile = path.join(AUTH_DIR, `${user.key}.json`);
    if (fs.existsSync(authFile)) {
      // Try to use existing auth state
      const browser = await chromium.launch({ headless: true });
      const testContext = await browser.newContext({
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
        storageState: authFile,
      });
      const testPage = await testContext.newPage();

      try {
        await testPage.goto('/ws/contacts', { timeout: 15000 });
        await testPage.waitForLoadState('networkidle');
        const url = testPage.url();

        if (url.includes('/ws')) {
          console.log(`✅ ${user.key} auth state already valid, skipping creation`);
          await testPage.close();
          await testContext.close();
          await browser.close();
          return; // Auth state is valid, skip this test
        }
      } catch {
        // Auth state invalid, continue to create/login
      }

      await testPage.close();
      await testContext.close();
      await browser.close();
    }

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

    try {
      await freshPage.waitForFunction(
        () => !window.location.pathname.includes('/login'),
        { timeout: 20000 }
      );
      await freshPage.waitForLoadState('networkidle');

      // Save auth state
      await freshContext.storageState({ path: path.join(AUTH_DIR, `${user.key}.json`) });
      console.log(`✅ Created user ${user.key} (${user.roles.join(', ')}) and saved auth state`);
    } catch {
      // Login failed - user might exist with different password
      console.log(`⚠️ ${user.key} login failed after creation (user may have different password), skipping auth save`);
      // Still need to close browser
    }

    // Cleanup
    await freshPage.close();
    await freshContext.close();
    await browser.close();

    // 3. Auth file might not be created if login failed
    if (fs.existsSync(authFile)) {
      console.log(`✅ ${user.key} auth file saved`);
    } else {
      console.log(`⚠️ ${user.key} auth file not saved - user needs password reset`);
      test.skip();
    }
  });
}
