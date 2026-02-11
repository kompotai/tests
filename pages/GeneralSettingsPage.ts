/**
 * General Settings Page Object
 *
 * Settings → General
 * Workspace info, language, currency, timezone, date/time formats.
 */

import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';
import { WORKSPACE_ID } from '@fixtures/users';

export class GeneralSettingsPage extends BasePage {
  get path() { return `/ws/${WORKSPACE_ID}/settings/general`; }
  private get s() { return Selectors.generalSettings; }

  async waitForPageLoad(): Promise<void> {
    await this.page.locator(this.s.form).waitFor({ state: 'visible', timeout: 15000 });
  }

  // ============================================
  // READ-ONLY INFO
  // ============================================

  async getWorkspaceInfo(): Promise<string> {
    const form = this.page.locator(this.s.form);
    return (await form.locator('..').locator('..').textContent())?.substring(0, 500) || '';
  }

  // ============================================
  // LANGUAGE
  // ============================================

  async getLanguage(): Promise<string> {
    return await this.page.locator(this.s.selectLanguage).inputValue();
  }

  async setLanguage(value: string): Promise<void> {
    await this.page.locator(this.s.selectLanguage).selectOption(value);
    await this.wait(300);
  }

  // ============================================
  // CURRENCY
  // ============================================

  async getCurrency(): Promise<string> {
    return await this.page.locator(this.s.selectCurrency).inputValue();
  }

  async setCurrency(value: string): Promise<void> {
    await this.page.locator(this.s.selectCurrency).selectOption(value);
    await this.wait(300);
  }

  async getCurrencyPreviewText(): Promise<string> {
    // The preview shows formatted amount like "$1 234,56" or "€1 234,56" after the arrow "→"
    const form = this.page.locator(this.s.form);
    const preview = form.locator('text=/[₽$€£₸¥]\\d/').first();
    return (await preview.textContent())?.trim() || '';
  }

  // ============================================
  // TIMEZONE
  // ============================================

  async getTimezone(): Promise<string> {
    return await this.page.locator(this.s.selectTimezone).inputValue();
  }

  async setTimezone(value: string): Promise<void> {
    await this.page.locator(this.s.selectTimezone).selectOption(value);
    await this.wait(300);
  }

  // ============================================
  // DATE & TIME
  // ============================================

  async getShortPreset(): Promise<string> {
    return await this.page.locator(this.s.selectShortPreset).inputValue();
  }

  async setShortPreset(value: string): Promise<void> {
    await this.page.locator(this.s.selectShortPreset).selectOption(value);
    await this.wait(300);
  }

  async getShortPattern(): Promise<string> {
    return await this.page.locator(this.s.inputShortPattern).inputValue();
  }

  async setShortPattern(value: string): Promise<void> {
    const input = this.page.locator(this.s.inputShortPattern);
    await input.clear();
    await input.fill(value);
    await this.wait(300);
  }

  async getShortPreview(): Promise<string> {
    return (await this.page.locator(this.s.previewShort).textContent())?.trim() || '';
  }

  async getLongPreset(): Promise<string> {
    return await this.page.locator(this.s.selectLongPreset).inputValue();
  }

  async setLongPreset(value: string): Promise<void> {
    await this.page.locator(this.s.selectLongPreset).selectOption(value);
    await this.wait(300);
  }

  async getLongPattern(): Promise<string> {
    return await this.page.locator(this.s.inputLongPattern).inputValue();
  }

  async setLongPattern(value: string): Promise<void> {
    const input = this.page.locator(this.s.inputLongPattern);
    await input.clear();
    await input.fill(value);
    await this.wait(300);
  }

  async getLongPreview(): Promise<string> {
    return (await this.page.locator(this.s.previewLong).textContent())?.trim() || '';
  }

  // ============================================
  // ACTIONS
  // ============================================

  async save(): Promise<void> {
    await this.dismissOverlays();
    const btn = this.page.locator(this.s.submitButton);
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await this.waitForSpinner();
    await this.wait(500);
  }
}
