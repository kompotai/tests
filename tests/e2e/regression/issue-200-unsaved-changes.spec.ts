/**
 * Regression test for Issue #200
 * Users could accidentally close forms (ESC, backdrop, X button)
 * losing all entered data without any warning.
 *
 * Fix: SlideOver now shows a confirmation dialog when isDirty=true.
 * Forms report dirty state via onDirtyChange callback.
 * Only user-initiated changes trigger the dialog (not programmatic setValue).
 *
 * @see https://github.com/kompotai/bug-reports/issues/200
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #200: Unsaved Changes Confirmation', { tag: ['@regression'] }, () => {
  ownerTest('closing form without changes should NOT show confirmation @regression', async ({ page }) => {
    await page.goto(`/ws/${WORKSPACE_ID}/contacts`);

    // Open QuickCreate menu
    const quickCreateBtn = page.locator('[data-testid="quick-create-button"]');
    await quickCreateBtn.waitFor({ state: 'visible', timeout: 15000 });
    await quickCreateBtn.click();

    // Click Contact
    const contactItem = page.locator('[data-testid="quick-create-item-contact"]');
    await contactItem.waitFor({ state: 'visible', timeout: 5000 });
    await contactItem.click();

    // Wait for form to load
    const form = page.locator('[data-testid="contact-form"]');
    await form.waitFor({ state: 'visible', timeout: 5000 });

    // Wait for programmatic setValue to complete (owner auto-assignment)
    await page.waitForTimeout(1000);

    // Press ESC without making any changes
    await page.keyboard.press('Escape');

    // Confirm dialog should NOT appear
    const confirmDialog = page.locator('[data-testid="confirm-dialog"]');
    await expect(confirmDialog).not.toBeVisible({ timeout: 1000 });

    // SlideOver should be closed
    const slideOverClose = page.locator('[data-testid="slide-over-close"]');
    await expect(slideOverClose).not.toBeVisible({ timeout: 1000 });
  });

  ownerTest('closing form WITH changes should show confirmation dialog @regression', async ({ page }) => {
    await page.goto(`/ws/${WORKSPACE_ID}/contacts`);

    // Open QuickCreate > Contact
    const quickCreateBtn = page.locator('[data-testid="quick-create-button"]');
    await quickCreateBtn.waitFor({ state: 'visible', timeout: 15000 });
    await quickCreateBtn.click();

    const contactItem = page.locator('[data-testid="quick-create-item-contact"]');
    await contactItem.waitFor({ state: 'visible', timeout: 5000 });
    await contactItem.click();

    // Wait for form
    const nameInput = page.locator('[data-testid="contact-form-input-name"]');
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });

    // Type in the name field (user-initiated change)
    await nameInput.fill('Test Unsaved Changes #200');

    // Press ESC
    await page.keyboard.press('Escape');

    // Confirm dialog SHOULD appear
    const confirmDialog = page.locator('[data-testid="confirm-dialog"]');
    await expect(confirmDialog).toBeVisible({ timeout: 3000 });

    // Verify dialog has correct title
    const dialogTitle = confirmDialog.locator('h3');
    await expect(dialogTitle).toBeVisible();
  });

  ownerTest('"Keep editing" should dismiss dialog and keep form open @regression', async ({ page }) => {
    await page.goto(`/ws/${WORKSPACE_ID}/contacts`);

    // Open QuickCreate > Contact
    const quickCreateBtn = page.locator('[data-testid="quick-create-button"]');
    await quickCreateBtn.waitFor({ state: 'visible', timeout: 15000 });
    await quickCreateBtn.click();

    const contactItem = page.locator('[data-testid="quick-create-item-contact"]');
    await contactItem.waitFor({ state: 'visible', timeout: 5000 });
    await contactItem.click();

    // Fill name
    const nameInput = page.locator('[data-testid="contact-form-input-name"]');
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill('Keep Editing Test #200');

    // Press ESC to trigger dialog
    await page.keyboard.press('Escape');

    // Click "Keep editing" (cancel button in confirm dialog)
    const keepEditingBtn = page.locator('[data-testid="confirm-dialog-button-cancel"]');
    await expect(keepEditingBtn).toBeVisible({ timeout: 3000 });
    await keepEditingBtn.click();

    // Dialog should close
    const confirmDialog = page.locator('[data-testid="confirm-dialog"]');
    await expect(confirmDialog).not.toBeVisible({ timeout: 1000 });

    // Form should still be open with data preserved
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue('Keep Editing Test #200');
  });

  ownerTest('"Discard changes" should close form completely @regression', async ({ page }) => {
    await page.goto(`/ws/${WORKSPACE_ID}/contacts`);

    // Open QuickCreate > Contact
    const quickCreateBtn = page.locator('[data-testid="quick-create-button"]');
    await quickCreateBtn.waitFor({ state: 'visible', timeout: 15000 });
    await quickCreateBtn.click();

    const contactItem = page.locator('[data-testid="quick-create-item-contact"]');
    await contactItem.waitFor({ state: 'visible', timeout: 5000 });
    await contactItem.click();

    // Fill name
    const nameInput = page.locator('[data-testid="contact-form-input-name"]');
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill('Discard Test #200');

    // Press ESC to trigger dialog
    await page.keyboard.press('Escape');

    // Click "Discard changes" (confirm button in confirm dialog)
    const discardBtn = page.locator('[data-testid="confirm-dialog-button-confirm"]');
    await expect(discardBtn).toBeVisible({ timeout: 3000 });
    await discardBtn.click();

    // Everything should be closed
    const confirmDialog = page.locator('[data-testid="confirm-dialog"]');
    await expect(confirmDialog).not.toBeVisible({ timeout: 1000 });

    const slideOverClose = page.locator('[data-testid="slide-over-close"]');
    await expect(slideOverClose).not.toBeVisible({ timeout: 1000 });
  });
});
