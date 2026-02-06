/**
 * Regression test for Issue #167
 * Permissions matrix should allow viewing permissions for a single role
 *
 * Feature: Click on role name to see only that role's permissions in a SlideOver
 *
 * Prerequisite: Workspace must have editable roles (manager, technician, etc.)
 * beyond the default Owner/Admin. If no editable roles exist, tests are skipped.
 *
 * @see https://github.com/kompotai/bug-reports/issues/167
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #167: Single Role Permissions View', { tag: ['@regression'] }, () => {
  ownerTest('clicking role header opens permissions panel @regression', async ({ page }) => {
    // Navigate directly to permissions page
    await page.goto(`/ws/${WORKSPACE_ID}/settings/access/permissions`);
    await page.waitForLoadState('load');

    // Handle cookie consent if present
    const acceptCookies = page.getByRole('button', { name: 'Accept All' });
    if (await acceptCookies.isVisible({ timeout: 1000 }).catch(() => false)) {
      await acceptCookies.click();
      await page.waitForTimeout(300);
    }

    // Wait for permissions matrix table to load
    await page.waitForSelector('table', { timeout: 15000 });

    // Check if any editable role buttons exist (beyond Owner/Admin)
    // Editable roles render as <th><button> elements in the table header
    const roleButtons = page.locator('th button');
    const roleCount = await roleButtons.count();

    if (roleCount === 0) {
      ownerTest.skip(true, 'No editable roles in workspace — only Owner/Admin exist');
      return;
    }

    // Click the first available editable role button
    const firstRoleButton = roleButtons.first();
    await expect(firstRoleButton).toBeVisible({ timeout: 5000 });
    const roleName = await firstRoleButton.textContent();
    await firstRoleButton.click();

    // Verify SlideOver panel opens with permissions title
    const slideOverTitle = page.locator('h2, h3').filter({ hasText: /Permissions for|Права доступа для/i }).first();
    await expect(slideOverTitle).toBeVisible({ timeout: 5000 });

    // Verify the panel shows permissions grouped by module
    // Look for any module header (Contact management is a common one)
    const moduleHeader = page.locator('[class*="font-medium"], [class*="font-semibold"]')
      .filter({ hasText: /management|управление/i }).first();
    await expect(moduleHeader).toBeVisible({ timeout: 3000 });
  });

  ownerTest('panel can be closed @regression', async ({ page }) => {
    // Navigate directly to permissions page
    await page.goto(`/ws/${WORKSPACE_ID}/settings/access/permissions`);
    await page.waitForLoadState('load');

    // Handle cookie consent if present
    const acceptCookies = page.getByRole('button', { name: 'Accept All' });
    if (await acceptCookies.isVisible({ timeout: 1000 }).catch(() => false)) {
      await acceptCookies.click();
      await page.waitForTimeout(300);
    }

    // Wait for table with data
    await page.waitForSelector('table', { timeout: 15000 });

    // Check if any editable role buttons exist
    const roleButtons = page.locator('th button');
    const roleCount = await roleButtons.count();

    if (roleCount === 0) {
      ownerTest.skip(true, 'No editable roles in workspace — only Owner/Admin exist');
      return;
    }

    // Click the first available editable role button
    const firstRoleButton = roleButtons.first();
    await expect(firstRoleButton).toBeVisible({ timeout: 5000 });
    await firstRoleButton.click();

    // Verify SlideOver opens
    const slideOverTitle = page.locator('h2, h3').filter({ hasText: /Permissions for|Права доступа для/i }).first();
    await expect(slideOverTitle).toBeVisible({ timeout: 5000 });

    // Close the panel by pressing Escape
    await page.keyboard.press('Escape');

    // Verify panel is closed
    await expect(slideOverTitle).not.toBeVisible({ timeout: 3000 });

    // The table should still be visible
    await expect(page.locator('table')).toBeVisible();
  });
});
