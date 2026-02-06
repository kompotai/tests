/**
 * Regression Test: Product List Pagination Clipped by overflow-hidden
 *
 * Bug: The products table wrapper has `overflow-hidden` on an ancestor div
 * (`flex-1 -mx-6 -my-6 overflow-hidden`), which clips the pagination bar
 * below the visible area. Users see "Showing 1 to N of M" and Next/Prev
 * buttons in the DOM, but they are unreachable — no scroll, no way to
 * navigate past page 1.
 *
 * Fix: Change `overflow-hidden` → `overflow-y-auto` (or remove it) on that
 * wrapper so the content scrolls to the pagination controls.
 *
 * This test will pass once the fix is deployed.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { ProductsPage } from '@pages/ProductsPage';

ownerTest.describe('Product Pagination Visibility', () => {
  let productsPage: ProductsPage;

  ownerTest.beforeEach(async ({ page }) => {
    productsPage = new ProductsPage(page);
    await productsPage.goto();
  });

  ownerTest('pagination bar is reachable when table has more than 20 products', async ({ page }) => {
    // Prerequisite: workspace must have > 20 products total.
    // The "Products" category alone has 20 seeded items plus the sample products.
    const totalRows = await productsPage.getRowCount();
    ownerTest.skip(totalRows < 20, `Only ${totalRows} rows on page 1 — need > 20 products in workspace`);

    // The pagination bar is in the DOM — locate it via the "Showing X to Y of Z" text
    const paginationBar = page.locator('div.mt-4.px-2').filter({ hasText: /Showing \d+ to \d+ of \d+/ });
    await expect(paginationBar).toHaveCount(1);

    // Core assertion: the pagination bar must be within the visible viewport.
    // The bug is that an ancestor has `overflow-hidden`, which clips the bar
    // off-screen. Playwright's toBeVisible() does NOT detect overflow clipping,
    // so we check the bounding rect directly.
    const isInViewport = await paginationBar.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight;
    });
    expect(isInViewport, 'Pagination bar is clipped below the viewport by an overflow-hidden ancestor').toBe(true);

    // Next button (second button; first is Prev, disabled on page 1) must be clickable
    const nextBtn = paginationBar.locator('button').nth(1);
    await expect(nextBtn).not.toBeDisabled();
    await nextBtn.click();
    await page.waitForTimeout(1500);

    // Confirm navigation worked — now on page 2
    await expect(paginationBar).toHaveText(/Page 2 of/);
  });
});
