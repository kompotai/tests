/**
 * Regression test for Issue #167
 * Permissions matrix should allow viewing permissions for a single role
 *
 * Feature: Click on role name to see only that role's permissions in a SlideOver
 *
 * @see https://github.com/kompotai/bug-reports/issues/167
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #167: Single Role Permissions View', { tag: ['@regression'] }, () => {
  ownerTest('clicking role header opens permissions panel @regression', async ({ page }) => {
    // Navigate directly to permissions page (access page now redirects to users)
    await page.goto(`/ws/${WORKSPACE_ID}/settings/access/permissions`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Handle cookie consent if present
    const acceptCookies = page.getByRole('button', { name: 'Accept All' });
    if (await acceptCookies.isVisible({ timeout: 1000 }).catch(() => false)) {
      await acceptCookies.click();
      await page.waitForTimeout(300);
    }

    // Wait for permissions matrix table to load
    await page.waitForSelector('table', { timeout: 5000 });

    // Find a role header - role names are in table headers
    const managerHeader = page.locator('th, td').filter({ hasText: /manager|менеджер/i }).first();
    await expect(managerHeader).toBeVisible({ timeout: 5000 });

    // Click on the role header
    await managerHeader.click();

    // Verify SlideOver panel opens with title "Permissions for manager"
    const slideOverTitle = page.locator('h2, h3').filter({ hasText: /Permissions for|Права доступа для/i }).first();
    await expect(slideOverTitle).toBeVisible({ timeout: 3000 });

    // Verify the panel shows permissions grouped by module
    // Look for module headers like "Contact management", "Opportunity management"
    const contactManagement = page.locator('text=/Contact management|Управление контактами/i').first();
    await expect(contactManagement).toBeVisible({ timeout: 2000 });

    // Verify "View contacts" permission is shown
    const viewContacts = page.locator('text=/View contacts|Просмотр контактов/i').first();
    await expect(viewContacts).toBeVisible({ timeout: 2000 });
  });

  ownerTest('panel can be closed @regression', async ({ page }) => {
    // Navigate directly to permissions page (access page now redirects to users)
    await page.goto(`/ws/${WORKSPACE_ID}/settings/access/permissions`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Handle cookie consent if present
    const acceptCookies = page.getByRole('button', { name: 'Accept All' });
    if (await acceptCookies.isVisible({ timeout: 1000 }).catch(() => false)) {
      await acceptCookies.click();
      await page.waitForTimeout(300);
    }

    // Wait for table
    await page.waitForSelector('table', { timeout: 5000 });

    // Click on technician role header
    const technicianHeader = page.locator('th, td').filter({ hasText: /technician|техник/i }).first();
    await expect(technicianHeader).toBeVisible({ timeout: 5000 });
    await technicianHeader.click();

    // Verify SlideOver opens
    const slideOverTitle = page.locator('h2, h3').filter({ hasText: /Permissions for|Права доступа для/i }).first();
    await expect(slideOverTitle).toBeVisible({ timeout: 3000 });

    // Close the panel by pressing Escape
    await page.keyboard.press('Escape');

    // Verify panel is closed
    await expect(slideOverTitle).not.toBeVisible({ timeout: 2000 });

    // The table should still be visible
    await expect(page.locator('table')).toBeVisible();
  });
});
