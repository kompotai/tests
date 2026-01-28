/**
 * Auth test helpers - shared functions for user creation tests
 */

import { Page, BrowserContext } from '@playwright/test';
import { User, SystemRole, WORKSPACE_ID } from '@fixtures/users';
import * as path from 'path';

const AUTH_DIR = path.join(__dirname, '../../../.auth');

export { AUTH_DIR, WORKSPACE_ID };

export async function dismissCookieConsent(page: Page) {
  const acceptBtn = page.locator('button:has-text("Accept All"), button:has-text("Accept")');
  if (await acceptBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await acceptBtn.click();
    await acceptBtn.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
  }
}

export async function createUserViaUI(page: Page, user: User) {
  // Navigate to Settings > Users
  await page.goto('/ws/settings/users');
  await page.waitForLoadState('networkidle');
  await dismissCookieConsent(page);

  // Check if user already exists in the table
  const userRow = page.locator(`tr:has-text("${user.email}")`);
  if (await userRow.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log(`✅ User ${user.email} already exists, skipping creation`);
    return;
  }

  // Click "Add User"
  await page.click('[data-testid="add-user-button"], button:has-text("Add User"), button:has-text("Add")');
  await page.waitForSelector('[data-testid="user-form"]', { timeout: 5000 });

  // Fill form
  await page.fill('[data-testid="user-form-input-name"]', user.name);
  await page.fill('[data-testid="user-form-input-email"]', user.email);
  await page.fill('[data-testid="user-form-input-password"]', user.password);

  // Select roles via checkboxes
  // Default is "Manager" checked. Need to configure based on user.roles

  // If user doesn't have manager role, uncheck it
  if (!user.roles.includes('manager')) {
    await page.click('label:has-text("Manager")');
  }

  // Check each required role (except manager which is default)
  const roleLabels: Record<SystemRole, string> = {
    admin: 'Admin',
    manager: 'Manager',
    technician: 'Technician',
    accountant: 'Accountant',
  };

  for (const role of user.roles) {
    if (role !== 'manager') {
      await page.click(`label:has-text("${roleLabels[role]}")`);
    }
  }

  // Submit and wait for success
  await page.click('[data-testid="user-form-button-submit"]');

  // Wait for form to close (drawer closes on success) or error message
  try {
    await page.waitForSelector('[data-testid="user-form"]', { state: 'hidden', timeout: 10000 });
  } catch {
    // Check if there's an error about user already existing
    const errorText = await page.locator('[role="alert"], .text-red-500, .text-destructive').textContent().catch(() => '');
    if (errorText?.includes('already exists')) {
      console.log(`⚠️ User ${user.email} already exists (detected via error), closing form`);
      // Close the form
      await page.click('[data-testid="user-form-button-cancel"], button:has-text("Cancel")').catch(() => {});
      await page.waitForSelector('[data-testid="user-form"]', { state: 'hidden', timeout: 5000 }).catch(() => {});
      return;
    }
    throw new Error(`Failed to create user ${user.email}: ${errorText}`);
  }
}

export async function loginAndSaveState(context: BrowserContext, user: User) {
  const page = await context.newPage();

  await page.goto('/account/login');
  await page.waitForSelector('form', { timeout: 10000 });

  await page.fill('[data-testid="login-input-wsid"]', WORKSPACE_ID);
  await page.fill('[data-testid="login-input-email"]', user.email);
  await page.fill('[data-testid="login-input-password"]', user.password);
  await page.click('[data-testid="login-button-submit"]');

  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 20000 });
  await page.waitForLoadState('networkidle');

  // Save auth state
  await context.storageState({ path: path.join(AUTH_DIR, `${user.key}.json`) });

  await page.close();
}
