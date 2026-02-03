/**
 * Payments Page Object
 *
 * Handles payment listing, searching, and viewing.
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { WORKSPACE_ID } from '@fixtures/users';

export interface PaymentData {
  id?: string;
  contactName?: string;
  amount?: number;
  status?: string;
  date?: string;
}

export class PaymentsPage extends BasePage {
  get path() {
    return `/ws/${WORKSPACE_ID}/finances/payments`;
  }

  // ============================================
  // Navigation
  // ============================================

  async waitForPageLoad(): Promise<void> {
    await super.waitForPageLoad();
    await this.page.locator('h1').first().waitFor({ state: 'visible', timeout: 10000 });
  }

  // ============================================
  // Table Operations
  // ============================================

  async getRowCount(): Promise<number> {
    const rows = this.page.locator('table tbody tr');
    return await rows.count();
  }

  async hasPayments(): Promise<boolean> {
    const count = await this.getRowCount();
    return count > 0;
  }

  async openFirstPayment(): Promise<string | null> {
    const rows = this.page.locator('table tbody tr');
    const count = await rows.count();

    if (count === 0) {
      return null;
    }

    const firstRow = rows.first();
    await firstRow.click();
    await this.page.waitForURL(/\/payments\/[a-f0-9]+/, { timeout: 10000 });
    await this.waitForPageLoad();

    const url = this.page.url();
    const match = url.match(/\/payments\/([a-f0-9]+)/);
    return match ? match[1] : null;
  }

  async openPayment(identifier: string): Promise<void> {
    if (/^[a-f0-9]{24}$/.test(identifier)) {
      await this.page.goto(`/ws/${WORKSPACE_ID}/finances/payments/${identifier}`);
      await this.page.waitForURL(/\/payments\/[a-f0-9]+/, { timeout: 10000 });
      await this.waitForPageLoad();
      return;
    }

    const row = this.page.locator('table tbody tr').filter({ hasText: identifier }).first();
    await row.click();
    await this.page.waitForURL(/\/payments\/[a-f0-9]+/, { timeout: 10000 });
    await this.waitForPageLoad();
  }

  // ============================================
  // Search Operations
  // ============================================

  async findPaymentByAmount(amount: number): Promise<boolean> {
    const amountStr = amount.toString();
    const row = this.page.locator('table tbody tr').filter({ hasText: amountStr });
    return await row.first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async findPaymentByContact(contactName: string): Promise<boolean> {
    const row = this.page.locator('table tbody tr').filter({ hasText: contactName });
    return await row.first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async getPaymentRowByAmount(amount: number) {
    const amountStr = amount.toString();
    return this.page.locator('table tbody tr').filter({ hasText: amountStr }).first();
  }

  async getPaymentRowByContact(contactName: string) {
    return this.page.locator('table tbody tr').filter({ hasText: contactName }).first();
  }

  async clickPaymentByAmount(amount: number): Promise<void> {
    const row = await this.getPaymentRowByAmount(amount);
    await row.click();
    await this.page.waitForURL(/\/payments\/[a-f0-9]+/, { timeout: 10000 });
    await this.waitForPageLoad();
  }

  async clickPaymentByContact(contactName: string): Promise<void> {
    const row = await this.getPaymentRowByContact(contactName);
    await row.click();
    await this.page.waitForURL(/\/payments\/[a-f0-9]+/, { timeout: 10000 });
    await this.waitForPageLoad();
  }

  // ============================================
  // Assertions
  // ============================================

  async shouldSeePayment(identifier: string): Promise<void> {
    await expect(this.page.getByText(identifier).first()).toBeVisible({ timeout: 10000 });
  }

  async shouldSeeTable(): Promise<boolean> {
    return await this.page.locator('table').first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  async shouldSeeEmptyState(): Promise<void> {
    const emptyState = this.page.locator('text=No payments').or(this.page.locator('text=Нет платежей'));
    await expect(emptyState.first()).toBeVisible({ timeout: 10000 });
  }
}
