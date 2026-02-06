/**
 * Product List Tests
 *
 * Stories: P1 — View Product List
 *
 * Covers:
 * - Table loads with correct columns
 * - Pre-existing products visible
 * - Search by name and SKU
 * - Empty result on nonsense search
 * - Category sidebar filter
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { ProductsPage } from '@pages/ProductsPage';
import { EXISTING_PRODUCTS, createMinimalProduct } from '@fixtures/products.fixture';

ownerTest.describe('Product List', () => {
  let productsPage: ProductsPage;

  ownerTest.beforeEach(async ({ page }) => {
    productsPage = new ProductsPage(page);
    await productsPage.goto();
  });

  // ============================================
  // Table Display
  // ============================================

  ownerTest.describe('Table Display', () => {
    ownerTest('[P1-AC1] products page loads and shows the table', async () => {
      const rows = await productsPage.getRowCount();
      expect(rows).toBeGreaterThan(0);
    });

    ownerTest('[P1-AC2] table has expected column headers', async ({ page }) => {
      const headers = ['Name', 'Type', 'SKU', 'Category', 'Purchase', 'Selling', 'Unit'];
      for (const header of headers) {
        await expect(page.locator(`th:has-text("${header}")`).first()).toBeVisible();
      }
    });

    ownerTest('[P1-AC3] pre-existing Sample Product is in the table', async () => {
      await productsPage.shouldSeeProduct(EXISTING_PRODUCTS.PRODUCT.name);
    });

    ownerTest('[P1-AC3] pre-existing Sample Service is in the table', async () => {
      await productsPage.shouldSeeProduct(EXISTING_PRODUCTS.SERVICE.name);
    });

    ownerTest('[P1-AC3] Sample Product row shows correct SKU', async ({ page }) => {
      const row = page.locator(`tr:has-text("${EXISTING_PRODUCTS.PRODUCT.name}")`).first();
      await expect(row).toContainText(EXISTING_PRODUCTS.PRODUCT.sku);
    });

    ownerTest('[P1-AC3] Sample Service row shows correct type', async ({ page }) => {
      const row = page.locator(`tr:has-text("${EXISTING_PRODUCTS.SERVICE.name}")`).first();
      await expect(row).toContainText('Service');
    });
  });

  // ============================================
  // Search
  // ============================================

  ownerTest.describe('Search', () => {
    ownerTest('[P1-AC4] search by product name returns matching row', async () => {
      await productsPage.search('Sample Product');

      await productsPage.shouldSeeProduct(EXISTING_PRODUCTS.PRODUCT.name);
    });

    ownerTest('[P1-AC5] search by SKU returns matching row', async () => {
      await productsPage.search('PRD-SAMPLE-01');

      await productsPage.shouldSeeProduct(EXISTING_PRODUCTS.PRODUCT.name);
    });

    ownerTest('[P1-AC5] search by partial SKU returns matching row', async () => {
      await productsPage.search('SRV-SAMPLE');

      await productsPage.shouldSeeProduct(EXISTING_PRODUCTS.SERVICE.name);
    });

    ownerTest('[P1-AC6] search with no match shows zero rows', async () => {
      await productsPage.search('ZZZNOTEXIST_NO_MATCH_99999');

      const count = await productsPage.getRowCount();
      expect(count).toBe(0);
    });

    ownerTest('[P1-AC6] search narrows results from full list', async () => {
      const countBefore = await productsPage.getRowCount();

      // "Sample" matches both Sample Product and Sample Service but not test-created products
      await productsPage.search('Sample');

      const countAfter = await productsPage.getRowCount();
      expect(countAfter).toBeLessThan(countBefore);
      expect(countAfter).toBeGreaterThan(0);
    });
  });

  // ============================================
  // Category Filter
  // ============================================

  ownerTest.describe('Category Filter', () => {
    ownerTest('[P1-AC7] "All products" shows all products', async () => {
      await productsPage.filterAllProducts();

      const count = await productsPage.getRowCount();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    ownerTest('[P1-AC7] filtering by "Services" category shows products in that category', async () => {
      await productsPage.filterByCategory('Services');

      // Both sample products are in the Services category
      await productsPage.shouldSeeProduct(EXISTING_PRODUCTS.PRODUCT.name);
    });

    ownerTest('[P1-AC7] product created with a category appears in that category filter', async () => {
      const product = createMinimalProduct({ category: 'Services' });

      const success = await productsPage.create(product);
      expect(success).toBe(true);

      await productsPage.goto();
      await productsPage.filterByCategory('Services');
      await productsPage.search(product.name);
      await productsPage.shouldSeeProduct(product.name);
    });

    ownerTest('[P1-AC7] product created without a category does not appear in category filters', async () => {
      const product = createMinimalProduct(); // no category

      const success = await productsPage.create(product);
      expect(success).toBe(true);

      await productsPage.goto();
      await productsPage.filterByCategory('Services');
      await productsPage.search(product.name);

      const count = await productsPage.getRowCount();
      expect(count).toBe(0);
    });
  });
});
