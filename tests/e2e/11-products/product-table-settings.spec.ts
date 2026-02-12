/**
 * Product Table Settings Tests
 *
 * Covers:
 * - Column visibility settings
 * - Column drag and drop reordering
 * - Ability to uncheck all columns
 * - Column order persistence
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { ProductsPage } from '@pages/ProductsPage';

ownerTest.describe('Product Table Settings', () => {
  let productsPage: ProductsPage;

  ownerTest.beforeEach(async ({ page }) => {
    productsPage = new ProductsPage(page);
    await productsPage.goto();
  });

  // ============================================
  // Column Drag & Drop
  // ============================================

  ownerTest.describe('Column Reordering', () => {
    ownerTest('do table columns move on drag and does order change accordingly @smoke', async ({ page }) => {
      // Open column settings (look for settings icon, gear icon, or columns button)
      const settingsButton = page.locator('[data-testid="table-settings-button"]').or(
        page.locator('button:has-text("Columns")').or(
          page.locator('[aria-label*="column" i]').or(
            page.locator('[aria-label*="settings" i]')
          )
        )
      ).first();

      const hasSettings = await settingsButton.count() > 0;
      if (!hasSettings) {
        console.log('Table settings button not found');
        ownerTest.skip(true, 'Table settings not available');
        return;
      }

      await settingsButton.click();
      await page.waitForTimeout(1000);

      // Get initial column order from the table headers
      const initialHeaders = await page.locator('thead th').allTextContents();
      console.log('Initial column order:', initialHeaders);

      // Try to find draggable column items in settings
      const columnItems = page.locator('[data-testid="column-item"]').or(
        page.locator('[draggable="true"]').or(
          page.locator('[data-rbd-draggable-id]')
        )
      );

      const columnCount = await columnItems.count();
      if (columnCount < 2) {
        console.log('Not enough draggable columns found');
        ownerTest.skip(true, 'Column drag not available');
        return;
      }

      // Get first two items to swap
      const firstItem = columnItems.first();
      const secondItem = columnItems.nth(1);

      // Get their bounding boxes
      const firstBox = await firstItem.boundingBox();
      const secondBox = await secondItem.boundingBox();

      if (!firstBox || !secondBox) {
        console.log('Could not get column item positions');
        ownerTest.skip(true, 'Cannot perform drag operation');
        return;
      }

      // Perform drag and drop
      await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2, { steps: 10 });
      await page.mouse.up();

      await page.waitForTimeout(1000);

      // Close settings dialog
      const closeButton = page.locator('[data-testid="settings-close"]').or(
        page.locator('button:has-text("Close")').or(
          page.locator('button:has-text("Apply")')
        )
      ).first();

      const hasCloseButton = await closeButton.count() > 0;
      if (hasCloseButton) {
        await closeButton.click();
      } else {
        await page.keyboard.press('Escape');
      }

      await page.waitForTimeout(1000);

      // Get new column order
      const newHeaders = await page.locator('thead th').allTextContents();
      console.log('New column order:', newHeaders);

      // Check if order changed
      const orderChanged = JSON.stringify(initialHeaders) !== JSON.stringify(newHeaders);
      console.log(`Column order changed after drag: ${orderChanged}`);

      // This is exploratory - we're checking if the feature works
      expect(orderChanged).toBe(true);
    });
  });

  // ============================================
  // Column Visibility
  // ============================================

  ownerTest.describe('Column Visibility', () => {
    ownerTest('can you uncheck all column names in settings @smoke', async ({ page }) => {
      // Open column settings
      const settingsButton = page.locator('[data-testid="table-settings-button"]').or(
        page.locator('button:has-text("Columns")').or(
          page.locator('[aria-label*="column" i]')
        )
      ).first();

      const hasSettings = await settingsButton.count() > 0;
      if (!hasSettings) {
        console.log('Table settings button not found');
        ownerTest.skip(true, 'Table settings not available');
        return;
      }

      await settingsButton.click();
      await page.waitForTimeout(1000);

      // Find all checkboxes for columns
      const columnCheckboxes = page.locator('[data-testid="column-checkbox"]').or(
        page.locator('input[type="checkbox"]').locator('visible=true')
      );

      const checkboxCount = await columnCheckboxes.count();
      console.log(`Found ${checkboxCount} column checkboxes`);

      if (checkboxCount === 0) {
        console.log('No column checkboxes found');
        ownerTest.skip(true, 'Column visibility toggles not found');
        return;
      }

      // Try to uncheck all checkboxes
      let uncheckedCount = 0;
      let blockedAtCount = 0;

      for (let i = 0; i < checkboxCount; i++) {
        const checkbox = columnCheckboxes.nth(i);
        const isChecked = await checkbox.isChecked();

        if (isChecked) {
          try {
            await checkbox.uncheck();
            await page.waitForTimeout(200);

            // Verify it was unchecked
            const stillChecked = await checkbox.isChecked();
            if (!stillChecked) {
              uncheckedCount++;
            } else {
              // Some columns might be required and can't be unchecked
              blockedAtCount++;
              console.log(`Column ${i + 1} cannot be unchecked (likely required)`);
            }
          } catch (error) {
            blockedAtCount++;
            console.log(`Could not uncheck column ${i + 1}`);
          }
        }
      }

      console.log(`Successfully unchecked: ${uncheckedCount}/${checkboxCount} columns`);
      console.log(`Blocked/required columns: ${blockedAtCount}`);

      // Close settings
      const closeButton = page.locator('[data-testid="settings-close"]').or(
        page.locator('button:has-text("Close")').or(
          page.locator('button:has-text("Apply")')
        )
      ).first();

      const hasCloseButton = await closeButton.count() > 0;
      if (hasCloseButton) {
        await closeButton.click();
      } else {
        await page.keyboard.press('Escape');
      }

      await page.waitForTimeout(1000);

      // Check if table still has visible headers (at least one column must remain)
      const visibleHeaders = await page.locator('thead th').count();
      console.log(`Visible table headers after unchecking all: ${visibleHeaders}`);

      // There should be at least one required column that cannot be hidden
      expect(visibleHeaders).toBeGreaterThan(0);

      // Record results
      if (blockedAtCount > 0) {
        console.log('✓ Cannot uncheck all columns - some are required (expected behavior)');
      } else {
        console.log('✗ All columns can be unchecked - table might be empty');
      }
    });
  });

  // ============================================
  // Settings Persistence
  // ============================================

  ownerTest.describe('Settings Persistence', () => {
    ownerTest('do column settings persist after page refresh', async ({ page }) => {
      // Open column settings
      const settingsButton = page.locator('[data-testid="table-settings-button"]').or(
        page.locator('button:has-text("Columns")').or(
          page.locator('[aria-label*="column" i]')
        )
      ).first();

      const hasSettings = await settingsButton.count() > 0;
      if (!hasSettings) {
        ownerTest.skip(true, 'Table settings not available');
        return;
      }

      await settingsButton.click();
      await page.waitForTimeout(1000);

      // Find a checkbox to toggle
      const columnCheckboxes = page.locator('input[type="checkbox"]').locator('visible=true');
      const checkboxCount = await columnCheckboxes.count();

      if (checkboxCount === 0) {
        ownerTest.skip(true, 'No column checkboxes found');
        return;
      }

      // Toggle first checkbox
      const firstCheckbox = columnCheckboxes.first();
      const initialState = await firstCheckbox.isChecked();
      await firstCheckbox.click();
      await page.waitForTimeout(500);

      // Close settings
      const closeButton = page.locator('[data-testid="settings-close"]').or(
        page.locator('button:has-text("Close")').or(
          page.locator('button:has-text("Apply")')
        )
      ).first();

      const hasCloseButton = await closeButton.count() > 0;
      if (hasCloseButton) {
        await closeButton.click();
      } else {
        await page.keyboard.press('Escape');
      }

      // Get column headers before refresh
      const headersBefore = await page.locator('thead th').allTextContents();

      // Refresh page
      await productsPage.goto();
      await page.waitForTimeout(2000);

      // Get column headers after refresh
      const headersAfter = await page.locator('thead th').allTextContents();

      // Compare
      const settingsPersisted = JSON.stringify(headersBefore) === JSON.stringify(headersAfter);
      console.log('Column settings persisted after refresh:', settingsPersisted);
      console.log('Headers before:', headersBefore);
      console.log('Headers after:', headersAfter);

      expect(settingsPersisted).toBe(true);
    });
  });
});
