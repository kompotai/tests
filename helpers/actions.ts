/**
 * Reusable test actions and assertions
 *
 * Story-driven test helpers for Kompot E2E tests.
 * Follows Given-When-Then pattern.
 */

import { expect, Page, BrowserContext } from '@playwright/test';

// ============================================
// Navigation
// ============================================

export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

export async function reloadPage(page: Page): Promise<void> {
  await page.reload();
  await page.waitForLoadState('networkidle');
}

// ============================================
// Form Helpers
// ============================================

export async function fillField(page: Page, field: string, value: string): Promise<void> {
  const selectors = [
    // Kompot form patterns
    `[data-testid="contact-form-input-${field}"]`,
    `[data-testid="opportunity-form-input-${field}"]`,
    // Login form patterns
    `[data-testid="login-input-${field}"]`,
    // Generic patterns
    `[data-testid="${field}-input"]`,
    `[data-testid="${field}"]`,
    `input[name="${field}"]`,
    `input#${field}`,
    `input[placeholder*="${field}" i]`,
    `textarea[name="${field}"]`,
  ];

  for (const selector of selectors) {
    const input = page.locator(selector).first();
    if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
      await input.fill(value);
      return;
    }
  }

  const label = page.locator(`label:has-text("${field}")`).first();
  if (await label.isVisible({ timeout: 1000 }).catch(() => false)) {
    const input = label.locator('~ input, + input, input').first();
    await input.fill(value);
    return;
  }

  throw new Error(`Could not find field: ${field}`);
}

export async function clearField(page: Page, field: string): Promise<void> {
  const input = page.locator(`input[name="${field}"], input#${field}, [data-testid*="${field}"]`).first();
  await input.clear();
}

// ============================================
// Button Helpers
// ============================================

export async function clickButton(page: Page, buttonText: string): Promise<void> {
  // Special handling for Save/Submit - use test-id
  if (buttonText.toLowerCase() === 'save' || buttonText.toLowerCase() === 'submit') {
    const submitBtn = page.locator('[data-testid$="-button-submit"], button[type="submit"]').first();
    if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitBtn.click();
      return;
    }
  }

  const button = page.locator(`button:has-text("${buttonText}"), [data-testid*="button"]:has-text("${buttonText}")`).first();
  await button.click();
}

export async function clickButtonByTestId(page: Page, testId: string): Promise<void> {
  await page.locator(`[data-testid="${testId}"]`).click();
}

export async function clickLink(page: Page, linkText: string): Promise<void> {
  await page.locator(`a:has-text("${linkText}")`).first().click();
  await page.waitForLoadState('networkidle');
}

export async function clickSubmit(page: Page): Promise<void> {
  await page.locator('button[type="submit"]').click();
  await page.waitForLoadState('networkidle');
}

// ============================================
// Visibility Assertions
// ============================================

export async function shouldSee(page: Page, text: string): Promise<void> {
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible({ timeout: 10000 });
}

export async function shouldNotSee(page: Page, text: string): Promise<void> {
  await expect(page.getByText(text, { exact: false }).first()).not.toBeVisible({ timeout: 5000 });
}

export async function shouldSeeElement(page: Page, testId: string): Promise<void> {
  await expect(page.locator(`[data-testid="${testId}"]`)).toBeVisible({ timeout: 10000 });
}

export async function shouldSeeError(page: Page, message?: string): Promise<void> {
  const errorSelector = `.error, [class*="error"], [class*="destructive"], [role="alert"], .text-red`;
  if (message) {
    await expect(page.locator(errorSelector).filter({ hasText: message }).first()).toBeVisible({ timeout: 5000 });
  } else {
    await expect(page.locator(errorSelector).first()).toBeVisible({ timeout: 5000 });
  }
}

export async function shouldSeeSuccess(page: Page, message?: string): Promise<void> {
  const successSelector = `.success, [class*="success"], [class*="green"], .toast-success`;
  if (message) {
    await expect(page.locator(successSelector).filter({ hasText: message }).first()).toBeVisible({ timeout: 10000 });
  } else {
    await expect(page.locator(successSelector).first()).toBeVisible({ timeout: 10000 });
  }
}

// ============================================
// Page Assertions
// ============================================

export async function shouldBeOnPage(page: Page, pathPattern: string | RegExp): Promise<void> {
  const pattern = typeof pathPattern === 'string' ? new RegExp(pathPattern) : pathPattern;
  await page.waitForURL(pattern, { timeout: 15000 });
}

export async function shouldHaveTitle(page: Page, title: string | RegExp): Promise<void> {
  await expect(page).toHaveTitle(title);
}

// ============================================
// Form Assertions
// ============================================

export async function buttonShouldBeDisabled(page: Page, buttonText: string): Promise<void> {
  await expect(page.locator(`button:has-text("${buttonText}")`).first()).toBeDisabled();
}

export async function buttonShouldBeEnabled(page: Page, buttonText: string): Promise<void> {
  await expect(page.locator(`button:has-text("${buttonText}")`).first()).toBeEnabled();
}

// ============================================
// Table/List Helpers
// ============================================

export async function shouldSeeInTable(page: Page, text: string): Promise<void> {
  await expect(page.locator('table td, table th, [role="row"]').filter({ hasText: text }).first()).toBeVisible({ timeout: 10000 });
}

export async function clickRowAction(page: Page, rowText: string, actionText: string): Promise<void> {
  const row = page.locator('tr, [role="row"]').filter({ hasText: rowText }).first();
  await row.locator(`button:has-text("${actionText}"), a:has-text("${actionText}")`).first().click();
}

// ============================================
// Modal Helpers
// ============================================

export async function shouldSeeModal(page: Page, title?: string): Promise<void> {
  const modal = page.locator('[role="dialog"], [class*="modal"]').first();
  await expect(modal).toBeVisible({ timeout: 5000 });
  if (title) {
    await expect(modal.getByText(title)).toBeVisible();
  }
}

export async function closeModal(page: Page): Promise<void> {
  const closeBtn = page.locator('[role="dialog"] button:has-text("Close"), [role="dialog"] button[aria-label="Close"]').first();
  if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeBtn.click();
  } else {
    await page.keyboard.press('Escape');
  }
}

// ============================================
// Wait Helpers
// ============================================

export async function waitForLoading(page: Page): Promise<void> {
  const spinner = page.locator('.animate-spin, [class*="loading"], [class*="spinner"]').first();
  if (await spinner.isVisible({ timeout: 1000 }).catch(() => false)) {
    await spinner.waitFor({ state: 'hidden', timeout: 30000 });
  }
  await page.waitForLoadState('networkidle');
}

export async function waitFor(page: Page, ms: number): Promise<void> {
  await page.waitForTimeout(ms);
}
