/**
 * Security Regression Test: Workspace Admin Access Control
 *
 * Issue #184: Workspace 'admin' role was incorrectly treated as manager 'admin',
 * allowing workspace admins to access system-wide user management.
 *
 * This test ensures workspace admins cannot access manager-only endpoints.
 */

import { test, expect } from '@playwright/test';
import { WORKSPACE_ID } from '@fixtures/users';

// Workspace admin credentials from Doppler
const ADMIN_USER = {
  email: process.env.WS_MEGATEST_ADMIN_EMAIL || `${WORKSPACE_ID}-admin@kompot.ai`,
  password: process.env.WS_MEGATEST_ADMIN_PASSWORD || `${WORKSPACE_ID}Admin123!`,
};

test.describe('Security: Workspace Admin Access Control', () => {
  test.describe.configure({ mode: 'serial' });

  let adminAuthCookies: { name: string; value: string }[];

  test('SEC1: Workspace admin can login successfully', async ({ page, context }) => {
    await page.goto('/account/login');
    await page.waitForLoadState('domcontentloaded');

    // Select employee tab if present
    const employeeTab = page.getByRole('tab', { name: /employee/i });
    if (await employeeTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await employeeTab.click();
      await page.waitForTimeout(300);
    }

    // Fill login form
    const wsidInput = page.getByTestId('login-input-wsid');
    if (await wsidInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await wsidInput.fill(WORKSPACE_ID);
    }
    await page.getByTestId('login-input-email').fill(ADMIN_USER.email);
    await page.getByTestId('login-input-password').fill(ADMIN_USER.password);
    await page.getByTestId('login-button-submit').click();

    // Wait for workspace redirect
    await page.waitForURL(new RegExp(`/ws/${WORKSPACE_ID}`), { timeout: 30000 });
    expect(page.url()).toContain(`/ws/${WORKSPACE_ID}`);

    // Save cookies for API tests
    const cookies = await context.cookies();
    adminAuthCookies = cookies.filter(c => c.name === 'kompot-session');
    expect(adminAuthCookies.length).toBeGreaterThan(0);
  });

  test('SEC2: Workspace admin CANNOT access /manage/users page (no admin links)', async ({ page, context }) => {
    // Restore session
    await context.addCookies(adminAuthCookies);

    // Navigate to manage users
    await page.goto('/manage/users');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Navigation should NOT contain admin links (Users, Workspaces, Chats)
    const nav = page.locator('nav');
    await expect(nav.getByRole('link', { name: 'Users' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Workspaces' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Chats' })).toHaveCount(0);

    // Only Referrals should be visible
    await expect(nav.getByRole('link', { name: 'Referrals' })).toBeVisible();
  });

  test('SEC3: Workspace admin CANNOT fetch users via API (403 Forbidden)', async ({ request, context }) => {
    // Make API request with workspace admin session
    const sessionCookie = adminAuthCookies[0];

    const response = await request.get('/api/manage/users', {
      headers: {
        Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
      },
    });

    // Should be forbidden
    expect(response.status()).toBe(403);

    const body = await response.json();
    expect(body.error).toBe('Access denied');
  });

  test('SEC4: Workspace admin CANNOT fetch all workspaces via API (gets empty)', async ({ request }) => {
    const sessionCookie = adminAuthCookies[0];

    // Request all workspaces (admin-only feature)
    const response = await request.get('/api/manage/workspaces?all=true', {
      headers: {
        Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
      },
    });

    // Request succeeds but returns only user's own workspaces (none for workspace user)
    expect(response.status()).toBe(200);

    const body = await response.json();
    // Workspace admin has no manager-level workspaces
    expect(body.workspaces).toHaveLength(0);
  });

  test('SEC5: Workspace admin CANNOT modify other users via API (403 or 404)', async ({ request }) => {
    const sessionCookie = adminAuthCookies[0];

    // Try to update a random user ID
    const response = await request.put('/api/manage/users/000000000000000000000001', {
      headers: {
        Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
        'Content-Type': 'application/json',
      },
      data: {
        roles: ['super_admin'], // Attempt privilege escalation
      },
    });

    // Should be forbidden (403) or not found (404) - both are acceptable
    // 403 means "you don't have permission"
    // 404 means "user not found" (but still no access)
    expect([403, 404]).toContain(response.status());
  });
});
