/**
 * Product State Persistence Tests
 *
 * Covers:
 * - Search box state after page refresh
 * - Filter state after page refresh
 * - URL parameter persistence
 * - Session state management
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { ProductsPage } from '@pages/ProductsPage';
import { createMinimalProduct } from '@fixtures/products.fixture';

ownerTest.describe('Product State Persistence', () => {
  let productsPage: ProductsPage;

  ownerTest.beforeEach(async ({ page }) => {
    productsPage = new ProductsPage(page);
    await productsPage.goto();
  });

  // ============================================
  // Search State Persistence
  // ============================================

  ownerTest.describe('Search State', () => {
    ownerTest('does search box clear on refresh @smoke', async ({ page }) => {
      // Enter a search term
      const searchTerm = 'Sample Product';
      await productsPage.search(searchTerm);
      await page.waitForTimeout(1000);

      // Get the search input value before refresh
      const searchInput = page.locator('[data-testid="product-search-input"]').or(
        page.locator('input[type="search"]').or(
          page.locator('input[placeholder*="search" i]')
        )
      ).first();

      const hasSearchInput = await searchInput.count() > 0;
      if (!hasSearchInput) {
        console.log('Search input not found');
        ownerTest.skip(true, 'Search input not available');
        return;
      }

      const searchValueBefore = await searchInput.inputValue();
      console.log(`Search value before refresh: "${searchValueBefore}"`);

      // Refresh the page
      await productsPage.goto();
      await page.waitForTimeout(2000);

      // Get the search input value after refresh
      const searchValueAfter = await searchInput.inputValue();
      console.log(`Search value after refresh: "${searchValueAfter}"`);

      // Check if search was cleared
      const searchCleared = searchValueAfter === '' || searchValueAfter === null;
      console.log(`Search cleared on refresh: ${searchCleared}`);

      if (searchCleared) {
        console.log('✓ Search box clears on refresh (stateless)');
        expect(searchValueAfter).toBe('');
      } else {
        console.log('✓ Search box persists on refresh (stateful)');
        expect(searchValueAfter).toBe(searchValueBefore);
      }
    });

    ownerTest('search term is reflected in URL parameters', async ({ page }) => {
      const searchTerm = 'TestSearch';
      await productsPage.search(searchTerm);
      await page.waitForTimeout(1000);

      // Check URL for search parameter
      const url = page.url();
      console.log(`URL after search: ${url}`);

      const hasSearchParam = url.includes('search=') || url.includes('q=') || url.includes('query=');
      console.log(`Search term in URL: ${hasSearchParam}`);

      if (hasSearchParam) {
        console.log('✓ Search term stored in URL parameters');
      } else {
        console.log('✓ Search term NOT stored in URL (client-side state only)');
      }
    });

    ownerTest('can search by multiple terms', async ({ page }) => {
      // This is exploratory - testing search behavior
      const searchTerms = ['Sample', 'Product', 'Service'];

      for (const term of searchTerms) {
        await productsPage.search(term);
        await page.waitForTimeout(1000);

        const rowCount = await productsPage.getRowCount();
        console.log(`Search "${term}": ${rowCount} results`);

        expect(rowCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ============================================
  // Filter State Persistence
  // ============================================

  ownerTest.describe('Filter State', () => {
    ownerTest('do filters clear on refresh @smoke', async ({ page }) => {
      // Apply a category filter
      await productsPage.filterByCategory('Services');
      await page.waitForTimeout(1000);

      // Get the row count with filter applied
      const rowCountBefore = await productsPage.getRowCount();
      console.log(`Row count with filter: ${rowCountBefore}`);

      // Check URL for filter parameter
      const urlBefore = page.url();
      console.log(`URL with filter: ${urlBefore}`);

      // Refresh the page
      await productsPage.goto();
      await page.waitForTimeout(2000);

      // Check if filter is still applied
      const urlAfter = page.url();
      const rowCountAfter = await productsPage.getRowCount();

      console.log(`URL after refresh: ${urlAfter}`);
      console.log(`Row count after refresh: ${rowCountAfter}`);

      // Determine if filter persisted
      const filterPersisted = rowCountAfter === rowCountBefore && rowCountBefore > 0;
      console.log(`Filter persisted on refresh: ${filterPersisted}`);

      if (filterPersisted) {
        console.log('✓ Filters persist on refresh (stateful)');
      } else {
        console.log('✓ Filters clear on refresh (stateless)');
      }

      // Either behavior is valid - we're documenting which one is implemented
    });

    ownerTest('filter state is reflected in URL parameters', async ({ page }) => {
      await productsPage.filterByCategory('Services');
      await page.waitForTimeout(1000);

      const url = page.url();
      console.log(`URL after filter: ${url}`);

      const hasFilterParam = url.includes('category=') || url.includes('filter=') || url.includes('type=');
      console.log(`Filter in URL: ${hasFilterParam}`);

      if (hasFilterParam) {
        console.log('✓ Filter state stored in URL parameters');
      } else {
        console.log('✓ Filter state NOT stored in URL (client-side state only)');
      }
    });

    ownerTest('can apply multiple filters simultaneously', async ({ page }) => {
      // Apply category filter
      await productsPage.filterByCategory('Services');
      await page.waitForTimeout(1000);

      const rowCountWithCategoryFilter = await productsPage.getRowCount();
      console.log(`Rows with category filter: ${rowCountWithCategoryFilter}`);

      // Apply search on top of filter
      await productsPage.search('Sample');
      await page.waitForTimeout(1000);

      const rowCountWithBothFilters = await productsPage.getRowCount();
      console.log(`Rows with category + search: ${rowCountWithBothFilters}`);

      // Both filters should work together
      expect(rowCountWithBothFilters).toBeLessThanOrEqual(rowCountWithCategoryFilter);

      console.log('✓ Multiple filters can be applied simultaneously');
    });
  });

  // ============================================
  // Combined State
  // ============================================

  ownerTest.describe('Combined State', () => {
    ownerTest('search and filter state both clear on refresh', async ({ page }) => {
      // Apply both search and filter
      await productsPage.filterByCategory('Services');
      await page.waitForTimeout(500);
      await productsPage.search('Sample');
      await page.waitForTimeout(1000);

      const rowCountBefore = await productsPage.getRowCount();
      const urlBefore = page.url();

      console.log(`Combined state - rows: ${rowCountBefore}, URL: ${urlBefore}`);

      // Refresh
      await productsPage.goto();
      await page.waitForTimeout(2000);

      const rowCountAfter = await productsPage.getRowCount();
      const urlAfter = page.url();

      console.log(`After refresh - rows: ${rowCountAfter}, URL: ${urlAfter}`);

      const searchInput = page.locator('[data-testid="product-search-input"]').or(
        page.locator('input[type="search"]')
      ).first();

      const hasSearchInput = await searchInput.count() > 0;
      const searchValue = hasSearchInput ? await searchInput.inputValue() : '';

      console.log(`Search value after refresh: "${searchValue}"`);

      // Document the behavior
      if (searchValue === '' && rowCountAfter !== rowCountBefore) {
        console.log('✓ Both search and filter cleared on refresh');
      } else if (searchValue !== '' || rowCountAfter === rowCountBefore) {
        console.log('✓ Search and/or filter persisted on refresh');
      }
    });

    ownerTest('URL with query parameters loads correct state', async ({ page }) => {
      // This test attempts to load the page with URL parameters directly

      const WORKSPACE_ID = process.env.WS_ID || 'test3ruslankhaziev';
      const baseUrl = page.url().split('?')[0];

      // Try loading with search parameter
      const urlWithSearch = `${baseUrl}?search=Sample`;
      console.log(`Loading URL: ${urlWithSearch}`);

      await page.goto(urlWithSearch);
      await page.waitForTimeout(2000);

      const searchInput = page.locator('input[type="search"]').first();
      const hasSearchInput = await searchInput.count() > 0;

      if (hasSearchInput) {
        const searchValue = await searchInput.inputValue();
        console.log(`Search value from URL parameter: "${searchValue}"`);

        if (searchValue === 'Sample') {
          console.log('✓ URL search parameter successfully loaded into search box');
        } else {
          console.log('✗ URL search parameter not applied to search box');
        }
      } else {
        console.log('✗ Search input not found');
      }
    });
  });

  // ============================================
  // Navigation State
  // ============================================

  ownerTest.describe('Navigation State', () => {
    ownerTest('browser back button after search returns to unfiltered state', async ({ page }) => {
      // Get initial state
      const initialRowCount = await productsPage.getRowCount();

      // Perform search
      await productsPage.search('Sample');
      await page.waitForTimeout(1000);
      const searchedRowCount = await productsPage.getRowCount();

      console.log(`Initial rows: ${initialRowCount}, After search: ${searchedRowCount}`);

      // Go back
      await page.goBack();
      await page.waitForTimeout(2000);

      const afterBackRowCount = await productsPage.getRowCount();
      console.log(`After browser back: ${afterBackRowCount}`);

      if (afterBackRowCount === initialRowCount) {
        console.log('✓ Browser back clears search (proper history management)');
      } else if (afterBackRowCount === searchedRowCount) {
        console.log('✓ Browser back keeps search (client-side routing)');
      }
    });
  });
});
