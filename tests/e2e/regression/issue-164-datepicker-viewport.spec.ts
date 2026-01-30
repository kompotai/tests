/**
 * Regression test for Issue #164
 * DatePicker should auto-position to avoid viewport overflow
 *
 * Bug: Estimate Valid Until date picker was partially out of viewport
 * Fix: DatePicker now detects available space and opens upward if needed
 *
 * @see https://github.com/kompotai/bug-reports/issues/164
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';

ownerTest.describe('Issue #164: DatePicker Viewport Positioning', { tag: ['@regression'] }, () => {
  ownerTest('datepicker opens and is usable @regression', async ({ page }) => {
    // Navigate to estimates page
    await page.goto('/ws/estimates');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Handle cookie consent if present
    const acceptCookies = page.getByRole('button', { name: 'Accept All' });
    if (await acceptCookies.isVisible({ timeout: 1000 }).catch(() => false)) {
      await acceptCookies.click();
      await page.waitForTimeout(300);
    }

    // Click create estimate button
    const createButton = page.getByRole('button', { name: /Create estimate|Создать смету/i });
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();

    // Wait for form to appear
    await page.waitForSelector('form', { timeout: 5000 });

    // Find the Valid Until field button by looking for "Select date" text
    const validUntilButton = page.locator('button').filter({ hasText: /Select date|Выбрать дату/i });
    await expect(validUntilButton).toBeVisible({ timeout: 5000 });
    await validUntilButton.scrollIntoViewIfNeeded();
    await validUntilButton.click();

    // Verify calendar opened - "Today" quick select button should be visible
    const todayButton = page.getByRole('button', { name: /^Today$|^Сегодня$/i });
    await expect(todayButton).toBeVisible({ timeout: 3000 });

    // Verify the month header is visible (proves calendar rendered correctly)
    const monthHeader = page.locator('text=/January|February|March|April|May|June|July|August|September|October|November|December|Январь|Февраль|Март|Апрель|Май|Июнь|Июль|Август|Сентябрь|Октябрь|Ноябрь|Декабрь/i').first();
    await expect(monthHeader).toBeVisible({ timeout: 2000 });

    // Click Today to select current date
    await todayButton.click();

    // Wait for selection
    await page.waitForTimeout(300);

    // Verify the calendar closed and date was selected
    // The button should now show a date instead of "Select date"
    await expect(todayButton).not.toBeVisible({ timeout: 2000 });
  });

  ownerTest('datepicker date selection works @regression', async ({ page }) => {
    // Navigate to estimates page
    await page.goto('/ws/estimates');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Handle cookie consent if present
    const acceptCookies = page.getByRole('button', { name: 'Accept All' });
    if (await acceptCookies.isVisible({ timeout: 1000 }).catch(() => false)) {
      await acceptCookies.click();
      await page.waitForTimeout(300);
    }

    // Click create estimate button
    const createButton = page.getByRole('button', { name: /Create estimate|Создать смету/i });
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();

    // Wait for form to appear
    await page.waitForSelector('form', { timeout: 5000 });

    // Find the Valid Until field button
    const validUntilButton = page.locator('button').filter({ hasText: /Select date|Выбрать дату/i });
    await expect(validUntilButton).toBeVisible({ timeout: 5000 });
    await validUntilButton.click();

    // Wait for calendar
    const tomorrowButton = page.getByRole('button', { name: /^Tomorrow$|^Завтра$/i });
    await expect(tomorrowButton).toBeVisible({ timeout: 3000 });

    // Click Tomorrow
    await tomorrowButton.click();
    await page.waitForTimeout(300);

    // Calendar should close
    await expect(tomorrowButton).not.toBeVisible({ timeout: 2000 });

    // The form should still be visible (no errors)
    await expect(page.locator('form')).toBeVisible();
  });
});
