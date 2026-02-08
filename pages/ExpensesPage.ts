/**
 * Expenses Page Object
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';
import { WORKSPACE_ID } from '@fixtures/users';

export interface ExpenseItem {
  name: string;
  description?: string;
  price: number;
  quantity?: number;
}

export interface ExpenseData {
  contactName: string;
  category?: string;
  status?: 'pending' | 'paid';
  expenseDate?: string;
  items: ExpenseItem[];
  description?: string;
}

export class ExpensesPage extends BasePage {
  get path() { return `/ws/${WORKSPACE_ID}/finances/expenses`; }
  private get s() { return Selectors.expenses; }

  async waitForPageLoad(): Promise<void> {
    await this.page.locator(this.s.heading).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  // ============================================
  // Form Actions
  // ============================================

  async openCreateForm(): Promise<void> {
    await this.page.locator(this.s.createButton).click();
    await this.page.locator(this.s.form.container).waitFor({ state: 'visible', timeout: 5000 });
    await this.wait(500);
  }

  async create(data: ExpenseData): Promise<void> {
    await this.openCreateForm();
    await this.fillForm(data);
    await this.submitForm();
  }

  async fillForm(data: ExpenseData): Promise<void> {
    // Contact (required) — search input with dropdown
    await this.selectContact(data.contactName);

    // Category
    if (data.category) {
      await this.page.locator(this.s.form.category).selectOption({ label: data.category });
    }

    // Status
    if (data.status) {
      await this.page.locator(this.s.form.status).selectOption(data.status);
    }

    // Expense Date
    if (data.expenseDate) {
      await this.page.locator(this.s.form.expenseDate).fill(data.expenseDate);
    }

    // Items (required) — form starts with no items, click "+ Add item" for each
    for (let i = 0; i < data.items.length; i++) {
      await this.page.locator(this.s.form.addItem).click();
      await this.wait(300);
      await this.fillItem(i, data.items[i]);
    }

    // Description
    if (data.description) {
      await this.page.locator(this.s.form.description).fill(data.description);
    }
  }

  async selectContact(contactName: string): Promise<void> {
    const form = this.page.locator(this.s.form.container);
    const input = form.locator(this.s.form.contact);
    await input.fill(contactName);
    await this.wait(800);

    // Select from dropdown within the form panel
    const option = form.getByText(contactName, { exact: true }).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
    await this.wait(300);
  }

  private async fillItem(index: number, item: ExpenseItem): Promise<void> {
    const itemBlock = this.page.locator('[data-testid="expense-form"] .space-y-3 > .p-3').nth(index);

    // Item name
    await itemBlock.locator('input[placeholder="Item name"]').fill(item.name);

    // Item description
    if (item.description) {
      await itemBlock.locator('input[placeholder="Description"]').fill(item.description);
    }

    // Price
    const priceInput = itemBlock.locator('input[type="number"]').first();
    await priceInput.clear();
    await priceInput.fill(item.price.toString());

    // Quantity
    if (item.quantity !== undefined) {
      const qtyInput = itemBlock.locator('input[type="number"]').nth(1);
      await qtyInput.clear();
      await qtyInput.fill(item.quantity.toString());
    }
  }

  private async dismissCookieBanner(): Promise<void> {
    const cookieBtn = this.page.locator('[data-testid="cookie-accept-all"]');
    if (await cookieBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await cookieBtn.click();
      await this.wait(300);
    }
  }

  async submitForm(): Promise<void> {
    await this.dismissCookieBanner();
    const submitBtn = this.page.locator(this.s.form.submit);
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    await this.page.locator(this.s.form.container).waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await this.wait(500);
  }

  async clickSubmitExpectingError(): Promise<void> {
    await this.dismissCookieBanner();
    await this.page.locator(this.s.form.submit).click();
    await this.wait(500);
  }

  async addItemWithoutContact(item: ExpenseItem): Promise<void> {
    // Add item without filling contact — for validation tests
    await this.page.locator(this.s.form.addItem).click();
    await this.wait(300);
    await this.fillItem(0, item);
  }

  async getExpenseCount(): Promise<number> {
    const rows = this.page.locator('[data-testid="expenses-table"] tbody tr');
    return await rows.count();
  }

  async cancelForm(): Promise<void> {
    await this.dismissCookieBanner();
    await this.page.locator(this.s.form.cancel).click();
    await this.page.locator(this.s.form.container).waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    await this.wait(300);
  }

  // ============================================
  // Row Actions
  // ============================================

  async openEditForm(identifier: string): Promise<void> {
    const row = this.page.locator(this.s.row(identifier));
    const editBtn = row.locator('button:has(svg.lucide-pencil), [data-testid$="-edit"]').first();
    await editBtn.click();
    await this.page.locator(this.s.form.container).waitFor({ state: 'visible', timeout: 5000 });
    await this.wait(500);
  }

  async editFields(fields: { category?: string; status?: 'pending' | 'paid'; description?: string }): Promise<void> {
    if (fields.category) {
      await this.page.locator(this.s.form.category).selectOption({ label: fields.category });
    }
    if (fields.status) {
      await this.page.locator(this.s.form.status).selectOption(fields.status);
    }
    if (fields.description !== undefined) {
      const descField = this.page.locator(this.s.form.description);
      await descField.clear();
      await descField.fill(fields.description);
    }
  }

  async openDetailPage(identifier: string): Promise<void> {
    const row = this.page.locator(this.s.row(identifier));
    const viewLink = row.locator('a[data-testid$="-view"]').first();
    await viewLink.click();
    await this.page.waitForURL(/\/finances\/expenses\//, { timeout: 10000 });
    await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await this.wait(500);
  }

  async shouldSeeOnDetailPage(text: string): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible({ timeout: 10000 });
  }

  async getDetailItemsCount(): Promise<number> {
    // Items table rows (excluding header and total rows)
    const tableRows = this.page.locator('table tbody tr').filter({ hasNot: this.page.locator('text=Total:') });
    return await tableRows.count();
  }

  async clickDeleteButton(identifier: string): Promise<void> {
    const row = this.page.locator(this.s.row(identifier));
    const deleteBtn = row.locator('button:has(svg.lucide-trash-2), [data-testid$="-delete"]').first();
    await deleteBtn.click();
    await this.wait(500);
  }

  async shouldSeeDeleteDialog(): Promise<boolean> {
    const dialog = this.page.locator(this.s.deleteDialog.container);
    return dialog.isVisible({ timeout: 5000 }).catch(() => false);
  }

  async confirmDelete(): Promise<void> {
    const confirmBtn = this.page.locator(this.s.deleteDialog.confirm);
    await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
    await confirmBtn.click();
    await this.wait(500);
  }

  async cancelDelete(): Promise<void> {
    const cancelBtn = this.page.locator(this.s.deleteDialog.cancel);
    await cancelBtn.click();
    await this.wait(500);
  }

  async deleteExpense(identifier: string): Promise<void> {
    await this.clickDeleteButton(identifier);
    await this.confirmDelete();
  }

  // ============================================
  // Assertions
  // ============================================

  async shouldSeeExpense(identifier: string): Promise<void> {
    const row = this.page.locator(this.s.row(identifier));
    await expect(row).toBeVisible({ timeout: 10000 });
  }

  async shouldNotSeeExpense(identifier: string): Promise<void> {
    const row = this.page.locator(this.s.row(identifier));
    await expect(row).not.toBeVisible({ timeout: 5000 });
  }

  async shouldSeeForm(): Promise<boolean> {
    return this.page.locator(this.s.form.container).first().isVisible({ timeout: 3000 }).catch(() => false);
  }

  async getExpenseRowData(identifier: string): Promise<{ number: string; status: string; contact: string; category: string; amount: string }> {
    const row = this.page.locator(this.s.row(identifier));
    const cells = row.locator('td');
    return {
      number: (await cells.nth(0).textContent())?.trim() || '',
      status: (await cells.nth(1).textContent())?.trim() || '',
      contact: (await cells.nth(2).textContent())?.trim() || '',
      category: (await cells.nth(3).textContent())?.trim() || '',
      amount: (await cells.nth(5).textContent())?.trim() || '',
    };
  }
}
