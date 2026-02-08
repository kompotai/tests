/**
 * Security Test: Legitimate Access Verification
 *
 * Ensures that the security fix doesn't break legitimate access:
 * - Super admin CAN access /manage/users
 * - Company owner CAN see their own workspaces
 * - Super admin CAN see all workspaces
 */

import { test, expect } from '@playwright/test';
import { SUPER_ADMIN, OWNER, WORKSPACE_ID } from '@fixtures/users';
import * as fs from 'fs';

test.describe('Security: Legitimate Access Verification', () => {
  test.describe.configure({ mode: 'serial' });

  // Skip if no super admin credentials
  test.skip(!SUPER_ADMIN.isAvailable, 'SKIP: SUPER_ADMIN credentials not set');

  test('LEG1: Super admin CAN access /manage/users and see users', async ({ page }) => {
    // Use saved auth state if available
    const authFile = '.auth/super-admin.json';
    if (fs.existsSync(authFile)) {
      const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
      await page.context().addCookies(storageState.cookies || []);
    } else {
      // Login manually via admin-login
      await page.goto('/account/admin-login');
      await page.waitForLoadState('domcontentloaded');
      await page.getByPlaceholder(/email/i).fill(SUPER_ADMIN.email);
      await page.getByPlaceholder(/password/i).fill(SUPER_ADMIN.password);
      await page.getByRole('button', { name: /sign in|log in|login/i }).click();
      await page.waitForURL(/\/manage/, { timeout: 30000 });
    }

    // Navigate to users page
    await page.goto('/manage/users');
    await page.waitForLoadState('networkidle');

    // Super admin SHOULD see Users link in navigation
    const nav = page.locator('nav');
    await expect(nav.getByRole('link', { name: 'Users' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Workspaces' })).toBeVisible();

    // Should see the users table with data
    const usersTable = page.locator('table');
    await expect(usersTable).toBeVisible();

    // Should see at least 1 user (themselves)
    const userRows = page.locator('table tbody tr');
    const rowCount = await userRows.count();
    expect(rowCount).toBeGreaterThan(0);

    console.log(`✅ Super admin can see ${rowCount} users`);
  });

  test('LEG2: Super admin CAN fetch users via API', async ({ request }) => {
    // Get auth cookies from saved state
    const authFile = '.auth/super-admin.json';
    if (!fs.existsSync(authFile)) {
      test.skip(true, 'Super admin auth file not found');
      return;
    }

    const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
    const sessionCookie = storageState.cookies?.find((c: any) => c.name === 'kompot-session');

    if (!sessionCookie) {
      test.skip(true, 'Super admin session cookie not found');
      return;
    }

    const response = await request.get('/api/manage/users', {
      headers: {
        Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
      },
    });

    // Should succeed
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.users).toBeDefined();
    expect(Array.isArray(body.users)).toBe(true);
    expect(body.users.length).toBeGreaterThan(0);

    console.log(`✅ Super admin API returned ${body.users.length} users`);
  });

  test('LEG3: Company owner CAN see their own workspaces', async ({ page }) => {
    // Always login via admin-login for manage dashboard access
    // (workspace auth state has wsid which prevents manage API from listing workspaces)
    await page.goto('/account/admin-login');
    await page.waitForLoadState('domcontentloaded');
    await page.getByPlaceholder(/email/i).fill(OWNER.email);
    await page.getByPlaceholder(/password/i).fill(OWNER.password);
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();
    await page.waitForURL(/\/manage/, { timeout: 30000 });

    // Navigate to manage dashboard
    await page.goto('/manage');
    await page.waitForLoadState('networkidle');

    // Should see their workspace(s)
    const workspaceTable = page.locator('[data-testid="manage-workspaces-table"]');

    // Wait for table to appear (owner has at least one workspace)
    await expect(workspaceTable).toBeVisible({ timeout: 10000 });

    // Should see the megatest workspace row
    const workspaceRow = page.locator(`[data-testid="manage-workspaces-row-${WORKSPACE_ID}"]`);
    await expect(workspaceRow).toBeVisible();

    console.log(`✅ Company owner can see their workspace: ${WORKSPACE_ID}`);
  });

  test('LEG4: Company owner CAN fetch their workspaces via API', async ({ request }) => {
    // Get auth cookies from saved state
    const authFile = '.auth/owner.json';
    if (!fs.existsSync(authFile)) {
      test.skip(true, 'Owner auth file not found');
      return;
    }

    const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
    const sessionCookie = storageState.cookies?.find((c: any) => c.name === 'kompot-session');

    if (!sessionCookie) {
      test.skip(true, 'Owner session cookie not found');
      return;
    }

    // Fetch workspaces (without ?all=true - should return own workspaces)
    const response = await request.get('/api/manage/workspaces', {
      headers: {
        Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
      },
    });

    // Should succeed
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.workspaces).toBeDefined();
    expect(Array.isArray(body.workspaces)).toBe(true);
    expect(body.workspaces.length).toBeGreaterThan(0);

    // Should include megatest workspace
    const megatest = body.workspaces.find((ws: any) => ws.wsid === WORKSPACE_ID);
    expect(megatest).toBeDefined();

    console.log(`✅ Company owner API returned ${body.workspaces.length} workspaces`);
  });

  test('LEG5: Super admin CAN see ALL workspaces with ?all=true', async ({ request }) => {
    // Get auth cookies from saved state
    const authFile = '.auth/super-admin.json';
    if (!fs.existsSync(authFile)) {
      test.skip(true, 'Super admin auth file not found');
      return;
    }

    const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
    const sessionCookie = storageState.cookies?.find((c: any) => c.name === 'kompot-session');

    if (!sessionCookie) {
      test.skip(true, 'Super admin session cookie not found');
      return;
    }

    // Fetch all workspaces (admin feature)
    const response = await request.get('/api/manage/workspaces?all=true', {
      headers: {
        Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
      },
    });

    // Should succeed
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.workspaces).toBeDefined();
    expect(Array.isArray(body.workspaces)).toBe(true);

    // Super admin should see at least the test workspace
    expect(body.workspaces.length).toBeGreaterThan(0);

    console.log(`✅ Super admin API with ?all=true returned ${body.workspaces.length} workspaces`);
  });
});
