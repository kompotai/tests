/**
 * Base Page Object
 *
 * Contains common methods shared across all pages.
 * All page objects should extend this class.
 */

import { Page, expect } from '@playwright/test';
import { Selectors } from './selectors';

export abstract class BasePage {
  constructor(protected page: Page) {}

  // ============================================
  // Navigation
  // ============================================

  abstract readonly path: string;

  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  // ============================================
  // Loading States
  // ============================================

  async waitForSpinner(): Promise<void> {
    const spinner = this.page.locator(Selectors.common.spinner).first();
    if (await spinner.isVisible({ timeout: 500 }).catch(() => false)) {
      await spinner.waitFor({ state: 'hidden', timeout: 30000 });
    }
    await this.page.waitForLoadState('networkidle');
  }

  // ============================================
  // Dialogs & Modals
  // ============================================

  async confirmDialog(): Promise<void> {
    await this.page.locator(Selectors.common.confirmDialogYes).click();
    await this.waitForSpinner();
  }

  async cancelDialog(): Promise<void> {
    await this.page.locator(Selectors.common.confirmDialogNo).click();
  }

  async isConfirmDialogVisible(): Promise<boolean> {
    return await this.page.locator(Selectors.common.confirmDialog)
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  async closeModal(): Promise<void> {
    const closeBtn = this.page.locator(Selectors.common.modalClose).first();
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeBtn.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
  }

  // ============================================
  // Overlays
  // ============================================

  async dismissOverlays(): Promise<void> {
    await this.page.waitForTimeout(300);

    // Accept cookies if present
    const cookieBtn = this.page.locator(Selectors.common.cookieAccept).first();
    if (await cookieBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await cookieBtn.click();
    }

    // Dismiss any modal with Escape
    await this.page.keyboard.press('Escape').catch(() => {});
  }

  // ============================================
  // Assertions
  // ============================================

  async shouldSeeText(text: string, timeout = 10000): Promise<void> {
    await expect(this.page.getByText(text, { exact: false }).first())
      .toBeVisible({ timeout });
  }

  async shouldNotSeeText(text: string, timeout = 5000): Promise<void> {
    await expect(this.page.getByText(text, { exact: false }).first())
      .not.toBeVisible({ timeout });
  }

  async shouldBeOnPage(pattern: string | RegExp): Promise<void> {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    await this.page.waitForURL(regex, { timeout: 15000 });
  }

  async shouldSeeElement(selector: string, timeout = 10000): Promise<void> {
    await expect(this.page.locator(selector).first()).toBeVisible({ timeout });
  }

  // ============================================
  // Utilities
  // ============================================

  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  get url(): string {
    return this.page.url();
  }
}
