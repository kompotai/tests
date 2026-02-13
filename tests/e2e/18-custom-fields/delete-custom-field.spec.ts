/**
 * Custom Fields — Delete Tests
 *
 * TC-3.1: Delete field via confirmation dialog
 * TC-3.2: Cancel deletion — field remains
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { CustomFieldsPage } from '@pages/CustomFieldsPage';
import { createTextField } from './custom-fields.fixture';

ownerTest.describe('Custom Fields — Delete', () => {
  let cfPage: CustomFieldsPage;

  ownerTest.beforeEach(async ({ page }) => {
    cfPage = new CustomFieldsPage(page);
    await cfPage.goto();
  });

  ownerTest('TC-3.1: deletes field after confirmation', async () => {
    const field = createTextField();
    await cfPage.create(field);
    await cfPage.shouldSeeField(field.code);

    await cfPage.clickDeleteButton(field.code);

    // Verify dialog is shown with field name
    await expect(cfPage.page.getByText('Delete custom field?')).toBeVisible();
    await expect(cfPage.page.getByText('Are you sure you want to delete')).toBeVisible();

    await cfPage.confirmDelete();

    await cfPage.shouldNotSeeField(field.code);
  });

  ownerTest('TC-3.2: cancel deletion keeps the field', async () => {
    const field = createTextField();
    await cfPage.create(field);
    await cfPage.shouldSeeField(field.code);

    await cfPage.clickDeleteButton(field.code);
    await cfPage.cancelDelete();

    // Field should still be visible
    await cfPage.shouldSeeField(field.code);

    // Cleanup
    await cfPage.deleteField(field.code);
  });
});
