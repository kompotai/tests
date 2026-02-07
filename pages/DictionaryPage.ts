/**
 * Dictionary Page Object
 *
 * Represents the dictionary items management page for E2E testing.
 * Used for testing CRUD operations on dictionary items, reordering, etc.
 */

import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { WORKSPACE_ID } from '@fixtures/users';

export class DictionaryPage extends BasePage {
  private dictionaryCode: string;

  constructor(page: import('@playwright/test').Page, dictionaryCode: string) {
    super(page);
    this.dictionaryCode = dictionaryCode;
  }

  get path() { return `/ws/${WORKSPACE_ID}/settings/dictionaries/${this.dictionaryCode}`; }

  // ============================================
  // Main Page Elements
  // ============================================

  get itemsTable(): Locator {
    return this.page.locator('[data-testid="dictionary-items-list"]');
  }

  get addItemButton(): Locator {
    return this.page.locator('button', { hasText: /add/i });
  }

  // ============================================
  // Item Form Elements (in SlideOver)
  // ============================================

  get itemForm(): Locator {
    return this.page.locator('[data-testid="dictionary-item-form"]');
  }

  get itemNameInput(): Locator {
    return this.page.locator('[data-testid="dictionary-item-form"] input#name');
  }

  get itemCodeInput(): Locator {
    return this.page.locator('[data-testid="dictionary-item-form"] input#code');
  }

  get itemSubmitButton(): Locator {
    return this.page.locator('[data-testid="dictionary-item-form-button-submit"]');
  }

  get itemCancelButton(): Locator {
    return this.page.locator('[data-testid="dictionary-item-form-button-cancel"]');
  }

  // ============================================
  // Item Row Selectors
  // ============================================

  getItemRow(itemId: string): Locator {
    return this.page.locator(`[data-testid="dictionary-item-${itemId}"]`);
  }

  getItemMoveUpButton(itemId: string): Locator {
    return this.page.locator(`[data-testid="dictionary-item-${itemId}-move-up"]`);
  }

  getItemMoveDownButton(itemId: string): Locator {
    return this.page.locator(`[data-testid="dictionary-item-${itemId}-move-down"]`);
  }

  getItemEditButton(itemId: string): Locator {
    return this.page.locator(`[data-testid="dictionary-item-${itemId}-edit"]`);
  }

  getItemDeleteButton(itemId: string): Locator {
    return this.page.locator(`[data-testid="dictionary-item-${itemId}-delete"]`);
  }

  getItemToggle(itemId: string): Locator {
    return this.page.locator(`[data-testid="dictionary-item-${itemId}-toggle"]`);
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Get all item rows
   */
  get allItemRows(): Locator {
    return this.page.locator('[data-testid^="dictionary-item-"]').filter({
      has: this.page.locator('td'),
    });
  }

  /**
   * Get all item names in order
   */
  async getAllItemNames(): Promise<string[]> {
    const rows = await this.allItemRows.all();
    const names: string[] = [];
    for (const row of rows) {
      const nameCell = row.locator('td').nth(1);
      const text = await nameCell.textContent();
      if (text) names.push(text.trim());
    }
    return names;
  }

  /**
   * Get all item IDs in order (from data-testid attributes)
   */
  async getAllItemIds(): Promise<string[]> {
    const rows = await this.allItemRows.all();
    const ids: string[] = [];
    for (const row of rows) {
      const testId = await row.getAttribute('data-testid');
      if (testId) {
        const id = testId.replace('dictionary-item-', '');
        ids.push(id);
      }
    }
    return ids;
  }

  /**
   * Get item count
   */
  async getItemsCount(): Promise<number> {
    return await this.allItemRows.count();
  }

  /**
   * Find item row by name text
   */
  getItemRowByName(name: string): Locator {
    return this.allItemRows.filter({ hasText: name });
  }

  /**
   * Get item ID from row by name
   */
  async getItemIdByName(name: string): Promise<string | null> {
    const row = this.getItemRowByName(name);
    const testId = await row.getAttribute('data-testid');
    if (!testId) return null;
    return testId.replace('dictionary-item-', '');
  }

  // ============================================
  // Form Operations
  // ============================================

  /**
   * Open create item form
   */
  async clickAddItem(): Promise<void> {
    await this.addItemButton.click();
    await this.itemForm.waitFor({ state: 'visible' });
  }

  /**
   * Fill item name
   */
  async fillItemName(name: string): Promise<void> {
    await this.itemNameInput.fill(name);
  }

  /**
   * Fill item code
   */
  async fillItemCode(code: string): Promise<void> {
    await this.itemCodeInput.fill(code);
  }

  /**
   * Fill color property field
   */
  async fillColorProperty(color: string): Promise<void> {
    // Color input in the form — it's an <input> with placeholder "#000000"
    const colorTextInput = this.page.locator('[data-testid="dictionary-item-form"] input[placeholder="#000000"]');
    await colorTextInput.fill(color);
  }

  /**
   * Submit item form
   */
  async submitItemForm(): Promise<void> {
    await this.itemSubmitButton.click();
    await this.waitForSpinner();
  }

  /**
   * Create a new dictionary item
   */
  async createItem(data: { name: string; code?: string; color?: string }): Promise<void> {
    await this.clickAddItem();
    await this.fillItemName(data.name);
    if (data.code) {
      await this.fillItemCode(data.code);
    }
    if (data.color) {
      await this.fillColorProperty(data.color);
    }
    await this.submitItemForm();
  }

  /**
   * Edit an existing item by its ID
   */
  async editItem(itemId: string): Promise<void> {
    await this.getItemEditButton(itemId).click();
    await this.itemForm.waitFor({ state: 'visible' });
  }

  /**
   * Delete an item by its ID (clicks delete, then confirms)
   */
  async deleteItem(itemId: string): Promise<void> {
    await this.getItemDeleteButton(itemId).click();
    await this.confirmDialog();
  }

  /**
   * Move item up
   */
  async moveItemUp(itemId: string): Promise<void> {
    await this.getItemMoveUpButton(itemId).click();
    await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  }

  /**
   * Move item down
   */
  async moveItemDown(itemId: string): Promise<void> {
    await this.getItemMoveDownButton(itemId).click();
    await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  }
}
