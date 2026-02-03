/**
 * Regression Test: Issue #159
 * Bug: Editing Agreement status does not react - page stays the same PATCH 500
 *
 * Problem: When editing an agreement's status, the API returned a 500 error with
 * "Invalid contact ID format". This happened because the API's toAgreementResponse
 * function was incorrectly handling populated contactId fields.
 *
 * Root Cause: When Mongoose populates a field (e.g., .populate('contactId', 'name')),
 * it replaces the ObjectId with an object { _id: '...', name: '...' }. The
 * toAgreementResponse function was calling .toString() on this object, which
 * returned "[object Object]" instead of the ID. When the form submitted this
 * back to the API, validation failed with "Invalid contact ID format".
 *
 * Fix: Updated toAgreementResponse in modules/workspace/agreement/controller.ts
 * to properly extract the ID from populated fields:
 * - Check if contactId/ownerId is an object with _id property
 * - If yes, extract _id.toString()
 * - Otherwise, use toString() on the original value
 *
 * @see https://github.com/kompotai/bug-reports/issues/159
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #159: Agreement Status Edit', () => {
  ownerTest('can edit agreement status without 500 error @regression @smoke', async ({ page }) => {
    // Navigate to agreements page
    await page.goto(`/ws/${WORKSPACE_ID}/agreements`);
    await page.waitForLoadState('networkidle');

    // Handle cookie consent if present
    const acceptCookies = page.getByRole('button', { name: 'Accept All' });
    if (await acceptCookies.isVisible({ timeout: 1000 }).catch(() => false)) {
      await acceptCookies.click();
      await page.waitForTimeout(300);
    }

    // Wait for table to load
    const table = page.locator('[data-testid="agreements-table"]');
    await expect(table).toBeVisible({ timeout: 10000 });

    // Find first agreement row with Draft status
    const draftRow = page.locator('tbody tr', {
      has: page.locator('text="Draft"')
    }).first();

    // If no draft agreements, skip test
    const hasDraft = await draftRow.isVisible({ timeout: 2000 }).catch(() => false);
    if (!hasDraft) {
      console.log('No draft agreements found, skipping test');
      return;
    }

    // Click edit button on first draft agreement
    const editButton = draftRow.getByTestId(/agreements-row-.*-edit/);
    await editButton.click();

    // Wait for edit form to appear
    await expect(page.getByRole('heading', { name: 'Edit Agreement' })).toBeVisible({ timeout: 5000 });

    // Change status from Draft to Pending Signature
    // Use nth(2) to select the Status combobox (Type is nth(1), Status is nth(2))
    const statusSelect = page.getByRole('combobox').nth(2);
    await statusSelect.selectOption('pending_signature');

    // Set up response listener before submitting
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/ws/${WORKSPACE_ID}/agreements/`) &&
        response.request().method() === 'PATCH',
      { timeout: 10000 }
    );

    // Submit the form
    await page.getByTestId('agreement-form-submit').click();

    // Wait for API response
    const response = await responsePromise;

    // THE KEY TEST: Verify the API didn't return a 500 error
    // Before the fix, this would fail with:
    // - Status: 500
    // - Error: "Invalid contact ID format"
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('id');
    expect(responseBody.status).toBe('pending_signature');

    // Verify the form closed (success indicator)
    await expect(page.getByRole('heading', { name: 'Edit Agreement' })).not.toBeVisible({ timeout: 5000 });

    // Verify the status updated in the table
    const updatedRow = page.locator(`tbody tr`, {
      has: page.locator(`text="${responseBody.number}"`)
    });
    await expect(updatedRow.locator('text="Pending Signature"')).toBeVisible({ timeout: 3000 });

    // Verify no error messages shown
    await expect(page.locator('text="Invalid contact ID format"')).not.toBeVisible();
    await expect(page.locator('text="500"')).not.toBeVisible();
  });
});
