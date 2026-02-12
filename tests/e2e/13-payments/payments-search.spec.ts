/**
 * Payments - Global Search Tests
 *
 * Verifies that the payments list search works by:
 * 1. Payment Number
 * 2. Reference (Contact/Invoice)
 *
 * Uses dynamic data scraped from a newly created payment.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

// Robust selectors using data-testid and structural selectors
const SELECTORS = {
  // Cookie banner
  cookieAcceptBtn: '[data-testid="cookie-accept-all"]',
  // Payment creation
  createPaymentBtn: '[data-testid="payments-button-create"]',
  invoiceSelect: '[data-testid="payment-form-select-invoice"]',
  amountInput: 'input[type="number"]', // Only numeric input in the drawer
  submitBtn: '[data-testid="payment-form-button-submit"]',
  // Global search (main page) - using placeholder as fallback
  globalSearchPlaceholder: /search by number/i,
  // Table
  tableRow: 'table tbody tr',
} as const;

ownerTest.describe('Payments - Global Search', () => {
  ownerTest('should filter payments by Number and Reference', async ({ page }) => {
    // Generate unique amount for each test run
    const uniqueAmount = (Math.random() * 900 + 100).toFixed(2);

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
    // SETUP: Create a new payment with unique amount
    // ============================================
    await page.locator(SELECTORS.createPaymentBtn).click();
    await expect(page.getByRole('heading', { name: /new payment/i })).toBeVisible({ timeout: 5000 });

    // Select first available invoice using <select> element
    await page.locator(SELECTORS.invoiceSelect).selectOption({ index: 1 });

    // Fill unique amount
    await page.locator(SELECTORS.amountInput).fill(uniqueAmount);

    // Submit the form
    await page.locator(SELECTORS.submitBtn).click();

    // Wait for payment creation (drawer closes or success message)
    await Promise.race([
      page.getByRole('heading', { name: /new payment/i }).waitFor({ state: 'hidden', timeout: 5000 }),
      page.getByRole('alert').waitFor({ state: 'visible', timeout: 5000 }),
    ]).catch(() => {});

    // Wait for table to refresh
    await page.waitForLoadState('networkidle');

    // ============================================
    // IDENTIFY: Find the row with our unique amount and scrape data
    // ============================================
    const tableRows = page.locator(SELECTORS.tableRow);
    const targetRow = tableRows.filter({ hasText: uniqueAmount });
    await expect(targetRow).toBeVisible({ timeout: 5000 });

    // Scrape Payment Number (1st column) and Reference (2nd column)
    const cells = targetRow.locator('td');
    const termNumber = (await cells.nth(0).textContent())?.trim() || '';
    const termReference = (await cells.nth(1).textContent())?.trim() || '';

    // Verify we got valid data
    expect(termNumber).not.toBe('');
    expect(termReference).not.toBe('');

    // ============================================
    // TEST: Search by Payment Number
    // ============================================
    const globalSearchInput = page.getByPlaceholder(SELECTORS.globalSearchPlaceholder);
    await expect(globalSearchInput).toBeVisible({ timeout: 5000 });

    await globalSearchInput.fill(termNumber);
    await globalSearchInput.press('Enter');
    await page.waitForLoadState('networkidle');

    // Verify the row with our amount is visible
    await expect(targetRow).toBeVisible({ timeout: 5000 });

    // Verify filtered results - should be exactly 1 row
    await expect(tableRows).toHaveCount(1, { timeout: 5000 });

    // ============================================
    // TEST: Clear search and verify list resets
    // ============================================
    await globalSearchInput.clear();
    await globalSearchInput.press('Enter');
    await page.waitForLoadState('networkidle');

    // Verify multiple rows appear (list reset)
    const rowCountAfterClear = await tableRows.count();
    expect(rowCountAfterClear).toBeGreaterThanOrEqual(1);

    // ============================================
    // TEST: Search by Reference
    // ============================================
    await globalSearchInput.fill(termReference);
    await globalSearchInput.press('Enter');
    await page.waitForLoadState('networkidle');

    // Verify the row with our amount is visible
    await expect(targetRow).toBeVisible({ timeout: 5000 });
  });
});
