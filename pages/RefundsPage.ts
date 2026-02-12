/**
 * Refunds Page Object
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { RefundsSelectors } from './selectors/refunds.selectors';
import { WORKSPACE_ID } from '@fixtures/users';

export interface RefundData {
  contactName: string;
  invoice?: string;
  amount: number;
  method?: string;
  reasonCode?: string;
  reason?: string;
  referenceNumber?: string;
  notes?: string;
}

export class RefundsPage extends BasePage {
  get path() { return `/ws/${WORKSPACE_ID}/finances/refunds`; }
  private get s() { return RefundsSelectors; }

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

  async create(data: RefundData): Promise<void> {
    await this.openCreateForm();
    await this.fillForm(data);
    await this.submitForm();
  }

  async fillForm(data: RefundData): Promise<void> {
    // Contact (required) — native <select>, wait for options to load
    const contactSelect = this.page.locator(this.s.form.contact);
    await contactSelect.locator(`option:has-text("${data.contactName}")`).first().waitFor({ state: 'attached', timeout: 10000 });
    await contactSelect.selectOption({ label: data.contactName });

    // Invoice (optional)
    if (data.invoice) {
      await this.page.locator(this.s.form.invoice).selectOption({ label: data.invoice });
    }

    // Amount (required)
    const amountInput = this.page.locator(this.s.form.amount);
    await amountInput.clear();
    await amountInput.fill(data.amount.toString());

    // Method (has default "Bank Transfer", change if specified)
    if (data.method) {
      await this.page.locator(this.s.form.method).selectOption(data.method);
    }

    // Reason Code (optional)
    if (data.reasonCode) {
      await this.page.locator(this.s.form.reasonCode).selectOption(data.reasonCode);
    }

    // Description / Reason (optional)
    if (data.reason) {
      await this.page.locator(this.s.form.reason).fill(data.reason);
    }

    // Reference Number (optional)
    if (data.referenceNumber) {
      await this.page.locator(this.s.form.referenceNumber).fill(data.referenceNumber);
    }

    // Notes (optional)
    if (data.notes) {
      await this.page.locator(this.s.form.notes).fill(data.notes);
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
    const editBtn = row.locator('[data-testid$="-edit"]').first();
    await editBtn.click();
    await this.page.locator(this.s.form.container).waitFor({ state: 'visible', timeout: 5000 });
    await this.wait(500);
  }

  async editFields(fields: { amount?: number; method?: string; reasonCode?: string; notes?: string }): Promise<void> {
    if (fields.amount !== undefined) {
      const amountInput = this.page.locator(this.s.form.amount);
      await amountInput.clear();
      await amountInput.fill(fields.amount.toString());
    }
    if (fields.method) {
      await this.page.locator(this.s.form.method).selectOption(fields.method);
    }
    if (fields.reasonCode) {
      await this.page.locator(this.s.form.reasonCode).selectOption(fields.reasonCode);
    }
    if (fields.notes !== undefined) {
      const notesField = this.page.locator(this.s.form.notes);
      await notesField.clear();
      await notesField.fill(fields.notes);
    }
  }

  async openDetailPage(identifier: string): Promise<void> {
    const row = this.page.locator(this.s.row(identifier));
    const viewLink = row.locator('a[data-testid$="-view"]').first();
    await viewLink.click();
    await this.page.waitForURL(/\/finances\/refunds\//, { timeout: 10000 });
    await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await this.wait(500);
  }

  async shouldSeeOnDetailPage(text: string): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible({ timeout: 10000 });
  }

  async clickDeleteButton(identifier: string): Promise<void> {
    const row = this.page.locator(this.s.row(identifier));
    const deleteBtn = row.locator('[data-testid$="-delete"]').first();
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

  async deleteRefund(identifier: string): Promise<void> {
    await this.clickDeleteButton(identifier);
    await this.confirmDelete();
  }

  // ============================================
  // Assertions
  // ============================================

  async shouldSeeRefund(identifier: string): Promise<void> {
    const row = this.page.locator(this.s.row(identifier));
    await expect(row).toBeVisible({ timeout: 10000 });
  }

  async shouldNotSeeRefund(identifier: string): Promise<void> {
    const row = this.page.locator(this.s.row(identifier));
    await expect(row).not.toBeVisible({ timeout: 5000 });
  }

  async shouldSeeForm(): Promise<boolean> {
    return this.page.locator(this.s.form.container).first().isVisible({ timeout: 3000 }).catch(() => false);
  }

  async getRefundRowData(identifier: string): Promise<{
    number: string;
    status: string;
    contact: string;
    amount: string;
    method: string;
    invoice: string;
    notes: string;
  }> {
    const row = this.page.locator(this.s.row(identifier));
    const cells = row.locator('td');
    return {
      number: (await cells.nth(0).textContent())?.trim() || '',
      status: (await cells.nth(1).textContent())?.trim() || '',
      contact: (await cells.nth(2).textContent())?.trim() || '',
      amount: (await cells.nth(3).textContent())?.trim() || '',
      method: (await cells.nth(4).textContent())?.trim() || '',
      invoice: (await cells.nth(5).textContent())?.trim() || '',
      notes: (await cells.nth(6).textContent())?.trim() || '',
    };
  }

  async getRefundCount(): Promise<number> {
    const rows = this.page.locator('[data-testid="refunds-table"] tbody tr');
    return await rows.count();
  }
}
