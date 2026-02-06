/**
 * Regression Test: Product Image Upload & Retrieval
 *
 * Bug: Product images appear broken after upload — img elements render but
 * their src URLs return empty pages / fail to load.
 *
 * This test covers the full round-trip:
 *   1. Create a product
 *   2. Upload an image via the file-upload zone in the edit form
 *   3. Save the product
 *   4. Reopen the edit form and verify the <img> is rendered
 *   5. Fetch the image src URL directly and assert it returns valid image content
 *
 * If step 5 fails (status !== 200 or content-type is not image/*), the bug is present.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { ProductsPage } from '@pages/ProductsPage';
import { createMinimalProduct } from '@fixtures/products.fixture';
import path from 'path';

const TEST_IMAGE = path.join(__dirname, '..', '..', '..', 'fixtures', 'files', 'test-image.png');

ownerTest.describe('Product Image Upload & Retrieval', () => {
  let productsPage: ProductsPage;

  ownerTest.beforeEach(async ({ page }) => {
    productsPage = new ProductsPage(page);
    await productsPage.goto();
  });

  ownerTest('uploaded image is rendered and its URL returns valid content', async ({ page }) => {
    // --- 1. Create a product (images require a saved product) ---
    const product = createMinimalProduct();
    const created = await productsPage.create(product);
    expect(created).toBe(true);

    // --- 2. Open the edit form ---
    await productsPage.goto();
    await productsPage.search(product.name);
    await productsPage.clickRowEdit(product.name);

    // --- 3. Upload an image via the file input ---
    const fileInput = page.locator('[data-testid="image-upload-zone"] input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE);

    // Wait for the upload to finish (network request completes)
    await page.waitForTimeout(3000);

    // --- 4. Save the product ---
    await productsPage.submitForm();

    // --- 5. Reopen edit form and verify the image rendered ---
    await productsPage.goto();
    await productsPage.search(product.name);
    await productsPage.clickRowEdit(product.name);
    await page.waitForTimeout(2000);

    const imgManager = page.locator('[data-testid="product-images-manager"]');
    const img = imgManager.locator('img').first();
    await expect(img).toBeVisible({ timeout: 10000 });

    // --- 6. Fetch the image src and verify it's valid ---
    const src = await img.getAttribute('src');
    expect(src, 'img src should not be empty').toBeTruthy();

    const response = await page.request.get(src!);
    expect(response.status(), `image URL returned ${response.status()}: ${src}`).toBe(200);

    const contentType = response.headers()['content-type'] || '';
    expect(contentType, `expected image/* content-type, got: ${contentType}`).toMatch(/image\//);

    const body = await response.body();
    expect(body.length, 'image response body should not be empty').toBeGreaterThan(0);
  });
});
