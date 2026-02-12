/**
 * Dictionaries Settings Page Object
 *
 * Settings → Dictionaries
 * Manage system dictionaries and reference books.
 */

import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';
import { WORKSPACE_ID } from '@fixtures/users';

export interface DictionaryData {
  code: string;
  name: string;
  description?: string;
}

export interface DictionaryItemData {
  code?: string;
  name: string;
  color?: string;
}

export class DictionariesPage extends BasePage {
  get path() { return `/ws/${WORKSPACE_ID}/settings/dictionaries`; }
  private get s() { return Selectors.dictionaries; }

  async waitForPageLoad(): Promise<void> {
    await this.page.locator(this.s.list).waitFor({ state: 'visible', timeout: 15000 });
  }

  // ============================================
  // DICTIONARY LIST
  // ============================================

  async getDictionaryIdByName(name: string): Promise<string> {
    const row = this.page.locator(`[data-testid="dictionaries-list"] tr:has-text("${name}")`);
    const testid = await row.getAttribute('data-testid');
    return testid?.replace('dictionary-item-', '') || '';
  }

  async shouldSeeDictionary(name: string): Promise<void> {
    await expect(
      this.page.locator(`[data-testid="dictionaries-list"] tr:has-text("${name}")`)
    ).toBeVisible();
  }

  async shouldNotSeeDictionary(name: string): Promise<void> {
    await expect(
      this.page.locator(`[data-testid="dictionaries-list"] tr:has-text("${name}")`)
    ).not.toBeVisible({ timeout: 5000 });
  }

  // ============================================
  // CREATE DICTIONARY
  // ============================================

  async openCreateForm(): Promise<void> {
    await this.page.locator(this.s.createButton).click();
    await this.page.locator(this.s.form).waitFor({ state: 'visible' });
  }

  async fillDictionaryForm(data: DictionaryData): Promise<void> {
    const codeInput = this.page.locator(this.s.formInputCode);
    await codeInput.clear();
    await codeInput.fill(data.code);

    const nameInput = this.page.locator(this.s.formInputName);
    await nameInput.clear();
    await nameInput.fill(data.name);

    if (data.description) {
      const descInput = this.page.locator(this.s.formInputDescription);
      await descInput.clear();
      await descInput.fill(data.description);
    }
  }

  async submitDictionaryForm(): Promise<void> {
    await this.page.locator(this.s.formSubmit).click();
    await this.waitForSpinner();
  }

  async createDictionary(data: DictionaryData): Promise<void> {
    await this.openCreateForm();
    await this.fillDictionaryForm(data);
    await this.submitDictionaryForm();
  }

  async cancelDictionaryForm(): Promise<void> {
    await this.page.locator(this.s.formCancel).click();
    await this.wait(300);
  }

  // ============================================
  // EDIT DICTIONARY
  // ============================================

  async openEditForm(name: string): Promise<void> {
    const id = await this.getDictionaryIdByName(name);
    await this.page.locator(this.s.dictionaryEdit(id)).click();
    await this.page.locator(this.s.form).waitFor({ state: 'visible' });
  }

  async editDictionary(name: string, data: Partial<DictionaryData>): Promise<void> {
    await this.openEditForm(name);
    if (data.name) {
      const nameInput = this.page.locator(this.s.formInputName);
      await nameInput.clear();
      await nameInput.fill(data.name);
    }
    if (data.description !== undefined) {
      const descInput = this.page.locator(this.s.formInputDescription);
      await descInput.clear();
      await descInput.fill(data.description);
    }
    await this.submitDictionaryForm();
  }

  // ============================================
  // DELETE DICTIONARY
  // ============================================

  async deleteDictionary(name: string): Promise<void> {
    const id = await this.getDictionaryIdByName(name);
    await this.page.locator(this.s.dictionaryDelete(id)).click();
    await this.confirmDialog();
  }

  // ============================================
  // NAVIGATE TO DETAIL PAGE
  // ============================================

  async openDictionaryByCode(code: string): Promise<void> {
    await this.page.goto(`/ws/${WORKSPACE_ID}/settings/dictionaries/${code}`);
    await this.page.locator(this.s.backToList).waitFor({ state: 'visible', timeout: 10000 });
  }

  async goBackToList(): Promise<void> {
    await this.page.locator(this.s.backToList).click();
    await this.page.locator(this.s.list).waitFor({ state: 'visible', timeout: 10000 });
  }

  // ============================================
  // DICTIONARY ITEMS (detail page)
  // ============================================

  async getItemIdByName(name: string): Promise<string> {
    const row = this.page.locator(`[data-testid="dictionary-items-list"] tr:has-text("${name}")`);
    const testid = await row.getAttribute('data-testid');
    return testid?.replace('dictionary-item-', '') || '';
  }

  async shouldSeeItem(name: string): Promise<void> {
    await expect(
      this.page.locator(`[data-testid="dictionary-items-list"] tr:has-text("${name}")`)
    ).toBeVisible();
  }

  async shouldNotSeeItem(name: string): Promise<void> {
    await expect(
      this.page.locator(`[data-testid="dictionary-items-list"] tr:has-text("${name}")`)
    ).not.toBeVisible({ timeout: 5000 });
  }

  // ============================================
  // ADD ITEM
  // ============================================

  async openAddItemForm(): Promise<void> {
    await this.page.locator(this.s.addItemButton).click();
    await this.page.locator(this.s.itemForm).waitFor({ state: 'visible' });
  }

  async fillItemForm(data: DictionaryItemData): Promise<void> {
    if (data.code) {
      const codeInput = this.page.locator(this.s.itemFormInputCode);
      await codeInput.clear();
      await codeInput.fill(data.code);
    }

    const nameInput = this.page.locator(this.s.itemFormInputName);
    await nameInput.clear();
    await nameInput.fill(data.name);

    if (data.color) {
      const colorInput = this.page.locator(this.s.itemFormInputColor);
      await colorInput.clear();
      await colorInput.fill(data.color);
    }
  }

  async submitItemForm(): Promise<void> {
    await this.page.locator(this.s.itemFormSubmit).click();
    await this.waitForSpinner();
  }

  async addItem(data: DictionaryItemData): Promise<void> {
    await this.openAddItemForm();
    await this.fillItemForm(data);
    await this.submitItemForm();
  }

  // ============================================
  // EDIT ITEM
  // ============================================

  async openEditItemForm(name: string): Promise<void> {
    const id = await this.getItemIdByName(name);
    await this.page.locator(this.s.itemEdit(id)).click();
    await this.page.locator(this.s.itemForm).waitFor({ state: 'visible' });
  }

  async editItem(name: string, data: Partial<DictionaryItemData>): Promise<void> {
    await this.openEditItemForm(name);
    if (data.name) {
      const nameInput = this.page.locator(this.s.itemFormInputName);
      await nameInput.clear();
      await nameInput.fill(data.name);
    }
    if (data.color) {
      const colorInput = this.page.locator(this.s.itemFormInputColor);
      await colorInput.clear();
      await colorInput.fill(data.color);
    }
    await this.submitItemForm();
  }

  // ============================================
  // DELETE ITEM
  // ============================================

  async deleteItem(name: string): Promise<void> {
    const id = await this.getItemIdByName(name);
    await this.page.locator(this.s.itemDelete(id)).click();
    await this.confirmDialog();
  }

  // ============================================
  // TOGGLE ITEM STATUS
  // ============================================

  async toggleItemStatus(name: string): Promise<void> {
    const id = await this.getItemIdByName(name);
    await this.page.locator(this.s.itemToggle(id)).click();
    await this.wait(500);
  }
}
