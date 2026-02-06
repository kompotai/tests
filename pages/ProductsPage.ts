/**
 * Products Page Object
 *
 * The creation/edit form renders in a right-side drawer.
 * Row edit/delete buttons use dynamic testids scoped to each row.
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';
import { WORKSPACE_ID } from '@fixtures/users';

export interface ProductData {
  name: string;
  type?: string;           // 'product' | 'service'
  sku?: string;
  category?: string;       // e.g. 'Services', 'Products', 'Other'
  description?: string;
  purchasePrice?: number;
  sellingPrice?: number;   // required
  unit?: string;           // defaults to 'pcs'
  taxable?: boolean;
  taxRate?: number;
  tags?: string;
  notes?: string;
}

export class ProductsPage extends BasePage {
  get path() {
    return `/ws/${WORKSPACE_ID}/products`;
  }

  private get s() { return Selectors.products; }

  // ============================================
  // Navigation
  // ============================================

  async waitForPageLoad(): Promise<void> {
    await super.waitForPageLoad();
    await this.page.locator(this.s.table).waitFor({ state: 'visible', timeout: 10000 });
  }

  // ============================================
  // Creation
  // ============================================

  async openCreateForm(): Promise<void> {
    await this.page.locator(this.s.createButton).click();
    await this.page.locator(this.s.form.container).waitFor({ state: 'visible', timeout: 5000 });
    await this.wait(500);
  }

  /**
   * Full create flow: open form → fill → submit.
   * Returns true if the form closed (success), false otherwise.
   */
  async create(data: ProductData): Promise<boolean> {
    await this.openCreateForm();
    await this.fillForm(data);

    await this.page.locator(this.s.form.submitBtn).click({ force: true });
    const closed = await this.page.locator(this.s.form.container)
      .waitFor({ state: 'hidden', timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    await this.wait(500);
    return closed;
  }

  /** Fill form fields from ProductData. Only touches fields that are provided. */
  async fillForm(data: ProductData): Promise<void> {
    await this.page.locator(this.s.form.nameInput).fill(data.name);

    if (data.type) {
      await this.page.locator(this.s.form.typeSelect).selectOption(data.type);
    }
    if (data.sku) {
      await this.page.locator(this.s.form.skuInput).fill(data.sku);
    }
    if (data.category) {
      const catInput = this.page.locator(`${this.s.form.categorySelector} input[role="combobox"]`);
      await catInput.click();
      await this.wait(300);
      await catInput.pressSequentially(data.category);
      await this.wait(500);
      await this.page.locator('[class*="tree-select__option"]').filter({ hasText: data.category }).first().click();
      await this.wait(300);
    }
    if (data.description) {
      await this.page.locator(this.s.form.descriptionInput).fill(data.description);
    }
    if (data.purchasePrice !== undefined) {
      await this.page.locator(this.s.form.purchasePriceInput).fill(String(data.purchasePrice));
    }
    if (data.sellingPrice !== undefined) {
      await this.page.locator(this.s.form.sellingPriceInput).fill(String(data.sellingPrice));
    }
    if (data.unit) {
      await this.page.locator(this.s.form.unitInput).fill(data.unit);
    }
    if (data.taxable !== undefined) {
      const checkbox = this.page.locator(this.s.form.taxableCheckbox);
      const isChecked = await checkbox.isChecked();
      if (data.taxable !== isChecked) {
        await checkbox.click();
      }
      if (data.taxable && data.taxRate !== undefined) {
        await this.wait(300);
        await this.page.locator(this.s.form.taxRateInput).fill(String(data.taxRate));
      }
    }
    if (data.tags) {
      await this.page.locator(this.s.form.tagsInput).fill(data.tags);
    }
    if (data.notes) {
      await this.page.locator(this.s.form.notesInput).fill(data.notes);
    }
  }

  /** Submit the current form (works for both Create and Edit). */
  async submitForm(): Promise<void> {
    await this.page.locator(this.s.form.submitBtn).click({ force: true });
    await this.page.locator(this.s.form.container)
      .waitFor({ state: 'hidden', timeout: 5000 })
      .catch(() => {});
    await this.wait(500);
  }

  /** Cancel the current form without saving. */
  async cancelForm(): Promise<void> {
    await this.page.locator(this.s.form.cancelBtn).click();
    await this.page.locator(this.s.form.container)
      .waitFor({ state: 'hidden', timeout: 3000 })
      .catch(() => {});
  }

  /** Check if the form drawer is currently visible. */
  async shouldSeeForm(): Promise<boolean> {
    return await this.page.locator(this.s.form.container).first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  // ============================================
  // Table / List
  // ============================================

  async getRowCount(): Promise<number> {
    return await this.page.locator('table tbody tr').count();
  }

  async search(query: string): Promise<void> {
    const input = this.page.locator(this.s.searchInput);
    await input.fill(query);
    await input.press('Enter');
    await this.wait(1500);
  }

  async shouldSeeProduct(name: string): Promise<void> {
    await expect(this.page.locator(this.s.row(name)).first()).toBeVisible({ timeout: 10000 });
  }

  async shouldNotSeeProduct(name: string): Promise<void> {
    await this.wait(500);
    await expect(this.page.locator(this.s.row(name)).first()).not.toBeVisible({ timeout: 5000 });
  }

  // ============================================
  // Row Actions
  // ============================================

  /** Click the Edit button on a product's table row. Opens the edit form. */
  async clickRowEdit(name: string): Promise<void> {
    await this.page.locator(this.s.rowEdit(name)).first().click();
    await this.page.locator(this.s.form.container).waitFor({ state: 'visible', timeout: 5000 });
    await this.wait(500);
  }

  /** Click the Delete button on a product's table row. */
  async clickRowDelete(name: string): Promise<void> {
    await this.page.locator(this.s.rowDelete(name)).first().click();
    await this.wait(500);
  }

  // ============================================
  // Category Filter
  // ============================================

  /** Click "All products" in the category sidebar to clear filter. */
  async filterAllProducts(): Promise<void> {
    await this.page.locator(this.s.categoryAll).click();
    await this.wait(500);
  }

  /** Click a category in the sidebar by its display name. */
  async filterByCategory(categoryName: string): Promise<void> {
    const tree = this.page.locator(this.s.categoryTree);
    await tree.locator(`text=${categoryName}`).first().click();
    await this.wait(1000);
  }
}
