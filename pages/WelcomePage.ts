/**
 * Welcome Page Object
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';

export class WelcomePage extends BasePage {
  readonly path = '/ws';

  private get selectors() {
    return Selectors.welcome;
  }

  // ============================================
  // Navigation & Loading
  // ============================================

  async waitForPageLoad(): Promise<void> {
    await super.waitForPageLoad();
  }

  // ============================================
  // Actions
  // ============================================

  async clickContacts(): Promise<void> {
    await this.page.locator(this.selectors.contactsLink).first().click();
    await this.waitForPageLoad();
  }

  async clickOpportunities(): Promise<void> {
    await this.page.locator(this.selectors.opportunitiesLink).first().click();
    await this.waitForPageLoad();
  }

  async clickJobs(): Promise<void> {
    await this.page.locator(this.selectors.jobsLink).first().click();
    await this.waitForPageLoad();
  }

  async clickInvoices(): Promise<void> {
    await this.page.locator(this.selectors.invoicesLink).first().click();
    await this.waitForPageLoad();
  }

  async clickPayments(): Promise<void> {
    await this.page.locator(this.selectors.paymentsLink).first().click();
    await this.waitForPageLoad();
  }

  async clickTasks(): Promise<void> {
    await this.page.locator(this.selectors.tasksLink).first().click();
    await this.waitForPageLoad();
  }

  async clickCalendar(): Promise<void> {
    await this.page.locator(this.selectors.calendarLink).first().click();
    await this.waitForPageLoad();
  }

  async clickCalls(): Promise<void> {
    await this.page.locator(this.selectors.callsLink).first().click();
    await this.waitForPageLoad();
  }

  async clickSms(): Promise<void> {
    await this.page.locator(this.selectors.smsLink).first().click();
    await this.waitForPageLoad();
  }

  async clickProducts(): Promise<void> {
    await this.page.locator(this.selectors.productsLink).first().click();
    await this.waitForPageLoad();
  }

  // ============================================
  // Assertions
  // ============================================

  async shouldSeeHeading(): Promise<void> {
    await expect(this.page.locator(this.selectors.heading).first()).toBeVisible({ timeout: 10000 });
  }

  async shouldSeeAllLinks(): Promise<void> {
    const links = [
      this.selectors.contactsLink,
      this.selectors.opportunitiesLink,
      this.selectors.jobsLink,
      this.selectors.invoicesLink,
      this.selectors.paymentsLink,
      this.selectors.tasksLink,
      this.selectors.calendarLink,
      this.selectors.callsLink,
      this.selectors.smsLink,
      this.selectors.productsLink,
    ];
    for (const link of links) {
      await expect(this.page.locator(link).first()).toBeVisible({ timeout: 5000 });
    }
  }
}
