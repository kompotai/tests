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
  await page.goto(`/ws/${WORKSPACE_ID}/settings/users`);
  await page.waitForLoadState('networkidle');
  await dismissCookieConsent(page);

  // Check if user already exists in the table
  const userRow = page.locator(`tr:has-text("${user.email}")`);
  if (await userRow.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log(`✅ User ${user.email} already exists, skipping creation`);
    return;
  }

  // Click "Add User"
  await page.click('[data-testid="users-button-create"], button:has-text("Add User"), button:has-text("Add")');
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

/**
 * Perform login with user-facing locators
 * Supports both Employee (with workspace ID) and Owner (without) login forms
 */
export async function performLogin(
  page: Page,
  options: {
    workspaceId?: string;
    email: string;
    password: string;
    asEmployee?: boolean;
  }
) {
  const { workspaceId = WORKSPACE_ID, email, password, asEmployee = true } = options;

  await page.goto('/account/login');
  await page.waitForLoadState('domcontentloaded');

  // Select appropriate tab if tabs are present
  const employeeTab = page.getByRole('tab', { name: /employee/i });
  const ownerTab = page.getByRole('tab', { name: /company owner|owner/i });

  if (asEmployee && await employeeTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    const isSelected = await employeeTab.getAttribute('aria-selected') === 'true'
      || await employeeTab.getAttribute('data-state') === 'active';
    if (!isSelected) {
      await employeeTab.click();
      await page.waitForTimeout(300);
    }
  } else if (!asEmployee && await ownerTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    const isSelected = await ownerTab.getAttribute('aria-selected') === 'true'
      || await ownerTab.getAttribute('data-state') === 'active';
    if (!isSelected) {
      await ownerTab.click();
      await page.waitForTimeout(300);
    }
  }

  // Fill workspace ID if field is present (employee login)
  const workspaceIdInput = page.getByTestId('login-input-wsid');
  if (await workspaceIdInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await workspaceIdInput.fill(workspaceId);
  }

  // Fill email and password
  await page.getByTestId('login-input-email').fill(email);
  await page.getByTestId('login-input-password').fill(password);

  // Submit
  await page.getByTestId('login-button-submit').click();

  // Wait for redirect away from login
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 20000 });
  await page.waitForLoadState('networkidle');
}

export async function loginAndSaveState(context: BrowserContext, user: User) {
  const page = await context.newPage();

  await performLogin(page, {
    workspaceId: WORKSPACE_ID,
    email: user.email,
    password: user.password,
    asEmployee: true,
  });

  // Save auth state
  await context.storageState({ path: path.join(AUTH_DIR, `${user.key}.json`) });

  await page.close();
}
