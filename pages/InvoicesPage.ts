/**
 * Invoices Page Object
 *
 * Handles invoice listing, viewing, and management.
 */

import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { WORKSPACE_ID } from '@fixtures/users';
import { InvoicesSelectors } from './selectors/invoices.selectors';

export interface InvoiceData {
  number?: string;
  contactName?: string;
  amount?: number;
  status?: string;
}

export class InvoicesPage extends BasePage {
  get path() {
    return `/ws/${WORKSPACE_ID}/finances/invoices`;
  }

  // ============================================
  // Navigation
  // ============================================

  async waitForPageLoad(): Promise<void> {
    await super.waitForPageLoad();
    await this.page.locator(InvoicesSelectors.pageHeader).first().waitFor({ state: 'visible', timeout: 10000 });
  }

  // ============================================
  // Table Operations
  // ============================================

  async getRowCount(): Promise<number> {
    const rows = this.page.locator(InvoicesSelectors.tableRow);
    return await rows.count();
  }

  async hasInvoices(): Promise<boolean> {
    const count = await this.getRowCount();
    return count > 0;
  }

  async openFirstInvoice(): Promise<string | null> {
    const rows = this.page.locator(InvoicesSelectors.tableRow);
    const count = await rows.count();

    if (count === 0) {
      return null;
    }

    const firstRow = rows.first();
    const numberCell = firstRow.locator(InvoicesSelectors.tableCell).first();
    await numberCell.click();
    await this.page.waitForURL(/\/invoices\/[a-f0-9]+/, { timeout: 10000 });
    await this.waitForPageLoad();

    // Extract invoice ID from URL
    const url = this.page.url();
    const match = url.match(/\/invoices\/([a-f0-9]+)/);
    return match ? match[1] : null;
  }

  async openInvoice(identifier: string): Promise<void> {
    // If identifier looks like a MongoDB ObjectId, navigate directly
    if (/^[a-f0-9]{24}$/.test(identifier)) {
      await this.page.goto(`/ws/${WORKSPACE_ID}/finances/invoices/${identifier}`);
      await this.page.waitForURL(/\/invoices\/[a-f0-9]+/, { timeout: 10000 });
      await this.waitForPageLoad();
      return;
    }

    // Otherwise find in list by text (INV-xxxx or other identifier)
    const row = this.page.locator(InvoicesSelectors.tableRow).filter({ hasText: identifier }).first();
    await row.click();
    await this.page.waitForURL(/\/invoices\/[a-f0-9]+/, { timeout: 10000 });
    await this.waitForPageLoad();
  }

  // ============================================
  // View Page
  // ============================================

  async getInvoiceNumber(): Promise<string> {
    const header = this.page.locator(InvoicesSelectors.pageHeader).first();
    const text = await header.textContent();
    return text?.trim() || '';
  }

  async hasPaymentsSection(): Promise<boolean> {
    const paymentsSection = this.page
      .locator(InvoicesSelectors.paymentsSection)
      .or(this.page.locator(InvoicesSelectors.paymentsSectionText))
      .or(this.page.locator(InvoicesSelectors.paymentsSectionTextRu));
    return await paymentsSection.first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async hasRefundsSection(): Promise<boolean> {
    const refundsSection = this.page.locator(InvoicesSelectors.refundsSection);
    return await refundsSection.isVisible({ timeout: 3000 }).catch(() => false);
  }

  // ============================================
  // Assertions
  // ============================================

  async shouldSeeInvoice(identifier: string): Promise<void> {
    await expect(this.page.getByText(identifier).first()).toBeVisible({ timeout: 10000 });
  }

  async shouldSeeTable(): Promise<boolean> {
    return await this.page.locator(InvoicesSelectors.table).first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  async shouldSeeEmptyState(): Promise<void> {
    const emptyState = this.page
      .locator(InvoicesSelectors.emptyState)
      .or(this.page.locator(InvoicesSelectors.emptyStateText))
      .or(this.page.locator(InvoicesSelectors.emptyStateTextRu));
    await expect(emptyState.first()).toBeVisible({ timeout: 10000 });
  }
}
