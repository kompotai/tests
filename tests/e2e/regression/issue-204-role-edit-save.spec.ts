/**
 * Regression test for Issue #204
 * Role Edit / Save caused "Required" error because PATCH endpoint
 * required `permissions` field even when only updating description.
 *
 * Fix: Made `permissions` and `description` optional in the PATCH schema.
 *
 * @see https://github.com/kompotai/bug-reports/issues/204
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #204: Role Edit Save', { tag: ['@regression'] }, () => {
  const ROLES_URL = `/ws/${WORKSPACE_ID}/settings/access/roles`;

  ownerTest('editing role description should save without error @regression', async ({ page }) => {
    await page.goto(ROLES_URL);

    // Wait for roles table to load
    await page.locator('[data-testid="roles-list"]').waitFor({ timeout: 15000 });

    // Find an editable role (not owner/admin — they can't be edited)
    const editButton = page.locator('[data-testid*="-edit"]').first();
    const editExists = await editButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!editExists) {
      ownerTest.skip(true, 'No editable roles found in workspace');
      return;
    }

    // Click edit on the first editable role
    await editButton.click();

    // Wait for the role form to appear
    const form = page.locator('[data-testid="role-form"]');
    await expect(form).toBeVisible({ timeout: 5000 });

    // The description textarea should be visible and editable
    const descriptionField = page.locator('[data-testid="role-form-textarea-description"]');
    await expect(descriptionField).toBeVisible();

    // Modify the description
    const testDescription = `Test description ${Date.now()}`;
    await descriptionField.fill(testDescription);

    // Click save
    const submitButton = page.locator('[data-testid="role-form-button-submit"]');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // The form should close without error (no "Required" error)
    // If bug is present, an error banner appears inside the form
    const errorBanner = form.locator('.bg-red-50');
    await expect(errorBanner).not.toBeVisible({ timeout: 3000 });

    // Form should close (slide-over closes on success)
    await expect(form).not.toBeVisible({ timeout: 5000 });
  });

  ownerTest('role description should persist after save @regression', async ({ page }) => {
    await page.goto(ROLES_URL);

    // Wait for roles table to load
    await page.locator('[data-testid="roles-list"]').waitFor({ timeout: 15000 });

    // Find an editable role
    const editButton = page.locator('[data-testid*="-edit"]').first();
    const editExists = await editButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!editExists) {
      ownerTest.skip(true, 'No editable roles found in workspace');
      return;
    }

    // Click edit
    await editButton.click();

    const form = page.locator('[data-testid="role-form"]');
    await expect(form).toBeVisible({ timeout: 5000 });

    const descriptionField = page.locator('[data-testid="role-form-textarea-description"]');
    const uniqueDesc = `Regression test #204 — ${Date.now()}`;
    await descriptionField.fill(uniqueDesc);

    // Save
    await page.locator('[data-testid="role-form-button-submit"]').click();
    await expect(form).not.toBeVisible({ timeout: 5000 });

    // Re-open the same role and verify description was saved
    await editButton.click();
    await expect(form).toBeVisible({ timeout: 5000 });

    const savedDescription = await descriptionField.inputValue();
    expect(savedDescription).toBe(uniqueDesc);

    // Cancel to close
    await page.locator('[data-testid="role-form-button-cancel"]').click();
  });
});
