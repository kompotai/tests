/**
 * Regression Test: Issue #174
 * Bug: Error 403 when creating product
 *
 * Problem: Owner allegedly got 403 error when trying to create a product.
 * Investigation shows the bug does not reproduce - Owner has correct permissions.
 *
 * This test verifies:
 * 1. Owner can see the Create Product button (UI permission check)
 * 2. Owner can create a product via API without 403
 *
 * @see https://github.com/kompotai/bug-reports/issues/174
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';

ownerTest.describe('Issue #174: Product Creation 403', () => {
  ownerTest('owner can see Create Product button @regression', async ({ page }) => {
    // Navigate to products page
    await page.goto('/ws/products');
    await page.waitForLoadState('networkidle');

    // Handle cookie consent if present
    const acceptCookies = page.getByRole('button', { name: 'Accept All' });
    if (await acceptCookies.isVisible({ timeout: 1000 }).catch(() => false)) {
      await acceptCookies.click();
      await page.waitForTimeout(300);
    }

    // THE KEY TEST: Create Product button should be visible for owners
    // If Guard doesn't have permissions, button won't be visible
    const createButton = page.getByRole('button', { name: /Add Product|Create Product/i });
    await expect(createButton).toBeVisible({ timeout: 10000 });
  });

  ownerTest('owner can create product via API @regression', async ({ request }) => {
    // Test direct API access to verify no 403
    const productName = `API Test #174 - ${Date.now()}`;

    const response = await request.post('/api/products', {
      data: {
        name: productName,
        type: 'product',
        sellingPrice: 100,
        unit: 'pcs',
      },
    });

    // THE KEY TEST: API should return 201, not 403
    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body.id).toBeDefined();
    expect(body.name).toBe(productName);
  });
});
