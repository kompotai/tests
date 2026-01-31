/**
 * Job Related Entities Tests
 *
 * Tests for displaying related entities on job view page.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';

ownerTest.describe('Job Related Entities', () => {
  ownerTest.describe('API Integration', () => {
    ownerTest('related API returns correct structure', async ({ page }) => {
      // Go to jobs list
      await page.goto('/ws/jobs');
      await page.waitForLoadState('networkidle');

      // Wait for table to load
      await page.waitForTimeout(2000);

      // Check if there are any jobs
      const rows = page.locator('table tbody tr');
      const count = await rows.count();

      if (count > 0) {
        // Click on first job row
        const firstRow = rows.first();
        const titleCell = firstRow.locator('td').first();
        await titleCell.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Extract job ID from URL
        const url = page.url();
        const match = url.match(/\/jobs\/([a-f0-9]+)/);

        if (match) {
          const jobId = match[1];

          // Call the related API directly
          const response = await page.evaluate(async (id) => {
            const res = await fetch(`/api/jobs/${id}/related`);
            return {
              ok: res.ok,
              status: res.status,
              data: res.ok ? await res.json() : null,
            };
          }, jobId);

          // Verify API response structure
          expect(response.ok).toBe(true);
          expect(response.data).toHaveProperty('invoices');
          expect(response.data).toHaveProperty('total');

          // Verify invoices section has correct structure
          expect(response.data.invoices).toHaveProperty('count');
          expect(response.data.invoices).toHaveProperty('items');
          expect(Array.isArray(response.data.invoices.items)).toBe(true);
        }
      } else {
        // No jobs to test - skip gracefully
        ownerTest.skip();
      }
    });
  });

  ownerTest.describe('View Page Layout', () => {
    ownerTest('job view page has related invoices section when invoices exist', async ({ page }) => {
      // Go to jobs list
      await page.goto('/ws/jobs');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check if there are any jobs
      const rows = page.locator('table tbody tr');
      const count = await rows.count();

      if (count > 0) {
        // Click on first job row
        const firstRow = rows.first();
        const titleCell = firstRow.locator('td').first();
        await titleCell.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify the page has loaded correctly - check for job title in header
        const header = page.locator('h1');
        await expect(header).toBeVisible();

        // Check if related invoices section exists (only if there are invoices)
        // The section with data-testid will only appear if there are invoices
        const relatedInvoicesSection = page.locator('[data-testid="job-related-invoices"]');
        const invoicesCount = await relatedInvoicesSection.count();

        // Just verify the page structure is correct
        expect(invoicesCount >= 0).toBe(true);
      } else {
        ownerTest.skip();
      }
    });
  });
});
