/**
 * Custom Fields — Edit Tests
 *
 * TC-2.1: Edit field name
 * TC-2.2: Code and Type are disabled in edit mode
 * TC-2.3: Edit type-specific parameter (maxLength)
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { CustomFieldsPage } from '@pages/CustomFieldsPage';
import { createTextField } from './custom-fields.fixture';

ownerTest.describe('Custom Fields — Edit', () => {
  let cfPage: CustomFieldsPage;
  let fieldCode: string;

  ownerTest.beforeEach(async ({ page }) => {
    cfPage = new CustomFieldsPage(page);
    await cfPage.goto();

    // Create a field to edit
    const field = createTextField();
    fieldCode = field.code;
    await cfPage.create(field);
    await cfPage.shouldSeeField(fieldCode);
  });

  ownerTest.afterEach(async () => {
    // Cleanup: delete the field if it still exists
    try {
      await cfPage.deleteField(fieldCode);
    } catch {
      // Field may already be deleted
    }
  });

  ownerTest('TC-2.1: edits field name', async () => {
    const newName = `Edited Name ${Date.now()}`;

    await cfPage.openEditForm(fieldCode);
    await cfPage.editName(newName);
    await cfPage.submitForm();

    // Verify updated name in the list
    const text = await cfPage.getFieldItemText(fieldCode);
    expect(text).toContain(newName);
  });

  ownerTest('TC-2.2: code and type are disabled in edit mode', async () => {
    await cfPage.openEditForm(fieldCode);

    const codeDisabled = await cfPage.isFieldDisabled('code');
    const typeDisabled = await cfPage.isFieldDisabled('type');

    expect(codeDisabled).toBe(true);
    expect(typeDisabled).toBe(true);

    await cfPage.cancelForm();
  });

  ownerTest('TC-2.3: edits maxLength parameter', async () => {
    await cfPage.openEditForm(fieldCode);
    await cfPage.editMaxLength(500);
    await cfPage.submitForm();

    // Re-open and verify value persisted
    await cfPage.openEditForm(fieldCode);
    const form = cfPage.page.locator('[data-testid="custom-field-form"]');
    const value = await form.locator('input[name="maxLength"]').inputValue();
    expect(value).toBe('500');

    await cfPage.cancelForm();
  });
});
