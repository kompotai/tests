/**
 * Custom Fields — List, Entity Filter & Validation Tests
 *
 * TC-4.1: Entity filter shows fields per entity
 * TC-5.1: Validation — empty code
 * TC-5.2: Validation — empty name
 * TC-5.3: Validation — duplicate code
 * TC-5.4: Validation — invalid code characters
 * TC-6.1: Empty state message
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { CustomFieldsPage } from '@pages/CustomFieldsPage';
import { createTextField } from './custom-fields.fixture';

ownerTest.describe('Custom Fields — List & Validation', () => {
  let cfPage: CustomFieldsPage;

  ownerTest.beforeEach(async ({ page }) => {
    cfPage = new CustomFieldsPage(page);
    await cfPage.goto();
  });

  ownerTest('TC-4.1: entity filter shows fields per entity', async () => {
    // Create a field for Contacts (default entity)
    const contactField = createTextField();
    await cfPage.create(contactField);
    await cfPage.shouldSeeField(contactField.code);

    // Switch to Tasks — should not see the contact field
    await cfPage.selectEntity('task');
    await cfPage.shouldNotSeeField(contactField.code);

    // Switch back to Contacts — field is there
    await cfPage.selectEntity('contact');
    await cfPage.shouldSeeField(contactField.code);

    // Cleanup
    await cfPage.deleteField(contactField.code);
  });

  ownerTest('TC-6.1: shows empty state when no fields', async () => {
    // Switch to an entity that likely has no fields
    await cfPage.selectEntity('project');
    await cfPage.shouldSeeEmptyState();
  });

  ownerTest.describe('TC-5: Validation', () => {
    ownerTest('5.1: cannot submit with empty code', async () => {
      await cfPage.openCreateForm();

      const form = cfPage.page.locator('[data-testid="custom-field-form"]');
      await form.locator('input[name="name"]').fill('Test Name');
      await form.locator('select[name="type"]').selectOption('text');

      await cfPage.clickSubmitExpectingError();

      // Form should remain open
      const formVisible = await cfPage.isFormVisible();
      expect(formVisible).toBe(true);

      await cfPage.cancelForm();
    });

    ownerTest('5.2: cannot submit with empty name', async () => {
      await cfPage.openCreateForm();

      const form = cfPage.page.locator('[data-testid="custom-field-form"]');
      await form.locator('input[name="code"]').fill('valid_code');
      await form.locator('select[name="type"]').selectOption('text');

      await cfPage.clickSubmitExpectingError();

      const formVisible = await cfPage.isFormVisible();
      expect(formVisible).toBe(true);

      await cfPage.cancelForm();
    });

    ownerTest('5.3: cannot create duplicate code', async () => {
      const field = createTextField();
      await cfPage.create(field);
      await cfPage.shouldSeeField(field.code);

      // Try to create another field with the same code
      await cfPage.openCreateForm();
      await cfPage.fillForm({ ...field, name: 'Different Name' });
      await cfPage.clickSubmitExpectingError();

      // Form should remain open (duplicate error)
      const formVisible = await cfPage.isFormVisible();
      expect(formVisible).toBe(true);

      await cfPage.cancelForm();

      // Cleanup
      await cfPage.deleteField(field.code);
    });

    ownerTest('5.4: rejects invalid code characters', async () => {
      await cfPage.openCreateForm();

      const form = cfPage.page.locator('[data-testid="custom-field-form"]');
      await form.locator('input[name="code"]').fill('Invalid Code!');
      await form.locator('input[name="name"]').fill('Test');
      await form.locator('select[name="type"]').selectOption('text');

      await cfPage.clickSubmitExpectingError();

      const formVisible = await cfPage.isFormVisible();
      expect(formVisible).toBe(true);

      await cfPage.cancelForm();
    });
  });
});
