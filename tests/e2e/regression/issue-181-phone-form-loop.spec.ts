/**
 * Regression Test: Issue #181
 * Bug: Impossible to enter My workspaces
 *
 * Problem: When a user is in workspace context, the manage layout used the
 * workspace user ID to look up the manager user for phone verification.
 * This failed because the IDs don't match, causing the phone form to appear
 * in a loop even after successfully updating the phone.
 *
 * Fix: Layout now looks up the manager user by email as a fallback when
 * not found by ID.
 *
 * @see https://github.com/kompotai/bug-reports/issues/181
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';

ownerTest.describe('Issue #181: Phone Form Loop', () => {
  ownerTest('can access manage dashboard after phone update @regression', async ({ page, request }) => {
    // Navigate to manage dashboard
    await page.goto('/manage');
    await page.waitForLoadState('networkidle');

    // Check if we see the phone form or the dashboard
    const phoneForm = page.getByRole('heading', { name: 'Enter your phone number' });
    const isPhoneFormVisible = await phoneForm.isVisible({ timeout: 3000 }).catch(() => false);

    if (isPhoneFormVisible) {
      // If phone form is shown, enter a phone number and submit
      // Select country (US is default)
      const phoneInput = page.getByRole('textbox', { name: /phone number/i });
      await phoneInput.fill('2025551234');

      // Handle cookie consent if present
      const acceptCookies = page.getByRole('button', { name: 'Accept All' });
      if (await acceptCookies.isVisible({ timeout: 1000 }).catch(() => false)) {
        await acceptCookies.click();
        await page.waitForTimeout(300);
      }

      // Set up response listener
      const responsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/manage/auth/update-phone'),
        { timeout: 10000 }
      );

      // Submit the form
      await page.getByRole('button', { name: 'Continue' }).click();

      // Wait for API response
      const response = await responsePromise;
      expect(response.status()).toBe(200);

      // Wait for page reload
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    // THE KEY TEST: After phone form submission, dashboard should be visible
    // NOT the phone form again (which was the bug)
    // Check for dashboard navigation links (My Workspace, Workspaces, etc.)
    const workspacesLink = page.getByRole('link', { name: /My Workspace|Workspaces/i });
    await expect(workspacesLink.first()).toBeVisible({ timeout: 10000 });

    // Verify we're not stuck in a phone form loop
    const phoneFormAfter = page.getByRole('heading', { name: 'Enter your phone number' });
    await expect(phoneFormAfter).not.toBeVisible({ timeout: 2000 });
  });
});
