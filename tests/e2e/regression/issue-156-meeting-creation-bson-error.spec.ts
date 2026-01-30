/**
 * Regression Test: Issue #156
 * Bug: New meeting creating form - internal server error
 *
 * Problem: Meeting creation failed with BSONError because the stripNulls function
 * was recursively processing ObjectId objects and converting them to plain objects
 * with buffer properties like { buffer: { '0': 105, '1': 124, ... } }.
 * This caused Mongoose to fail when trying to cast these objects back to ObjectId.
 *
 * Fix: Added check for ObjectId in stripNulls to prevent recursive processing:
 * !(value instanceof mongoose.Types.ObjectId)
 *
 * @see https://github.com/kompotai/bug-reports/issues/156
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';

ownerTest.describe('Issue #156: Meeting Creation BSONError', () => {
  ownerTest('can create a meeting without BSONError @regression @smoke', async ({ page, request }) => {
    // Navigate to meetings page
    await page.goto('/ws/meetings');
    await page.waitForLoadState('networkidle');

    // Handle cookie consent if present
    const acceptCookies = page.getByRole('button', { name: 'Accept All' });
    if (await acceptCookies.isVisible({ timeout: 1000 }).catch(() => false)) {
      await acceptCookies.click();
      await page.waitForTimeout(300);
    }

    // Click Create Meeting button (in header)
    await page.getByRole('button', { name: 'Create Meeting' }).first().click();

    // Wait for form to appear
    await expect(page.getByRole('heading', { name: 'New Meeting' })).toBeVisible();

    // Fill in the title with unique timestamp
    const meetingTitle = `Regression Test #156 - ${Date.now()}`;
    await page.getByRole('textbox', { name: 'Title*' }).fill(meetingTitle);

    // Select a contact
    await page.getByRole('combobox', { name: 'Contact *' }).click();
    await page.getByRole('option').first().click();

    // Change format to Phone Call (to avoid needing URL)
    await page.getByRole('combobox', { name: 'Format *' }).click();
    await page.getByRole('option', { name: 'Phone Call' }).click();

    // Wait a moment for UI to settle
    await page.waitForTimeout(500);

    // Set up response listener before clicking
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/meetings') && response.request().method() === 'POST',
      { timeout: 10000 }
    );

    // Find and click the submit button inside the form
    // The form has a button group with "Create Meeting" and "Cancel"
    const submitButton = page.locator('button', { hasText: 'Create Meeting' }).last();
    await submitButton.scrollIntoViewIfNeeded();
    await submitButton.click({ force: true });

    // Wait for API response
    const response = await responsePromise;
    const responseBody = await response.json();

    // THE KEY TEST: Verify the API didn't return a BSONError
    // Before the fix, this error would appear:
    // "Meeting validation failed: contactId: Cast to ObjectId failed for value { buffer: {...} }"
    expect(response.status()).toBe(201);
    expect(responseBody.id).toBeDefined();
    expect(responseBody).not.toHaveProperty('error');

    // Also verify no error is shown in UI
    const bsonError = page.locator('text=BSONError');
    await expect(bsonError).not.toBeVisible();

    const castError = page.locator('text=Cast to ObjectId failed');
    await expect(castError).not.toBeVisible();

    // Verify the form closed (success indicator)
    const formHeading = page.getByRole('heading', { name: 'New Meeting' });
    await expect(formHeading).not.toBeVisible({ timeout: 10000 });
  });
});
