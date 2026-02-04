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
      await this.page.locator(this.s.form.description).fill(data.description);
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

    // Click the input to ensure dropdown opens
    const input = selector.locator('input').first();
    if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
      await input.click();
    }
    await this.wait(500);

    // Select the first available contact from dropdown
    const option = this.page.locator(Selectors.common.selectOption).first();
    if (!await option.isVisible({ timeout: 5000 }).catch(() => false)) return false;

    await option.click();
    await this.wait(300);
    return true;
  }

  async clickSubmit(): Promise<void> {
    await this.dismissToasts();
    await this.page.locator(this.s.form.submit).first().click();
  }

  async submitForm(): Promise<void> {
    await this.clickSubmit();
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

  async fillName(name: string): Promise<void> {
    const nameInput = this.page.locator(this.s.form.name);
    await nameInput.clear();
    await nameInput.fill(name);
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

  async clickRowEditByName(name: string): Promise<boolean> {
    const row = this.page.locator(this.s.row(name)).first();
    await row.hover();
    const btn = row.locator('td:last-child').getByRole('button', { name: 'Edit' });
    if (!await btn.isVisible({ timeout: 3000 }).catch(() => false)) return false;
    await btn.click();
    await this.page.locator(this.s.form.container).waitFor({ state: 'visible', timeout: 5000 });
    await this.wait(500);
    return true;
  }

  async clickRowDeleteByName(name: string): Promise<boolean> {
    const row = this.page.locator(this.s.row(name)).first();
    await row.hover();
    const btn = row.locator('td:last-child').getByRole('button', { name: 'Delete' });
    if (!await btn.isVisible({ timeout: 3000 }).catch(() => false)) return false;
    await btn.click();
    await this.wait(500);
    return true;
  }

  async edit(name: string, newData: Partial<OpportunityData>): Promise<void> {
    const opened = await this.clickRowEditByName(name);
    if (!opened) throw new Error(`Could not open edit form for "${name}"`);

    if (newData.name !== undefined) {
      const nameInput = this.page.locator(this.s.form.name);
      await nameInput.clear();
      await nameInput.fill(newData.name);
    }

    if (newData.amount !== undefined) {
      const amountInput = this.page.locator(this.s.form.amount);
      await amountInput.clear();
      await amountInput.fill(newData.amount.toString());
    }

    if (newData.description !== undefined) {
      const descInput = this.page.locator(this.s.form.description);
      await descInput.clear();
      await descInput.fill(newData.description);
    }

    await this.submitForm();
  }

  async delete(name: string): Promise<void> {
    await this.clickRowDeleteByName(name);
    if (await this.isConfirmDialogVisible()) {
      await this.confirmDialog();
    }
    // Wait for the row to disappear (delete may happen without confirmation)
    await this.page.locator(this.s.row(name)).first()
      .waitFor({ state: 'hidden', timeout: 10000 })
      .catch((e) => console.warn(`Row "${name}" did not disappear after delete: ${e.message}`));
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

  async getOpportunityAmount(name: string): Promise<string> {
    const row = this.page.locator(this.s.row(name)).first();
    await expect(row).toBeVisible({ timeout: 5000 });
    // Amount is typically in the second td (index 1) after the name column
    const amountCell = row.locator('td').nth(1);
    return (await amountCell.textContent() ?? '').trim();
  }

  async getOpportunityCount(): Promise<number> {
    const rows = this.page.locator('table tbody tr');
    return await rows.count();
  }
}
