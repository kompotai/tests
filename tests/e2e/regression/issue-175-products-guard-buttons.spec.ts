/**
 * Regression test for Issue #175
 * Products table should hide Edit/Delete buttons for users without permissions
 *
 * Bug: Technician could see Edit/Delete buttons in Products table despite not having permissions
 * Fix: Added Guard components to hide buttons based on user permissions
 *
 * @see https://github.com/kompotai/bug-reports/issues/175
 */

import { ownerTest, technicianTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #175: Products Guard Buttons', { tag: ['@regression'] }, () => {
  ownerTest('owner sees edit and delete buttons @regression', async ({ page, request }) => {
    // First ensure there's at least one product
    const productsResponse = await request.get('/api/ws/megatest/products?limit=1');
    if (productsResponse.ok()) {
      const products = await productsResponse.json();
      if (!products.data || products.data.length === 0) {
        // Create a test product
        await request.post('/api/ws/megatest/products', {
          data: {
            name: `Test Product #175 - ${Date.now()}`,
            description: 'Test product for regression test',
            price: 100,
          },
        });
      }
    }

    // Navigate to products page
    await page.goto(`/ws/${WORKSPACE_ID}/products`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Handle cookie consent if present
    const acceptCookies = page.getByRole('button', { name: 'Accept All' });
    if (await acceptCookies.isVisible({ timeout: 1000 }).catch(() => false)) {
      await acceptCookies.click();
      await page.waitForTimeout(300);
    }

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Check if there are any products in the table
    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      // Hover over the first row to reveal action buttons
      const firstRow = tableRows.first();
      await firstRow.hover();
      await page.waitForTimeout(300);

      // Owner should see Edit button (Pencil icon) - look for button with pencil SVG
      const editButton = firstRow.locator('button svg.lucide-pencil, button svg[data-lucide="pencil"]').first();
      await expect(editButton).toBeVisible({ timeout: 3000 });

      // Owner should see Delete button (Trash icon)
      const deleteButton = firstRow.locator('button svg.lucide-trash-2, button svg[data-lucide="trash-2"]').first();
      await expect(deleteButton).toBeVisible({ timeout: 3000 });
    }
  });
});

technicianTest.describe('Issue #175: Technician Products Buttons', { tag: ['@regression'] }, () => {
  technicianTest('technician does not see edit and delete buttons @regression', async ({ page }) => {
    // Navigate to products page as technician
    await page.goto(`/ws/${WORKSPACE_ID}/products`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Handle cookie consent if present
    const acceptCookies = page.getByRole('button', { name: 'Accept All' });
    if (await acceptCookies.isVisible({ timeout: 1000 }).catch(() => false)) {
      await acceptCookies.click();
      await page.waitForTimeout(300);
    }

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Check if there are any products in the table
    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      // Hover over the first row
      const firstRow = tableRows.first();
      await firstRow.hover();
      await page.waitForTimeout(300);

      // Technician should NOT see Edit button
      const editButton = firstRow.locator('button svg.lucide-pencil, button svg[data-lucide="pencil"]');
      const editButtonCount = await editButton.count();
      expect(editButtonCount).toBe(0);

      // Technician should NOT see Delete button
      const deleteButton = firstRow.locator('button svg.lucide-trash-2, button svg[data-lucide="trash-2"]');
      const deleteButtonCount = await deleteButton.count();
      expect(deleteButtonCount).toBe(0);
    }
  });

  technicianTest('technician can still view products @regression', async ({ page }) => {
    // Navigate to products page as technician
    await page.goto(`/ws/${WORKSPACE_ID}/products`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Handle cookie consent if present
    const acceptCookies = page.getByRole('button', { name: 'Accept All' });
    if (await acceptCookies.isVisible({ timeout: 1000 }).catch(() => false)) {
      await acceptCookies.click();
      await page.waitForTimeout(300);
    }

    // Technician should be able to see the products page
    await expect(page.locator('h1, [data-testid="page-title"]').filter({ hasText: /Products|Товары/i })).toBeVisible({ timeout: 5000 });

    // Table should be visible
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });
});
