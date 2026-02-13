/**
 * Custom Fields — Create Tests
 *
 * TC-1.1: Create Text field
 * TC-1.2: Create Number field
 * TC-1.3: Create Boolean field
 * TC-1.4: Create Select field
 * TC-1.5: Create Required field
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { CustomFieldsPage } from '@pages/CustomFieldsPage';
import {
  createTextField,
  createNumberField,
  createBooleanField,
  createSelectField,
  createRequiredField,
} from './custom-fields.fixture';

ownerTest.describe('Custom Fields — Create', () => {
  let cfPage: CustomFieldsPage;

  ownerTest.beforeEach(async ({ page }) => {
    cfPage = new CustomFieldsPage(page);
    await cfPage.goto();
  });

  ownerTest('TC-1.1: creates Text field with maxLength', async () => {
    const field = createTextField();

    await cfPage.create(field);

    await cfPage.shouldSeeField(field.code);
    const text = await cfPage.getFieldItemText(field.code);
    expect(text).toContain(field.code);
    expect(text).toContain(field.name);
    expect(text).toContain('Text');

    // Cleanup
    await cfPage.deleteField(field.code);
    await cfPage.shouldNotSeeField(field.code);
  });

  ownerTest('TC-1.2: creates Number field with min/max', async () => {
    const field = createNumberField();

    await cfPage.create(field);

    await cfPage.shouldSeeField(field.code);
    const text = await cfPage.getFieldItemText(field.code);
    expect(text).toContain(field.name);
    expect(text).toContain('Number');

    // Cleanup
    await cfPage.deleteField(field.code);
    await cfPage.shouldNotSeeField(field.code);
  });

  ownerTest('TC-1.3: creates Boolean field', async () => {
    const field = createBooleanField();

    await cfPage.create(field);

    await cfPage.shouldSeeField(field.code);
    const text = await cfPage.getFieldItemText(field.code);
    expect(text).toContain(field.name);

    // Cleanup
    await cfPage.deleteField(field.code);
    await cfPage.shouldNotSeeField(field.code);
  });

  ownerTest('TC-1.4: creates Select field with options', async () => {
    const field = createSelectField();

    await cfPage.create(field);

    await cfPage.shouldSeeField(field.code);
    const text = await cfPage.getFieldItemText(field.code);
    expect(text).toContain(field.name);
    expect(text).toContain('Select');

    // Cleanup
    await cfPage.deleteField(field.code);
    await cfPage.shouldNotSeeField(field.code);
  });

  ownerTest('TC-1.5: creates Required field', async () => {
    const field = createRequiredField();

    await cfPage.create(field);

    await cfPage.shouldSeeField(field.code);

    // Cleanup
    await cfPage.deleteField(field.code);
    await cfPage.shouldNotSeeField(field.code);
  });
});
