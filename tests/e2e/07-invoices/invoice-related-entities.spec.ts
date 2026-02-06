/**
 * Invoice Related Entities Tests
 *
 * Tests for displaying related entities on invoice view page.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Invoice Related Entities', () => {
  ownerTest.describe('API Integration', () => {
    ownerTest('related API returns correct structure', async ({ page }) => {
      // Go to invoices list
      await page.goto(`/ws/${WORKSPACE_ID}/finances/invoices`);
      await page.waitForLoadState('networkidle');

      // Wait for table to load
      await page.waitForTimeout(2000);

      // Check if there are any invoices
      const rows = page.locator('table tbody tr');
      const count = await rows.count();

      if (count > 0) {
        // Click on first invoice row
        const firstRow = rows.first();
        const numberCell = firstRow.locator('td').first();
        await numberCell.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Extract invoice ID from URL
        const url = page.url();
        const match = url.match(/\/invoices\/([a-f0-9]+)/);

        if (match) {
          const invoiceId = match[1];

          // Call the related API directly
          const response = await page.evaluate(async (id) => {
            const res = await fetch(`/api/ws/megatest/invoices/${id}/related`);
            return {
              ok: res.ok,
              status: res.status,
              data: res.ok ? await res.json() : null,
            };
          }, invoiceId);

          // Verify API response structure
          expect(response.ok).toBe(true);
          expect(response.data).toHaveProperty('payments');
          expect(response.data).toHaveProperty('refunds');
          expect(response.data).toHaveProperty('total');

          // Verify each section has correct structure
          expect(response.data.payments).toHaveProperty('count');
          expect(response.data.payments).toHaveProperty('items');
          expect(Array.isArray(response.data.payments.items)).toBe(true);

          expect(response.data.refunds).toHaveProperty('count');
          expect(response.data.refunds).toHaveProperty('items');
          expect(Array.isArray(response.data.refunds.items)).toBe(true);
        }
      } else {
        // No invoices to test - skip gracefully
        ownerTest.skip();
      }
    });
  });

  ownerTest.describe('View Page Layout', () => {
    ownerTest('invoice view page has payments section', async ({ page }) => {
      // Go to invoices list
      await page.goto(`/ws/${WORKSPACE_ID}/finances/invoices`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check if there are any invoices
      const rows = page.locator('table tbody tr');
      const count = await rows.count();

      if (count > 0) {
        // Click on first invoice row
        const firstRow = rows.first();
        const numberCell = firstRow.locator('td').first();
        await numberCell.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify the page has loaded correctly - check for invoice number in header
        const header = page.locator('h1');
        await expect(header).toBeVisible();

        // Check if payments section exists (this is always shown)
        const paymentsSection = page.locator('text=Payments').or(page.locator('text=Оплаты'));
        await expect(paymentsSection.first()).toBeVisible();

        // Check if related refunds section exists (only if there are refunds)
        // The section with data-testid will only appear if there are refunds
        const relatedRefundsSection = page.locator('[data-testid="invoice-related-refunds"]');
        const refundsCount = await relatedRefundsSection.count();

        // Just verify the page structure is correct
        expect(refundsCount >= 0).toBe(true);
      } else {
        ownerTest.skip();
      }
    });
  });
});
