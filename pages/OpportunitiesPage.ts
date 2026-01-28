/**
 * Opportunities Page Object
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';

export interface OpportunityData {
  name: string;
  amount?: string;
}

export class OpportunitiesPage extends BasePage {
  readonly path = '/ws/opportunities';
  private get s() { return Selectors.opportunities; }

  async search(query: string): Promise<void> {
    await this.page.goto(`${this.path}?search=${encodeURIComponent(query)}`);
    await this.page.waitForLoadState('networkidle');
  }

  async openCreateForm(): Promise<void> {
    await this.page.locator(this.s.createButton).click();
    await this.wait(500);
  }

  async create(data: OpportunityData): Promise<boolean> {
    await this.openCreateForm();
    await this.page.locator(this.s.form.name).fill(data.name);

    // Select contact (required)
    const contactSelected = await this.selectFirstContact();
    if (!contactSelected) return false;

    await this.page.locator(this.s.form.submit).first().click();
    await this.waitForSpinner();
    return true;
  }

  async selectFirstContact(): Promise<boolean> {
    const selector = this.page.locator(this.s.form.contactSelect).first();
    if (!await selector.isVisible({ timeout: 2000 }).catch(() => false)) return false;

    await selector.click();
    await selector.fill('Test');
    await this.wait(1000);

    const option = this.page.locator(Selectors.common.selectOption).first();
    if (!await option.isVisible({ timeout: 3000 }).catch(() => false)) return false;

    await option.click();
    return true;
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

  // Assertions
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
}
