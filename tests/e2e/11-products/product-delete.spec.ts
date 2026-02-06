/**
 * Product Delete Tests
 *
 * Stories: P4 — Delete Product
 *
 * Covers:
 * - Delete button triggers a confirmation dialog
 * - Cancelling delete keeps the product in the list
 * - Confirming delete removes the product from the list
 *
 * Each test creates its own product so nothing pre-existing is touched.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { ProductsPage } from '@pages/ProductsPage';
import { createMinimalProduct } from '@fixtures/products.fixture';

ownerTest.describe('Product Delete', () => {
  let productsPage: ProductsPage;

  ownerTest.beforeEach(async ({ page }) => {
    productsPage = new ProductsPage(page);
    await productsPage.goto();
  });

  /** Helper: create a product, refresh, and search so it's visible despite pagination. */
  async function createAndRefresh() {
    const product = createMinimalProduct();
    const success = await productsPage.create(product);
    expect(success).toBe(true);
    await productsPage.goto();
    await productsPage.search(product.name);
    return product;
  }

  ownerTest('[P4-AC1] delete button triggers confirmation dialog', async () => {
    const product = await createAndRefresh();

    await productsPage.clickRowDelete(product.name);

    const dialogVisible = await productsPage.isConfirmDialogVisible();
    expect(dialogVisible).toBe(true);

    // Cancel so we don't actually delete
    await productsPage.cancelDialog();
  });

  ownerTest('[P4-AC2] cancelling delete keeps the product in the list', async () => {
    const product = await createAndRefresh();

    await productsPage.clickRowDelete(product.name);
    await productsPage.cancelDialog();

    // Product should still be visible
    await productsPage.shouldSeeProduct(product.name);
  });

  ownerTest('[P4-AC3] confirmed delete removes the product from the list', async () => {
    const product = await createAndRefresh();

    await productsPage.clickRowDelete(product.name);
    await productsPage.confirmDialog();

    // Wait for dialog to close — the app dismisses it only after the delete completes
    await productsPage.page.locator('[data-testid="confirm-dialog"]')
      .waitFor({ state: 'hidden', timeout: 5000 });
    await productsPage.wait(1000);

    // Reload, search for the deleted product, and verify it's gone
    await productsPage.goto();
    await productsPage.search(product.name);
    const count = await productsPage.getRowCount();
    expect(count).toBe(0);
  });
});
