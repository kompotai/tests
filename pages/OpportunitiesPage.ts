/**
 * Opportunities Page Object
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';
import { WORKSPACE_ID } from '@fixtures/users';

export interface OpportunityData {
  name: string;
  amount?: string | number;
  contactName?: string;
  description?: string;
}

export class OpportunitiesPage extends BasePage {
  get path() { return `/ws/${WORKSPACE_ID}/opportunities`; }
  private get s() { return Selectors.opportunities; }

  async waitForPageLoad(): Promise<void> {
    await this.page.locator(this.s.heading).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async search(query: string): Promise<void> {
    const searchInput = this.page.locator(this.s.searchInput);
    await searchInput.fill(query);
    await this.wait(1000);
  }

  async openCreateForm(): Promise<void> {
    await this.page.locator(this.s.createButton).click();
    await this.page.locator(this.s.form.container).waitFor({ state: 'visible', timeout: 5000 });
    await this.wait(500);
  }

  async create(data: OpportunityData): Promise<boolean> {
    await this.openCreateForm();

    // Fill name
    await this.page.locator(this.s.form.name).fill(data.name);

    // Fill amount if provided
    if (data.amount !== undefined) {
      await this.page.locator(this.s.form.amount).fill(data.amount.toString());
    }

    // Select contact (required or by name)
    if (data.contactName) {
      const contactSelected = await this.selectContact(data.contactName);
      if (!contactSelected) return false;
    } else {
      const contactSelected = await this.selectFirstContact();
      if (!contactSelected) return false;
    }

    // Fill description if provided
    if (data.description) {
      await this.page.locator('[data-testid="opportunity-form-input-description"]').fill(data.description);
    }

    await this.submitForm();
    return true;
  }

  async selectContact(contactName: string): Promise<boolean> {
    const selector = this.page.locator(this.s.form.contactSelect).first();
    if (!await selector.isVisible({ timeout: 2000 }).catch(() => false)) return false;

    await selector.click();
    await this.wait(300);

    // Type to search
    const input = selector.locator('input').first();
    await input.fill(contactName);
    await this.wait(800);

    // Select from dropdown
    const option = this.page.locator(`[role="option"]:has-text("${contactName}")`).first();
    if (!await option.isVisible({ timeout: 3000 }).catch(() => false)) return false;

    await option.click();
    await this.wait(300);
    return true;
  }

  async selectFirstContact(): Promise<boolean> {
    const selector = this.page.locator(this.s.form.contactSelect).first();
    if (!await selector.isVisible({ timeout: 2000 }).catch(() => false)) return false;

    await selector.click();
    await this.wait(300);

    // Type to search for test contacts
    const input = selector.locator('input').first();
    await input.fill('Carol'); // Use test contact from megatest
    await this.wait(800);

    const option = this.page.locator(Selectors.common.selectOption).first();
    if (!await option.isVisible({ timeout: 3000 }).catch(() => false)) return false;

    await option.click();
    await this.wait(300);
    return true;
  }

  async submitForm(): Promise<void> {
    // Dismiss any notification toasts that might be blocking
    await this.dismissToasts();

    await this.page.locator(this.s.form.submit).first().click();
    // Wait for form to close
    await this.page.locator(this.s.form.container).waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await this.wait(500);
  }

  async dismissToasts(): Promise<void> {
    // Try to close any toast notifications that might be blocking
    const closeButtons = this.page.locator('[data-testid="toast-close"], .animate-slide-up-fade button');
    const count = await closeButtons.count();
    for (let i = 0; i < count; i++) {
      await closeButtons.nth(i).click().catch(() => {});
    }
    await this.wait(300);
  }

  async cancelForm(): Promise<void> {
    await this.dismissToasts();
    await this.page.locator(this.s.form.cancel).click();
    await this.wait(300);
  }

  async clickRowEdit(): Promise<boolean> {
    const btn = this.page.locator(this.s.rowEditButton).first();
    if (!await btn.isVisible({ timeout: 3000 }).catch(() => false)) return false;
    await btn.click();
    await this.wait(1000);
    return true;
  }

  async clickRowDelete(): Promise<boolean> {
    const btn = this.page.locator(this.s.rowDeleteButton).first();
    if (!await btn.isVisible({ timeout: 3000 }).catch(() => false)) return false;
    await btn.click();
    await this.wait(500);
    return true;
  }

  async clickRowToOpen(name: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${name}")`).first();
    const nameCell = row.locator('td').first();
    await nameCell.click();
    await this.wait(500);
  }

  // ============================================
  // Assertions
  // ============================================

  async shouldSeeOpportunity(name: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${name}")`).first();
    await expect(row).toBeVisible({ timeout: 10000 });
  }

  async shouldNotSeeOpportunity(name: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${name}")`);
    await expect(row).not.toBeVisible({ timeout: 5000 });
  }

  async shouldSeeTable(): Promise<boolean> {
    return this.page.locator(this.s.table).first().isVisible({ timeout: 3000 }).catch(() => false);
  }

  async shouldSeeEmptyState(): Promise<void> {
    await expect(this.page.locator(this.s.emptyState)).toBeVisible({ timeout: 10000 });
  }

  async shouldSeeStageColumn(): Promise<boolean> {
    return this.page.locator(this.s.stageColumn).first().isVisible({ timeout: 3000 }).catch(() => false);
  }

  async shouldSeePipelineTabs(): Promise<boolean> {
    return this.page.locator(this.s.pipelineTabs).first().isVisible({ timeout: 3000 }).catch(() => false);
  }

  async shouldSeeForm(): Promise<boolean> {
    return this.page.locator(this.s.form.container).first().isVisible({ timeout: 3000 }).catch(() => false);
  }

  async getOpportunityCount(): Promise<number> {
    const rows = this.page.locator('table tbody tr');
    return await rows.count();
  }
}
