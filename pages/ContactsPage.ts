/**
 * Contacts Page Object
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';

export interface ContactData {
  name: string;
  email?: string;
  phone?: string;
}

export class ContactsPage extends BasePage {
  readonly path = '/ws/contacts';

  private get selectors() {
    return Selectors.contacts;
  }

  // ============================================
  // Navigation & View
  // ============================================

  async waitForPageLoad(): Promise<void> {
    await super.waitForPageLoad();
    await this.shouldSeeText('Contacts');
  }

  async search(query: string): Promise<void> {
    const url = `${this.path}?search=${encodeURIComponent(query)}`;
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    await this.wait(500);
  }

  // ============================================
  // CRUD Operations
  // ============================================

  async openCreateForm(): Promise<void> {
    await this.page.locator(this.selectors.createButton).click();
    await this.wait(500);
  }

  async create(data: ContactData): Promise<void> {
    await this.openCreateForm();
    await this.fillForm(data);
    await this.submitForm();
  }

  async fillForm(data: ContactData): Promise<void> {
    await this.page.locator(this.selectors.form.name).fill(data.name);

    if (data.email) {
      const emailField = this.page.locator(this.selectors.form.email).first();
      if (await emailField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await emailField.fill(data.email);
      }
    }

    if (data.phone) {
      const phoneField = this.page.locator(this.selectors.form.phone).first();
      if (await phoneField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await phoneField.fill(data.phone);
      }
    }
  }

  async submitForm(): Promise<void> {
    await this.page.locator(this.selectors.form.submit).click();
    await this.waitForSpinner();
    await this.wait(1000);
  }

  async edit(identifier: string, newData: Partial<ContactData>): Promise<void> {
    await this.clickRowEdit(identifier);

    if (newData.name) {
      const nameInput = this.page.locator(this.selectors.form.name).first();
      await nameInput.clear();
      await nameInput.fill(newData.name);
    }

    await this.submitForm();
  }

  async delete(identifier: string): Promise<void> {
    await this.clickRowDelete(identifier);
    if (await this.isConfirmDialogVisible()) {
      await this.confirmDialog();
    }
  }

  // ============================================
  // Row Actions
  // ============================================

  private getRow(identifier: string) {
    return this.page.locator(this.selectors.row(identifier)).first();
  }

  async clickRowEdit(identifier: string): Promise<void> {
    const row = this.getRow(identifier);
    await row.locator(this.selectors.rowEditButton).click();
    await this.wait(1000);
  }

  async clickRowDelete(identifier: string): Promise<void> {
    const row = this.getRow(identifier);
    const deleteBtn = row.locator(this.selectors.rowDeleteButton).first();

    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click();
      await this.wait(500);
    }
  }

  // ============================================
  // Assertions
  // ============================================

  async shouldSeeContact(name: string): Promise<void> {
    await expect(this.page.getByText(name).first()).toBeVisible({ timeout: 10000 });
  }

  async shouldNotSeeContact(name: string): Promise<void> {
    await expect(this.page.getByText(name).first()).not.toBeVisible({ timeout: 5000 });
  }

  async shouldSeeEmptyState(): Promise<void> {
    await expect(this.page.locator(this.selectors.emptyState)).toBeVisible({ timeout: 10000 });
  }

  async shouldSeeTable(): Promise<boolean> {
    return await this.page.locator(this.selectors.table).first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  async shouldSeeForm(): Promise<boolean> {
    return await this.page.locator(this.selectors.form.container).first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  async getFormNameValue(): Promise<string> {
    return await this.page.locator(this.selectors.form.name).first()
      .inputValue()
      .catch(() => '');
  }
}
