/**
 * Super Admin Tests
 *
 * Tests for platform-level super admin functionality.
 * Super admin is created by bootstrap on server start.
 *
 * Credentials are from environment variables (Doppler):
 * - SUPER_ADMIN_EMAIL
 * - SUPER_ADMIN_PASSWORD
 */

import { test, expect } from '@playwright/test';
import { SUPER_ADMIN } from '@fixtures/users';
import * as fs from 'fs';
import * as path from 'path';

const AUTH_DIR = path.join(__dirname, '../../../.auth');

// Ensure auth directory exists
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

test.describe('Super Admin', () => {
  test('SA1: Super admin can login and see manage dashboard', async ({ page, context }) => {
    // Validate credentials are set
    expect(SUPER_ADMIN.email).toBeTruthy();
    expect(SUPER_ADMIN.password).toBeTruthy();

    // Navigate to admin login (separate from workspace login)
    await page.goto('/account/admin-login');

    // Wait for form to be ready (page uses Suspense)
    await page.waitForSelector('[data-testid="login-input-email"]', { timeout: 15000 });

    // Fill login form
    await page.fill('[data-testid="login-input-email"]', SUPER_ADMIN.email);
    await page.fill('[data-testid="login-input-password"]', SUPER_ADMIN.password);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for redirect to manage dashboard
    await page.waitForURL(/\/manage/, { timeout: 20000 });

    // Verify we're on the manage dashboard
    expect(page.url()).toContain('/manage');

    // Save auth state for future tests
    await context.storageState({ path: path.join(AUTH_DIR, 'super-admin.json') });
    console.log('✅ Super admin logged in and auth state saved');
  });

  test('SA2: Super admin auth state file was created', async () => {
    const authFile = path.join(AUTH_DIR, 'super-admin.json');
    expect(fs.existsSync(authFile)).toBe(true);
  });
});
