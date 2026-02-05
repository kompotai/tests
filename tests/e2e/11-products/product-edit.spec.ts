/**
 * Product Edit Tests
 *
 * Stories: P3 — Edit Product
 *
 * Covers:
 * - Opening the edit form from a table row
 * - Changing name, selling price, and type
 * - Verifying changes persist after page reload
 *
 * Each test creates its own product first, then edits it.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { ProductsPage } from '@pages/ProductsPage';
import { createMinimalProduct, uniqueProductName } from '@fixtures/products.fixture';

ownerTest.describe('Product Edit', () => {
  let productsPage: ProductsPage;

  ownerTest.beforeEach(async ({ page }) => {
    productsPage = new ProductsPage(page);
    await productsPage.goto();
  });

  /** Helper: create a product, refresh, and search so it's visible despite pagination. */
  async function createAndRefresh(data = createMinimalProduct()) {
    const success = await productsPage.create(data);
    expect(success).toBe(true);
    await productsPage.goto();
    await productsPage.search(data.name);
    return data;
  }

  // ============================================
  // Edit Form
  // ============================================

  ownerTest.describe('Edit Form', () => {
    ownerTest('[P3-AC1] can open edit form from table row', async () => {
      const product = await createAndRefresh();

      await productsPage.clickRowEdit(product.name);

      const formVisible = await productsPage.shouldSeeForm();
      expect(formVisible).toBe(true);
    });
  });

  // ============================================
  // Edit Name
  // ============================================

  ownerTest.describe('Edit Name', () => {
    ownerTest('[P3-AC2] changed name persists after page reload', async ({ page }) => {
      const product = await createAndRefresh();
      const newName = uniqueProductName('Renamed');

      await productsPage.clickRowEdit(product.name);
      await page.locator('[data-testid="product-form-input-name"]').fill(newName);
      await productsPage.submitForm();

      // Reload and verify the renamed product exists
      await productsPage.goto();
      await productsPage.search(newName);
      await productsPage.shouldSeeProduct(newName);
    });
  });

  // ============================================
  // Edit Selling Price
  // ============================================

  ownerTest.describe('Edit Selling Price', () => {
    ownerTest('[P3-AC3] changed selling price persists after page reload', async ({ page }) => {
      const product = await createAndRefresh(createMinimalProduct({ sellingPrice: 50 }));

      await productsPage.clickRowEdit(product.name);
      await page.locator('[data-testid="product-form-input-sellingPrice"]').fill('250');
      await productsPage.submitForm();

      // Reload and verify price in table row
      await productsPage.goto();
      await productsPage.search(product.name);
      const row = page.locator(`tr:has-text("${product.name}")`).first();
      await expect(row).toContainText('250');
    });
  });

  // ============================================
  // Edit Type
  // ============================================

  ownerTest.describe('Edit Type', () => {
    ownerTest('[P3-AC4] can change type from Product to Service', async ({ page }) => {
      const product = await createAndRefresh(createMinimalProduct({ type: 'product' }));

      await productsPage.clickRowEdit(product.name);
      await page.locator('[data-testid="product-form-select-type"]').selectOption('service');
      await productsPage.submitForm();

      // Reload and verify
      await productsPage.goto();
      await productsPage.search(product.name);
      const row = page.locator(`tr:has-text("${product.name}")`).first();
      await expect(row).toContainText('Service');
    });
  });
});
