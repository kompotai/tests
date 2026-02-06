/**
 * Regression Tests: Issues #196, #197, #198
 *
 * #196: Edit Project — Contact field shows internal ID instead of name
 * #197: Team Members selection limited to one instead of multiple
 * #198: Contact auto-filled from Opportunity shows ID instead of name
 *
 * @see https://github.com/kompotai/bug-reports/issues/196
 * @see https://github.com/kompotai/bug-reports/issues/197
 * @see https://github.com/kompotai/bug-reports/issues/198
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issues #196, #197, #198: Project Form Fixes', () => {
  // Helper: dismiss cookie consent if visible
  async function dismissCookieConsent(page: import('@playwright/test').Page) {
    const acceptBtn = page.locator('button', { hasText: /accept/i });
    if (await acceptBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await acceptBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // Helper: open create project modal
  async function openCreateProjectModal(page: import('@playwright/test').Page) {
    await page.goto(`/ws/${WORKSPACE_ID}/projects`);
    await page.waitForLoadState('networkidle');
    await dismissCookieConsent(page);

    // Click create button
    const createBtn = page.locator('button', { hasText: /create/i }).first();
    await createBtn.click();

    // Wait for form
    await expect(page.locator('[data-testid="project-form"]')).toBeVisible({ timeout: 5000 });
  }

  ownerTest('Issue #197: Members field allows selecting multiple members @regression', async ({ page }) => {
    await openCreateProjectModal(page);

    // Fill required name
    await page.locator('[data-testid="project-form-input-name"]').fill(`Multi-member test ${Date.now()}`);

    // Scroll to the bottom of the form to make members field visible
    const form = page.locator('[data-testid="project-form"]');
    await form.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(300);

    // Find the members react-select container
    const membersContainer = page.locator('.react-select__control');
    await expect(membersContainer).toBeVisible({ timeout: 5000 });

    // Click to open the members dropdown
    await membersContainer.click({ force: true });

    // Wait for options menu
    const menu = page.locator('.react-select__menu');
    await expect(menu).toBeVisible({ timeout: 3000 });

    // Get available options
    const options = menu.locator('.react-select__option');
    const optionCount = await options.count();

    if (optionCount < 2) {
      ownerTest.skip(true, 'Need at least 2 users to test multi-select');
      return;
    }

    // Select first option
    await options.first().click();

    // Verify first chip appeared
    const chips = page.locator('.react-select__multi-value');
    await expect(chips.first()).toBeVisible({ timeout: 2000 });

    // Open dropdown again and select second option
    await membersContainer.click({ force: true });
    await expect(menu).toBeVisible({ timeout: 3000 });
    const remainingOptions = menu.locator('.react-select__option');
    await remainingOptions.first().click();

    // Verify both members are shown as multi-value chips
    const selectedCount = await chips.count();
    expect(selectedCount).toBeGreaterThanOrEqual(2);
  });

  ownerTest('Issue #198: Contact shows name when auto-filled from Opportunity @regression', async ({ page }) => {
    await openCreateProjectModal(page);

    // Scroll down to opportunity field
    const form = page.locator('[data-testid="project-form"]');
    await form.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(300);

    // Find opportunity ColorSelect — it's the one after Contact EntitySelect
    // The opportunity select has specific text "Select opportunity" in its placeholder
    const opportunityContainer = page.locator('.color-select__control').last();
    const isVisible = await opportunityContainer.isVisible({ timeout: 3000 }).catch(() => false);

    if (!isVisible) {
      ownerTest.skip(true, 'Opportunity select not found');
      return;
    }

    // Check if opportunity select is disabled (no opportunities available)
    const isDisabled = await opportunityContainer.evaluate(
      el => el.classList.contains('color-select__control--is-disabled')
    );

    if (isDisabled) {
      ownerTest.skip(true, 'No opportunities available');
      return;
    }

    // Click to open opportunity dropdown
    await opportunityContainer.click({ force: true });
    await page.waitForTimeout(300);

    // Select first opportunity option
    const opportunityOption = page.locator('.color-select__option').first();
    const hasOption = await opportunityOption.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasOption) {
      ownerTest.skip(true, 'No opportunity options');
      return;
    }

    await opportunityOption.click();
    await page.waitForTimeout(1000);

    // Check the contact EntitySelect — it should show a name, not an ObjectId
    const contactSelect = page.locator('[data-testid="project-form-select-contact"]');
    const singleValue = contactSelect.locator('.entity-select__single-value');
    const hasValue = await singleValue.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasValue) {
      const contactText = await singleValue.textContent() || '';
      // ObjectId pattern: 24 hex chars
      expect(contactText).not.toMatch(/^[a-f0-9]{24}$/);
      // Should contain at least one letter (real name)
      expect(contactText).toMatch(/[a-zA-Zа-яА-Я]/);
    }
  });

  ownerTest('Issue #196: Edit project shows contact name, not ID @regression', async ({ page }) => {
    const projectName = `Edit-contact-test ${Date.now()}`;

    // Step 1: Create a project with a contact
    await openCreateProjectModal(page);

    // Fill project name
    await page.locator('[data-testid="project-form-input-name"]').fill(projectName);

    // Select a contact via EntitySelect (async search)
    const contactSelect = page.locator('[data-testid="project-form-select-contact"]');
    const contactInput = contactSelect.locator('input');
    await contactInput.click();
    await contactInput.fill('a');
    await page.waitForTimeout(1000);

    // Wait for options to load
    const contactOption = page.locator('.entity-select__option').first();
    const hasContactOption = await contactOption.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasContactOption) {
      ownerTest.skip(true, 'No contacts available to assign');
      return;
    }

    // Remember the contact name we selected
    const selectedContactName = await contactOption.textContent() || '';
    await contactOption.click();
    await page.waitForTimeout(500);

    // Submit the form
    await page.locator('[data-testid="project-form-button-submit"]').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Step 2: Find the created project and open it for editing
    await page.goto(`/ws/${WORKSPACE_ID}/projects`);
    await page.waitForLoadState('networkidle');
    await dismissCookieConsent(page);
    await page.waitForTimeout(1000);

    // Find the project row we just created
    const projectRow = page.locator('table tbody tr', { hasText: projectName });
    await expect(projectRow).toBeVisible({ timeout: 5000 });

    // Click the inline Edit button within that specific row
    const editButton = projectRow.locator('button[title="Edit"]');
    await expect(editButton).toBeVisible({ timeout: 3000 });
    await editButton.click();

    // Wait for edit form
    await expect(page.locator('[data-testid="project-form"]')).toBeVisible({ timeout: 5000 });

    // Step 3: Verify the contact shows a name, not an ObjectId
    const editContactSelect = page.locator('[data-testid="project-form-select-contact"]');
    const singleValue = editContactSelect.locator('.entity-select__single-value');
    await expect(singleValue).toBeVisible({ timeout: 3000 });

    const contactText = await singleValue.textContent() || '';

    // Should NOT be a raw ObjectId (24 hex chars)
    expect(contactText).not.toMatch(/^[a-f0-9]{24}$/);
    // Should NOT be a serialized MongoDB object
    expect(contactText).not.toContain('ObjectId');
    expect(contactText).not.toContain('_id');
    // Should contain at least one letter (real name)
    expect(contactText).toMatch(/[a-zA-Zа-яА-Я]/);

    // Close modal
    await page.locator('[data-testid="project-form-button-cancel"]').click();
  });
});
