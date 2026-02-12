/**
 * Webhooks Settings Page Object
 *
 * Settings → Webhooks
 * Configure outgoing HTTP notifications for system events.
 */

import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';
import { WORKSPACE_ID } from '@fixtures/users';

export interface WebhookData {
  name: string;
  url: string;
  method?: string;
  events: string[];
}

export class WebhooksPage extends BasePage {
  get path() { return `/ws/${WORKSPACE_ID}/settings/webhooks`; }
  private get s() { return Selectors.webhooks; }

  async waitForPageLoad(): Promise<void> {
    await this.page.locator(this.s.list).waitFor({ state: 'visible', timeout: 15000 });
  }

  // ============================================
  // WEBHOOK LIST
  // ============================================

  private async getWebhookIdByName(name: string): Promise<string> {
    const row = this.page.locator(`[data-testid="webhooks-list"] tr:has-text("${name}")`);
    const testid = await row.getAttribute('data-testid');
    return testid?.replace('webhook-item-', '') || '';
  }

  async shouldSeeWebhook(name: string): Promise<void> {
    await expect(
      this.page.locator(`[data-testid="webhooks-list"] tr:has-text("${name}")`)
    ).toBeVisible();
  }

  async shouldNotSeeWebhook(name: string): Promise<void> {
    await expect(
      this.page.locator(`[data-testid="webhooks-list"] tr:has-text("${name}")`)
    ).not.toBeVisible({ timeout: 5000 });
  }

  // ============================================
  // CREATE WEBHOOK
  // ============================================

  async openCreateForm(): Promise<void> {
    await this.page.locator(this.s.createButton).first().click();
    await this.page.locator(this.s.form).waitFor({ state: 'visible' });
  }

  async fillForm(data: WebhookData): Promise<void> {
    const nameInput = this.page.locator(this.s.formInputName);
    await nameInput.clear();
    await nameInput.fill(data.name);

    const urlInput = this.page.locator(this.s.formInputUrl);
    await urlInput.clear();
    await urlInput.fill(data.url);

    if (data.method) {
      await this.page.locator(this.s.formSelectMethod).selectOption(data.method);
    }

    // Select events by clicking labels with matching text
    for (const event of data.events) {
      const label = this.page.locator(this.s.form).getByText(event, { exact: false }).first();
      await label.click();
    }
  }

  async submitForm(): Promise<void> {
    await this.dismissCookieBanner();
    const btn = this.page.locator(this.s.formSubmit);
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await this.waitForSpinner();
  }

  private async dismissCookieBanner(): Promise<void> {
    const cookieBtn = this.page.locator('[data-testid="cookie-accept-all"]');
    if (await cookieBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await cookieBtn.click();
      await this.wait(300);
    }
  }

  async createWebhook(data: WebhookData): Promise<void> {
    await this.openCreateForm();
    await this.fillForm(data);
    await this.submitForm();
  }

  async cancelForm(): Promise<void> {
    await this.page.locator(this.s.formCancel).click();
    await this.wait(300);
  }

  // ============================================
  // EDIT WEBHOOK
  // ============================================

  async openEditForm(name: string): Promise<void> {
    const id = await this.getWebhookIdByName(name);
    await this.page.locator(this.s.webhookEdit(id)).click();
    await this.page.locator(this.s.form).waitFor({ state: 'visible' });
  }

  async editWebhook(name: string, data: Partial<WebhookData>): Promise<void> {
    await this.openEditForm(name);
    if (data.name) {
      const nameInput = this.page.locator(this.s.formInputName);
      await nameInput.clear();
      await nameInput.fill(data.name);
    }
    if (data.url) {
      const urlInput = this.page.locator(this.s.formInputUrl);
      await urlInput.clear();
      await urlInput.fill(data.url);
    }
    await this.submitForm();
  }

  // ============================================
  // DELETE WEBHOOK
  // ============================================

  async deleteWebhook(name: string): Promise<void> {
    const id = await this.getWebhookIdByName(name);
    await this.page.locator(this.s.webhookDelete(id)).click();
    await this.confirmDialog();
  }

  // ============================================
  // TOGGLE WEBHOOK
  // ============================================

  async toggleWebhook(name: string): Promise<void> {
    const id = await this.getWebhookIdByName(name);
    await this.page.locator(this.s.webhookToggle(id)).click();
    await this.wait(500);
  }

  async isWebhookEnabled(name: string): Promise<boolean> {
    const id = await this.getWebhookIdByName(name);
    const toggle = this.page.locator(this.s.webhookToggle(id));
    const checkbox = toggle.locator('input[type="checkbox"]');
    return await checkbox.isChecked();
  }
}
