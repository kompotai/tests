/**
 * Regression Test: Issue #183
 * Bug: As a Technician: Created meeting is not shown at the Meetings table, but status 201
 *
 * Problem: After creating a meeting, the table did not update automatically.
 * The meeting was successfully created (status 201), but users had to reload
 * the page to see it in the table.
 *
 * Root Cause: MeetingsTable component was missing event listeners for
 * 'meetingCreated' and 'meetingUpdated' events that are dispatched by MeetingForm.
 *
 * Fix: Added useEffect with event listeners following the pattern used in
 * other tables (EventsTable, TasksTable, JobsTable, etc.):
 * - Listen to 'meetingCreated' and 'meetingUpdated' events
 * - Call fetchMeetings() when events are received
 * - Clean up listeners on unmount
 *
 * @see https://github.com/kompotai/bug-reports/issues/183
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #183: Meeting Table Auto-Update', () => {
  ownerTest('meeting appears in table immediately after creation without page reload @regression @smoke', async ({ page }) => {
    // Navigate to meetings page
    await page.goto(`/ws/${WORKSPACE_ID}/meetings`);
    await page.waitForLoadState('networkidle');

    // Handle cookie consent if present
    const acceptCookies = page.getByRole('button', { name: 'Accept All' });
    if (await acceptCookies.isVisible({ timeout: 1000 }).catch(() => false)) {
      await acceptCookies.click();
      await page.waitForTimeout(300);
    }

    // Get initial count of meetings in the table
    const tableBody = page.locator('[data-testid="meetings-table"] tbody');
    const initialRows = await tableBody.locator('tr').count();

    // Click Create Meeting button
    await page.getByTestId('meetings-button-create').click();

    // Wait for form to appear
    await expect(page.getByRole('heading', { name: 'New Meeting' })).toBeVisible();

    // Fill in the form with unique timestamp
    const meetingTitle = `Regression Test #183 - ${Date.now()}`;
    await page.getByTestId('meeting-form-input-title').fill(meetingTitle);

    // Select a contact
    await page.getByRole('combobox', { name: 'Contact *' }).click();
    await page.getByRole('option').first().click();

    // Change format to Phone Call (to avoid needing URL)
    await page.getByRole('combobox', { name: 'Format *' }).click();
    await page.getByRole('option', { name: 'Phone Call' }).click();

    // Set up response listener before submitting
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/ws/megatest/meetings') && response.request().method() === 'POST',
      { timeout: 10000 }
    );

    // Submit the form
    await page.getByTestId('meeting-form-button-submit').click();

    // Wait for API response
    const response = await responsePromise;
    expect(response.status()).toBe(201);

    // THE KEY TEST: Verify the table updates WITHOUT page reload
    // Wait for the new row to appear in the table
    await expect(tableBody.locator('tr')).toHaveCount(initialRows + 1, { timeout: 5000 });

    // Verify the new meeting appears in the table with the correct title
    const newMeetingRow = page.locator(`[data-testid="meetings-table"] tbody tr`, {
      has: page.locator(`text="${meetingTitle}"`)
    });
    await expect(newMeetingRow).toBeVisible({ timeout: 3000 });

    // Verify form is closed (success indicator)
    await expect(page.getByRole('heading', { name: 'New Meeting' })).not.toBeVisible({ timeout: 5000 });

    // Additional verification: Check that we can see the meeting details in the row
    await expect(newMeetingRow.locator('text="Phone Call"')).toBeVisible();
    await expect(newMeetingRow.locator('text="Scheduled"')).toBeVisible();

    // CRITICAL: Verify NO page reload occurred by checking page load count
    // If the page reloaded, the test would fail because the listeners wouldn't work
    const navigationCount = await page.evaluate(() => window.performance.navigation.type);
    expect(navigationCount).toBe(0); // 0 = TYPE_NAVIGATE (normal load), not TYPE_RELOAD
  });
});
