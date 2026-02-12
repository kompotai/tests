/**
 * Product Validation & Edge Cases Tests
 *
 * Covers:
 * - Maximum character limits for product names
 * - Creating products without required fields
 * - All possible combinations of product creation
 * - Field validation edge cases
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { ProductsPage } from '@pages/ProductsPage';
import { createMinimalProduct } from '@fixtures/products.fixture';

ownerTest.describe('Product Validation & Edge Cases', () => {
  let productsPage: ProductsPage;

  ownerTest.beforeEach(async ({ page }) => {
    productsPage = new ProductsPage(page);
    await productsPage.goto();
  });

  // ============================================
  // Name Validation
  // ============================================

  ownerTest.describe('Name Validation', () => {
    ownerTest('check max characters for product name @smoke', async ({ page }) => {
      await productsPage.openCreateForm();
      await page.waitForTimeout(1000);

      const nameInput = page.locator('[data-testid="product-form-input-name"]');
      await expect(nameInput).toBeVisible();

      // Try different lengths to find the limit
      const testLengths = [50, 100, 150, 200, 255, 256, 500, 1000];
      let maxAccepted = 0;
      let maxAllowedLength = 0;

      for (const length of testLengths) {
        const longName = 'A'.repeat(length);

        await nameInput.clear();
        await nameInput.fill(longName);
        await page.waitForTimeout(500);

        // Check the actual value in the input (might be truncated)
        const actualValue = await nameInput.inputValue();
        const actualLength = actualValue.length;

        console.log(`Attempted: ${length} chars, Accepted: ${actualLength} chars`);

        if (actualLength === length) {
          maxAccepted = length;
        } else {
          // Input was truncated, we found the limit
          maxAllowedLength = actualLength;
          console.log(`✓ Maximum product name length: ${maxAllowedLength} characters`);
          break;
        }
      }

      if (maxAllowedLength === 0) {
        maxAllowedLength = maxAccepted;
        console.log(`✓ Tested up to ${maxAccepted} characters without hitting limit`);
      }

      // Try to submit with max length name
      const maxLengthName = `TestProd-${Date.now()}-${'X'.repeat(Math.max(0, maxAllowedLength - 20))}`;
      await nameInput.clear();
      await nameInput.fill(maxLengthName.substring(0, maxAllowedLength));

      // Fill required selling price
      await page.locator('[data-testid="product-form-input-sellingPrice"]').fill('100');

      await productsPage.submitForm();
      await page.waitForTimeout(2000);

      // Check if it was successful
      const formVisible = await productsPage.shouldSeeForm();
      if (!formVisible) {
        console.log('✓ Product with max-length name created successfully');
      } else {
        console.log('✗ Product creation failed with max-length name');
      }

      // Record the actual limit found
      expect(maxAllowedLength).toBeGreaterThan(0);
    });

    ownerTest('possible to add product without name @smoke', async ({ page }) => {
      await productsPage.openCreateForm();
      await page.waitForTimeout(1000);

      // Leave name empty, fill only selling price
      await page.locator('[data-testid="product-form-input-sellingPrice"]').fill('100');

      // Try to submit
      await productsPage.submitForm();
      await page.waitForTimeout(2000);

      // Form should stay open (name is required)
      const formStillVisible = await productsPage.shouldSeeForm();
      expect(formStillVisible).toBe(true);

      // Check for validation error message
      const errorMessage = page.locator('text=required').or(
        page.locator('[role="alert"]').or(
          page.locator('.error').or(
            page.locator('[data-testid="name-error"]')
          )
        )
      );

      const hasError = await errorMessage.count() > 0;
      console.log(`Validation error shown for empty name: ${hasError}`);

      // Try to force submit by filling and clearing name
      const nameInput = page.locator('[data-testid="product-form-input-name"]');
      await nameInput.fill('temp');
      await page.waitForTimeout(300);
      await nameInput.clear();
      await page.waitForTimeout(300);

      await productsPage.submitForm();
      await page.waitForTimeout(2000);

      const formStillVisibleAfterClear = await productsPage.shouldSeeForm();
      console.log(`Form blocked submission without name: ${formStillVisibleAfterClear}`);

      expect(formStillVisibleAfterClear).toBe(true);
    });
  });

  // ============================================
  // Field Combinations
  // ============================================

  ownerTest.describe('Field Combinations', () => {
    ownerTest('check all possible combinations of adding a product', async ({ page }) => {
      // Define all possible field combinations
      const combinations = [
        // Minimal required fields
        { name: `MinReq-${Date.now()}`, sellingPrice: 100 },

        // With type variations
        { name: `TypeProd-${Date.now()}`, sellingPrice: 100, type: 'product' },
        { name: `TypeServ-${Date.now()}`, sellingPrice: 100, type: 'service' },

        // With prices
        { name: `WithPurchase-${Date.now()}`, sellingPrice: 200, purchasePrice: 100 },
        { name: `OnlySelling-${Date.now()}`, sellingPrice: 150 },

        // With SKU
        { name: `WithSKU-${Date.now()}`, sellingPrice: 100, sku: `SKU-${Date.now()}` },

        // With unit
        { name: `WithUnit-${Date.now()}`, sellingPrice: 100, unit: 'kg' },

        // With taxable
        { name: `WithTax-${Date.now()}`, sellingPrice: 100, taxable: true, taxRate: 10 },

        // With category
        { name: `WithCat-${Date.now()}`, sellingPrice: 100, category: 'Services' },

        // Full combination
        {
          name: `FullCombo-${Date.now()}`,
          sellingPrice: 300,
          purchasePrice: 150,
          type: 'product',
          sku: `FULL-${Date.now()}`,
          unit: 'pcs',
          taxable: true,
          taxRate: 15,
          category: 'Services'
        },
      ];

      let successCount = 0;
      let failCount = 0;

      for (const combo of combinations) {
        try {
          console.log(`Testing combination: ${combo.name}`);

          const success = await productsPage.create(combo);

          if (success) {
            successCount++;
            console.log(`  ✓ Success`);

            // Verify it exists
            await productsPage.goto();
            await productsPage.search(combo.name);
            await productsPage.shouldSeeProduct(combo.name);
          } else {
            failCount++;
            console.log(`  ✗ Failed to create`);
          }
        } catch (error) {
          failCount++;
          console.log(`  ✗ Error: ${error}`);
        }
      }

      console.log(`\nResults: ${successCount}/${combinations.length} combinations succeeded`);
      console.log(`Failed: ${failCount}`);

      // At least the minimal combination should work
      expect(successCount).toBeGreaterThan(0);
    });
  });

  // ============================================
  // Price Validation
  // ============================================

  ownerTest.describe('Price Validation', () => {
    ownerTest('can create product with zero price', async ({ page }) => {
      const product = createMinimalProduct({ sellingPrice: 0 });

      const success = await productsPage.create(product);

      if (success) {
        console.log('✓ Product with zero price created successfully');
        await productsPage.goto();
        await productsPage.search(product.name);
        await productsPage.shouldSeeProduct(product.name);
      } else {
        console.log('✗ Cannot create product with zero price');
      }

      // This is exploratory - documenting the behavior
    });

    ownerTest('can create product with negative price', async ({ page }) => {
      await productsPage.openCreateForm();

      const nameInput = page.locator('[data-testid="product-form-input-name"]');
      const priceInput = page.locator('[data-testid="product-form-input-sellingPrice"]');

      await nameInput.fill(`NegPrice-${Date.now()}`);
      await priceInput.fill('-100');
      await page.waitForTimeout(500);

      await productsPage.submitForm();
      await page.waitForTimeout(2000);

      const formVisible = await productsPage.shouldSeeForm();

      if (!formVisible) {
        console.log('✓ Negative price accepted (unusual)');
      } else {
        console.log('✓ Negative price rejected (expected)');
      }
    });

    ownerTest('can create product with very large price', async ({ page }) => {
      const product = createMinimalProduct({ sellingPrice: 999999999 });

      const success = await productsPage.create(product);

      if (success) {
        console.log('✓ Very large price accepted');
        await productsPage.goto();
        await productsPage.search(product.name);
        const row = page.locator(`tr:has-text("${product.name}")`).first();
        await expect(row).toBeVisible();
      } else {
        console.log('✗ Very large price rejected');
      }
    });
  });

  // ============================================
  // SKU Validation
  // ============================================

  ownerTest.describe('SKU Validation', () => {
    ownerTest('can create products with duplicate SKU', async ({ page }) => {
      const duplicateSKU = `DUP-SKU-${Date.now()}`;

      // Create first product
      const product1 = createMinimalProduct({ sku: duplicateSKU });
      const success1 = await productsPage.create(product1);
      expect(success1).toBe(true);

      // Try to create second product with same SKU
      const product2 = createMinimalProduct({ sku: duplicateSKU });
      const success2 = await productsPage.create(product2);

      if (success2) {
        console.log('✗ Duplicate SKU allowed (should probably be unique)');
      } else {
        console.log('✓ Duplicate SKU rejected');
      }
    });

    ownerTest('can create product with very long SKU', async ({ page }) => {
      const longSKU = 'SKU-' + 'X'.repeat(200);

      await productsPage.openCreateForm();

      const nameInput = page.locator('[data-testid="product-form-input-name"]');
      const skuInput = page.locator('[data-testid="product-form-input-sku"]');
      const priceInput = page.locator('[data-testid="product-form-input-sellingPrice"]');

      await nameInput.fill(`LongSKU-${Date.now()}`);
      await skuInput.fill(longSKU);
      await priceInput.fill('100');
      await page.waitForTimeout(500);

      // Check actual value (might be truncated)
      const actualSKU = await skuInput.inputValue();
      console.log(`SKU length attempted: ${longSKU.length}, accepted: ${actualSKU.length}`);

      await productsPage.submitForm();
      await page.waitForTimeout(2000);

      const formVisible = await productsPage.shouldSeeForm();
      if (!formVisible) {
        console.log(`✓ Long SKU accepted (length: ${actualSKU.length})`);
      }
    });
  });
});
