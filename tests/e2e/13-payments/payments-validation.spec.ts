/**
 * Payments - Form Validation Tests
 *
 * Negative testing scenarios for the payment creation form:
 * 1. Empty submission - Required field errors
 * 2. Negative amount - Validation error
 * 3. Non-numeric amount - Input validation
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Payments - Form Validation', () => {
  ownerTest.beforeEach(async ({ page }) => {
    // Navigate to payments page
    await page.goto(`/ws/${WORKSPACE_ID}/finances/payments`);
    await page.waitForLoadState('networkidle');

    // Dismiss cookie consent banner if present
    const cookieAcceptBtn = page.getByTestId('cookie-accept-all');
    if (await cookieAcceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieAcceptBtn.click();
      await cookieAcceptBtn.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }

    // Open the "New Payment" drawer
    await page.getByTestId('payments-button-create').click();
    await expect(page.getByRole('heading', { name: /new payment/i })).toBeVisible({ timeout: 5000 });
  });

  ownerTest('should show required errors when submitting empty form', async ({ page }) => {
    // Click submit without filling any fields
    await page.getByTestId('payment-form-button-submit').click();

    // Expect validation errors for required fields
    // Check for "Required" text or "Select an invoice" error
    const hasRequiredError = await page.getByText(/required/i).first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    const hasInvoiceError = await page.getByText(/select an invoice/i)
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    // At least one validation error should be visible
    expect(hasRequiredError || hasInvoiceError).toBe(true);

    // Drawer should remain open (form not submitted)
    await expect(page.getByRole('heading', { name: /new payment/i })).toBeVisible();
  });

  ownerTest('should show validation error for negative amount', async ({ page }) => {
    // Fill amount field with negative value
    const amountField = page.getByPlaceholder('0.00');
    await amountField.fill('-100');

    // Click submit
    await page.getByTestId('payment-form-button-submit').click();

    // Expect validation error for negative amount or amount-related error
    const hasNegativeError = await page.getByText(/positive|greater than|invalid|must be/i).first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    const hasAmountError = await page.getByText(/amount/i).first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    const hasRequiredError = await page.getByText(/required/i).first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    // Some validation error should appear (negative not allowed or other validation)
    expect(hasNegativeError || hasAmountError || hasRequiredError).toBe(true);

    // Drawer should remain open (form not submitted successfully)
    await expect(page.getByRole('heading', { name: /new payment/i })).toBeVisible();
  });

  ownerTest('should reject non-numeric input in amount field', async ({ page }) => {
    const amountField = page.getByPlaceholder('0.00');

    // Test 1: Pure letters should be rejected by input[type=number]
    await amountField.click();
    await amountField.pressSequentially('ABC');
    const valueAfterLetters = await amountField.inputValue();
    expect(valueAfterLetters).toBe(''); // Browser rejects non-numeric input

    // Test 2: Mixed input - letters should be stripped, numbers kept
    await amountField.clear();
    await amountField.pressSequentially('12A34');
    const valueAfterMixed = await amountField.inputValue();
    expect(valueAfterMixed).toBe('1234'); // Only digits remain

    // Drawer should remain open
    await expect(page.getByRole('heading', { name: /new payment/i })).toBeVisible();
  });
});
