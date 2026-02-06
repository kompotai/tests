/**
 * Product Creation Tests
 *
 * Stories: P2 — Create Product
 *
 * Covers:
 * - Opening the creation form
 * - Creating products with minimal and full fields
 * - Creating a Service type product
 * - Persistence after page refresh
 * - Validation (required fields block submit)
 * - Cancel closes form without creating
 *
 * Each test creates its own product with a unique name.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { ProductsPage } from '@pages/ProductsPage';
import {
  createMinimalProduct,
  createFullProduct,
  createServiceProduct,
} from '@fixtures/products.fixture';

ownerTest.describe('Product Creation', () => {
  let productsPage: ProductsPage;

  ownerTest.beforeEach(async ({ page }) => {
    productsPage = new ProductsPage(page);
    await productsPage.goto();
  });

  // ============================================
  // Form Open / Close
  // ============================================

  ownerTest.describe('Form Controls', () => {
    ownerTest('[P2-AC1] can open the creation form', async () => {
      const formBefore = await productsPage.shouldSeeForm();
      expect(formBefore).toBe(false);

      await productsPage.openCreateForm();

      const formAfter = await productsPage.shouldSeeForm();
      expect(formAfter).toBe(true);
    });

    ownerTest('[P2-AC7] cancel closes the form without creating', async () => {
      const countBefore = await productsPage.getRowCount();

      await productsPage.openCreateForm();
      await productsPage.cancelForm();

      const formVisible = await productsPage.shouldSeeForm();
      expect(formVisible).toBe(false);

      // Row count unchanged
      const countAfter = await productsPage.getRowCount();
      expect(countAfter).toBe(countBefore);
    });
  });

  // ============================================
  // Basic Creation
  // ============================================

  ownerTest.describe('Basic Creation', () => {
    ownerTest('[P2-AC2] can create a product with minimal fields', async () => {
      const product = createMinimalProduct();

      const success = await productsPage.create(product);
      expect(success).toBe(true);

      await productsPage.goto();
      await productsPage.search(product.name);
      await productsPage.shouldSeeProduct(product.name);
    });

    ownerTest('[P2-AC3] can create a product with all fields filled', async () => {
      const product = createFullProduct();

      const success = await productsPage.create(product);
      expect(success).toBe(true);

      await productsPage.goto();
      await productsPage.search(product.name);
      await productsPage.shouldSeeProduct(product.name);
    });

    ownerTest('[P2-AC4] created product persists after page refresh', async () => {
      const product = createMinimalProduct();

      const success = await productsPage.create(product);
      expect(success).toBe(true);

      await productsPage.goto();
      await productsPage.search(product.name);
      await productsPage.shouldSeeProduct(product.name);
    });
  });

  // ============================================
  // Product Types
  // ============================================

  ownerTest.describe('Product Types', () => {
    ownerTest('[P2-AC5] can create a Service type product', async ({ page }) => {
      const product = createServiceProduct();

      const success = await productsPage.create(product);
      expect(success).toBe(true);

      await productsPage.goto();
      await productsPage.search(product.name);
      const row = page.locator(`tr:has-text("${product.name}")`).first();
      await expect(row).toBeVisible({ timeout: 10000 });
      await expect(row).toContainText('Service');
    });

    ownerTest('[P2-AC5] can create a Product type product', async ({ page }) => {
      const product = createMinimalProduct({ type: 'product' });

      const success = await productsPage.create(product);
      expect(success).toBe(true);

      await productsPage.goto();
      await productsPage.search(product.name);
      const row = page.locator(`tr:has-text("${product.name}")`).first();
      await expect(row).toBeVisible({ timeout: 10000 });
      await expect(row).toContainText('Product');
    });
  });

  // ============================================
  // Field Variations
  // ============================================

  ownerTest.describe('Field Variations', () => {
    ownerTest('can create product with custom SKU', async ({ page }) => {
      const sku = `TEST-SKU-${Date.now().toString().slice(-6)}`;
      const product = createMinimalProduct({ sku });

      const success = await productsPage.create(product);
      expect(success).toBe(true);

      await productsPage.goto();
      await productsPage.search(product.name);
      const row = page.locator(`tr:has-text("${product.name}")`).first();
      await expect(row).toContainText(sku);
    });

    ownerTest('can create product with purchase and selling prices', async ({ page }) => {
      const product = createMinimalProduct({ purchasePrice: 25, sellingPrice: 75 });

      const success = await productsPage.create(product);
      expect(success).toBe(true);

      await productsPage.goto();
      await productsPage.search(product.name);
      const row = page.locator(`tr:has-text("${product.name}")`).first();
      await expect(row).toContainText('75');
    });

    ownerTest('can create product with custom unit', async ({ page }) => {
      const product = createMinimalProduct({ unit: 'kg', sellingPrice: 50 });

      const success = await productsPage.create(product);
      expect(success).toBe(true);

      await productsPage.goto();
      await productsPage.search(product.name);
      const row = page.locator(`tr:has-text("${product.name}")`).first();
      await expect(row).toContainText('kg');
    });

    ownerTest('can create product with taxable enabled', async () => {
      const product = createMinimalProduct({ taxable: true, taxRate: 15 });

      const success = await productsPage.create(product);
      expect(success).toBe(true);

      await productsPage.goto();
      await productsPage.search(product.name);
      await productsPage.shouldSeeProduct(product.name);
    });
  });

  // ============================================
  // Validation
  // ============================================

  ownerTest.describe('Validation', () => {
    ownerTest('[P2-AC6] form stays open when name is missing', async () => {
      await productsPage.openCreateForm();

      // Fill only selling price, leave name empty
      await productsPage.page.locator('[data-testid="product-form-input-sellingPrice"]').fill('100');
      await productsPage.submitForm();

      const formStillVisible = await productsPage.shouldSeeForm();
      expect(formStillVisible).toBe(true);
    });

    ownerTest('[P2-AC6] form stays open when both required fields are empty', async () => {
      await productsPage.openCreateForm();

      // Submit completely empty form — both name and selling price missing
      await productsPage.submitForm();

      const formStillVisible = await productsPage.shouldSeeForm();
      expect(formStillVisible).toBe(true);
    });
  });
});
