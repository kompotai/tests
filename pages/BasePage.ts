/**
 * Base Page Object
 *
 * Contains common methods shared across all pages.
 * All page objects should extend this class.
 */

import { Page, expect } from '@playwright/test';
import { Selectors } from './selectors';

export abstract class BasePage {
  constructor(public readonly page: Page) {}

  // ============================================
  // Navigation
  // ============================================

  abstract get path(): string;

  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    // Use 'load' state first, then try networkidle with shorter timeout
    await this.page.waitForLoadState('load');
    // Try networkidle but don't fail if it times out (some pages have persistent connections)
    await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
      // Ignore timeout - page is already loaded, just has ongoing network activity
    });
    await this.dismissOverlays();
  }

  // ============================================
  // Loading States
  // ============================================

  async waitForSpinner(): Promise<void> {
    // Wait for form/button spinners to finish (not background page spinners)
    // Use button spinner or form-specific spinner, with shorter timeout
    const formSpinner = this.page.locator('button .animate-spin, [data-testid*="form"] .animate-spin, form .animate-spin').first();
    if (await formSpinner.isVisible({ timeout: 500 }).catch(() => false)) {
      await formSpinner.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    }
    await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
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
