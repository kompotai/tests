/**
 * Custom Fields Settings Page Object
 *
 * Manages custom field definitions at:
 * /ws/{wsId}/settings/custom-fields
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';
import { WORKSPACE_ID } from '@fixtures/users';

export type EntityType = 'contact' | 'opportunity' | 'job' | 'task' | 'product' | 'invoice' | 'project';
export type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'dictionary';

export interface CustomFieldData {
  code: string;
  name: string;
  type: FieldType;
  required?: boolean;
  // Type-specific
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  options?: string[];      // For 'select' type — one option per line
  dictionaryCode?: string; // For 'dictionary' type
}

export class CustomFieldsPage extends BasePage {
  get path() { return `/ws/${WORKSPACE_ID}/settings/custom-fields`; }
  private get s() { return Selectors.customFields; }

  async waitForPageLoad(): Promise<void> {
    await this.page.locator(this.s.heading).first().waitFor({ state: 'visible', timeout: 15000 });
    await this.dismissCookieBanner();
  }

  private async dismissCookieBanner(): Promise<void> {
    const cookieBtn = this.page.locator('[data-testid="cookie-accept-all"]');
    if (await cookieBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cookieBtn.click({ force: true });
      await cookieBtn.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }
  }

  // ============================================
  // Entity Filter
  // ============================================

  async selectEntity(entity: EntityType): Promise<void> {
    const filter = this.page.locator('main select').first();
    await filter.selectOption(entity);
    await this.waitForSpinner();
  }

  // ============================================
  // Create
  // ============================================

  async openCreateForm(): Promise<void> {
    await this.dismissCookieBanner();
    await this.page.locator(this.s.addButton).click();
    await this.page.locator(this.s.form.container).waitFor({ state: 'visible', timeout: 5000 });
    await this.wait(300);
  }

  async fillForm(data: CustomFieldData): Promise<void> {
    const form = this.page.locator(this.s.form.container);

    await form.locator(this.s.form.code).fill(data.code);
    await form.locator(this.s.form.name).fill(data.name);
    await form.locator(this.s.form.type).selectOption(data.type);
    await this.wait(300);

    // Type-specific fields
    if (data.type === 'text' && data.maxLength !== undefined) {
      await form.locator(this.s.form.maxLength).fill(data.maxLength.toString());
    }

    if (data.type === 'number') {
      if (data.minValue !== undefined) {
        await form.locator(this.s.form.minValue).fill(data.minValue.toString());
      }
      if (data.maxValue !== undefined) {
        await form.locator(this.s.form.maxValue).fill(data.maxValue.toString());
      }
    }

    if (data.type === 'select' && data.options?.length) {
      const textarea = form.locator(this.s.form.options);
      await textarea.click();
      await textarea.fill(data.options.join('\n'));
      // Blur to trigger validation
      await form.locator(this.s.form.name).click();
      await this.wait(200);
    }

    if (data.type === 'dictionary' && data.dictionaryCode) {
      await form.locator(this.s.form.dictionaryCode).selectOption(data.dictionaryCode);
    }

    // Required checkbox
    if (data.required) {
      const checkbox = form.locator(this.s.form.required);
      if (!(await checkbox.isChecked())) {
        await checkbox.check();
      }
    }
  }

  async submitForm(): Promise<void> {
    await this.dismissCookieBanner();
    const submitBtn = this.page.locator(this.s.form.submit);
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    // Wait for form to close — do NOT silently swallow errors
    await this.page.locator(this.s.form.container).waitFor({ state: 'hidden', timeout: 10000 });
    await this.wait(500);
  }

  async clickSubmitExpectingError(): Promise<void> {
    await this.dismissCookieBanner();
    const submitBtn = this.page.locator(this.s.form.submit);
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    await this.wait(500);
  }

  async cancelForm(): Promise<void> {
    await this.dismissCookieBanner();
    await this.page.locator(this.s.form.cancel).click();
    await this.page.locator(this.s.form.container).waitFor({ state: 'hidden', timeout: 5000 });
    await this.wait(300);
  }

  async create(data: CustomFieldData): Promise<void> {
    await this.openCreateForm();
    await this.fillForm(data);
    await this.submitForm();
  }

  // ============================================
  // Edit
  // ============================================

  async openEditForm(code: string): Promise<void> {
    await this.dismissCookieBanner();
    await this.page.locator(this.s.itemEdit(code)).click();
    await this.page.locator(this.s.form.container).waitFor({ state: 'visible', timeout: 5000 });
    await this.wait(300);
  }

  async editName(newName: string): Promise<void> {
    const form = this.page.locator(this.s.form.container);
    const nameInput = form.locator(this.s.form.name);
    await nameInput.clear();
    await nameInput.fill(newName);
  }

  async editMaxLength(value: number): Promise<void> {
    const form = this.page.locator(this.s.form.container);
    const input = form.locator(this.s.form.maxLength);
    await input.clear();
    await input.fill(value.toString());
  }

  async isFieldDisabled(fieldName: string): Promise<boolean> {
    const form = this.page.locator(this.s.form.container);
    const input = form.locator(`input[name="${fieldName}"], select[name="${fieldName}"]`);
    return input.isDisabled();
  }

  // ============================================
  // Delete
  // ============================================

  async clickDeleteButton(code: string): Promise<void> {
    await this.dismissCookieBanner();
    await this.page.locator(this.s.itemDelete(code)).click();
    await this.page.locator(this.s.deleteDialog.title).waitFor({ state: 'visible', timeout: 5000 });
  }

  async confirmDelete(): Promise<void> {
    await this.page.locator(this.s.deleteDialog.confirm).click();
    await this.wait(500);
  }

  async cancelDelete(): Promise<void> {
    await this.page.locator(this.s.deleteDialog.cancel).click();
    await this.wait(300);
  }

  async deleteField(code: string): Promise<void> {
    await this.clickDeleteButton(code);
    await this.confirmDelete();
  }

  // ============================================
  // Assertions
  // ============================================

  async shouldSeeField(code: string): Promise<void> {
    await expect(this.page.locator(this.s.item(code))).toBeVisible({ timeout: 10000 });
  }

  async shouldNotSeeField(code: string): Promise<void> {
    await expect(this.page.locator(this.s.item(code))).not.toBeVisible({ timeout: 5000 });
  }

  async shouldSeeEmptyState(): Promise<void> {
    await expect(this.page.locator(this.s.emptyState)).toBeVisible({ timeout: 5000 });
  }

  async isFormVisible(): Promise<boolean> {
    return this.page.locator(this.s.form.container).isVisible({ timeout: 3000 }).catch(() => false);
  }

  async getFieldItemText(code: string): Promise<string> {
    return (await this.page.locator(this.s.item(code)).textContent()) || '';
  }
}
