/**
 * Payments - Delete Tests
 *
 * Verifies that a user can:
 * 1. Find an existing payment via Global Search
 * 2. Delete it
 * 3. Verify it no longer appears in search results
 *
 * Handles BOTH:
 * - Native browser dialogs (window.confirm)
 * - Custom HTML modals ([role="dialog"])
 *
 * Uses existing data from the table (does NOT create new payments).
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

// Robust selectors
const SELECTORS = {
  // Cookie banner
  cookieAcceptBtn: '[data-testid="cookie-accept-all"]',
  // Table
  tableRow: 'table tbody tr',
  tableCell: 'td',
  // Actions - last button in row is typically Delete
  rowActionButton: 'button',
  // Global search
  globalSearchPlaceholder: /search by number/i,
  // Modal (for custom HTML modals)
  modal: '[role="dialog"]',
} as const;

ownerTest.describe('Payments - Delete', () => {
  ownerTest('should find and delete an existing payment', async ({ page }) => {
    // ============================================
    // SETUP: Navigate to Payments page
    // ============================================
    await page.goto(`/ws/${WORKSPACE_ID}/finances/payments`);
    await page.waitForLoadState('networkidle');

    // Dismiss cookie consent banner if present
    const cookieAcceptBtn = page.locator(SELECTORS.cookieAcceptBtn);
    if (await cookieAcceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieAcceptBtn.click();
      await cookieAcceptBtn.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }

    // ============================================
    // SETUP: Verify table has data and scrape first payment
    // ============================================
    const tableRows = page.locator(SELECTORS.tableRow);
    const rowCount = await tableRows.count();

    // Fail gracefully if no payments exist
    if (rowCount === 0) {
      throw new Error('No payments to delete. Test requires at least 1 existing payment.');
    }

    // Scrape Payment Number from first row, first column
    const firstRow = tableRows.first();
    const paymentNumber = (await firstRow.locator(SELECTORS.tableCell).nth(0).textContent())?.trim() || '';

    // Verify we got valid data
    expect(paymentNumber).not.toBe('');

    // ============================================
    // SEARCH: Filter by Payment Number
    // ============================================
    const globalSearchInput = page.getByPlaceholder(SELECTORS.globalSearchPlaceholder);
    await expect(globalSearchInput).toBeVisible({ timeout: 5000 });

    await globalSearchInput.fill(paymentNumber);
    await globalSearchInput.press('Enter');
    await page.waitForLoadState('networkidle');

    // Verify filtered to exactly 1 row
    await expect(tableRows).toHaveCount(1, { timeout: 5000 });

    // ============================================
    // PREPARE: Set up native dialog handler (window.confirm)
    // ============================================
    // This listener auto-accepts native browser dialogs
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    // ============================================
    // DELETE: Click delete button on the filtered row
    // ============================================
    const filteredRow = tableRows.first();
    const deleteButton = filteredRow.locator(SELECTORS.rowActionButton).last();

    await expect(deleteButton).toBeVisible({ timeout: 5000 });
    await deleteButton.click();

    // ============================================
    // HANDLE: Custom modal OR native dialog
    // ============================================
    // Check if a custom modal appears (some apps use HTML modals)
    const modal = page.locator(SELECTORS.modal);
    const hasCustomModal = await modal.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasCustomModal) {
      // Handle custom HTML modal
      const confirmButton = modal.getByRole('button', { name: /delete|confirm|yes/i });
      await expect(confirmButton).toBeVisible({ timeout: 3000 });
      await confirmButton.click();

      // Wait for modal to close
      await expect(modal).toBeHidden({ timeout: 5000 });
    }
    // If no custom modal, native dialog was already handled by the listener

    // ============================================
    // WAIT: For deletion to complete
    // ============================================
    await page.waitForLoadState('networkidle');

    // ============================================
    // VERIFICATION: Table should now be empty (filtered result)
    // ============================================
    // Since we filtered by specific payment ID and deleted it,
    // the search result should now show 0 rows
    await expect(tableRows).toHaveCount(0, { timeout: 5000 });
  });
});
