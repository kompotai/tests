/**
 * Payment CRUD Tests
 *
 * Basic tests for payment functionality.
 */

import { accountantTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

accountantTest.describe('Payment CRUD', () => {
  accountantTest.describe('Page Access', () => {
    accountantTest('can open payments page', async ({ page }) => {
      // Navigate to payments page
      await page.goto(`/ws/${WORKSPACE_ID}/finances/payments`);
      await page.waitForLoadState('networkidle');

      // Verify page loaded - check for header or table
      const header = page.locator('h1');
      await expect(header).toBeVisible({ timeout: 10000 });

      // Verify we're on the correct page
      expect(page.url()).toContain('/finances/payments');
    });

    accountantTest('payments page shows table or empty state', async ({ page }) => {
      await page.goto(`/ws/${WORKSPACE_ID}/finances/payments`);
      await page.waitForLoadState('networkidle');

      // Page should show either a table with payments or empty state
      const table = page.locator('table');
      const emptyState = page.locator('text=No payments').or(page.locator('text=Нет оплат'));

      const hasTable = await table.isVisible({ timeout: 5000 }).catch(() => false);
      const hasEmptyState = await emptyState.first().isVisible({ timeout: 3000 }).catch(() => false);

      // One of these should be visible
      expect(hasTable || hasEmptyState).toBe(true);
    });
  });
});
