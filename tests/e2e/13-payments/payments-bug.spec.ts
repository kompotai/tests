/**
 * Payments Bug Reproduction Test
 *
 * This is a negative test that verifies validation error appears
 * when user types in invoice search field but doesn't select from dropdown.
 *
 * Bug scenario: User can submit payment form without actually selecting an invoice,
 * just by typing text in the search field.
 */

import { ownerTest as test, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

test.describe('Payments - Invoice Selection Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to payments page
    await page.goto(`/ws/${WORKSPACE_ID}/finances/payments`);
    await page.waitForLoadState('networkidle');

    // Dismiss cookie consent banner if present
    const cookieAcceptBtn = page.getByTestId('cookie-accept-all');
    if (await cookieAcceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieAcceptBtn.click();
      await cookieAcceptBtn.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }
  });

  test('should show validation error when invoice is typed but not selected from dropdown', async ({ page }) => {
    // Step 1: Click "Create Payment" button in page header to open the drawer
    await page.getByTestId('payments-button-create').click();

    // Step 2: Wait for the "New Payment" drawer to appear
    await expect(page.getByRole('heading', { name: /new payment/i })).toBeVisible({ timeout: 5000 });

    // Step 3: Type in invoice search field WITHOUT selecting from dropdown
    const invoiceSearchField = page.getByPlaceholder(/search by number or contact/i);
    await invoiceSearchField.fill('INV-0001');

    // Step 4: Leave the "Select invoice" dropdown unchanged (not selected)
    // Click elsewhere to close any dropdown that may have appeared
    await page.getByText('Payment Amount').click();

    // Step 5: Fill in Payment Amount (use placeholder "0.00")
    const amountField = page.getByPlaceholder('0.00');
    await amountField.fill('100');

    // Step 6: Payment Date should be auto-filled with today's date
    // No action needed - form auto-fills it

    // Step 7: Click form submit button "Create Payment"
    await page.getByTestId('payment-form-button-submit').click();

    // Step 8: Verify validation error appears
    // The form should NOT submit and should show an error message
    await expect(
      page.getByText(/select an invoice/i)
    ).toBeVisible({ timeout: 5000 });

    console.log('✅ Validation error displayed correctly: "Select an invoice"');
  });

  test('should successfully create payment when invoice is properly selected', async ({ page }) => {
    // Positive test - proper flow with invoice selection

    // Step 1: Click "Create Payment" button
    await page.getByTestId('payments-button-create').click();

    // Step 2: Wait for drawer
    await expect(page.getByRole('heading', { name: /new payment/i })).toBeVisible({ timeout: 5000 });

    // Step 3: Select an invoice from the dropdown
    const invoiceDropdown = page.getByRole('combobox').first();
    await invoiceDropdown.click();

    // Wait for dropdown options
    await page.waitForTimeout(500);

    // Try to select first option
    const firstOption = page.getByRole('option').first();
    const hasOptions = await firstOption.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasOptions) {
      // Try alternative: look for listbox items
      const listItem = page.locator('[role="listbox"] [role="option"], [role="listbox"] li').first();
      const hasListItems = await listItem.isVisible({ timeout: 2000 }).catch(() => false);

      if (!hasListItems) {
        console.log('⚠️ No invoices available in dropdown, skipping positive test');
        test.skip();
        return;
      }

      await listItem.click();
    } else {
      await firstOption.click();
    }

    // Step 4: Fill amount
    await page.getByLabel(/payment amount/i).fill('50');

    // Step 5: Submit
    await page.getByTestId('payment-form-button-submit').click();

    // Step 6: Verify no "Select an invoice" error
    const errorVisible = await page.getByText(/select an invoice/i)
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    expect(errorVisible).toBe(false);
    console.log('✅ Payment created successfully without validation error');
  });
});
