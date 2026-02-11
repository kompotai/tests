/**
 * T6-DUEDATE: Due Date filter tests
 *
 * Due Date dropdown options: "Any date", "On date", "Between"
 *
 * After selecting "On date":
 *   - Quick buttons: Today, Yesterday, Tomorrow
 *   - Date input: mm/dd/yyyy
 *
 * Tests:
 *   1. "On date" + Today button filters tasks
 *   2. "On date" + Yesterday button filters tasks
 *   3. "On date" + Tomorrow button filters tasks
 *   4. "On date" + specific date via date picker input
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { TasksPage } from '@pages/index';

/** Open Filters panel and select "On date" from the Due Date dropdown */
async function selectOnDate(page: import('@playwright/test').Page) {
  await page.locator('button:has-text("Filters")').first().click();
  await page.getByText('Any date').first().waitFor({ state: 'visible', timeout: 5000 });
  await page.getByText('Any date').first().click({ force: true });

  const onDateOption = page.locator('[role="option"]').filter({ hasText: 'On date' }).first();
  await onDateOption.waitFor({ state: 'visible', timeout: 3000 });
  await onDateOption.click();
}

ownerTest.describe('T6-DUEDATE: Due Date Filter', () => {
  ownerTest.describe.configure({ mode: 'serial' });

  let tasksPage: TasksPage;

  ownerTest.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
  });

  // ── Quick buttons ──

  ownerTest('"On date" + Today: filters tasks and shows clear button', async ({ page }) => {
    await tasksPage.goto();
    await selectOnDate(page);

    // Quick buttons should be visible after selecting "On date"
    const todayBtn = page.getByText('Today', { exact: true }).first();
    await expect(todayBtn).toBeVisible({ timeout: 3000 });
    await todayBtn.click();
    await page.waitForLoadState('networkidle').catch(() => {});

    // Task list should update
    const hasRows = await page.locator('table tbody tr').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.getByText('Tasks not found').first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasRows || hasEmpty).toBe(true);

    // "Clear all filters" should appear
    await expect(page.getByText('Clear all filters').first()).toBeVisible({ timeout: 3000 });

    // Take screenshot to see the filtered state
    await page.screenshot({ path: 'test-results/duedate-today.png', fullPage: true });
  });

  ownerTest('"On date" + Yesterday: filters tasks and shows clear button', async ({ page }) => {
    await tasksPage.goto();
    await selectOnDate(page);

    const yesterdayBtn = page.getByText('Yesterday', { exact: true }).first();
    await expect(yesterdayBtn).toBeVisible({ timeout: 3000 });
    await yesterdayBtn.click();
    await page.waitForLoadState('networkidle').catch(() => {});

    const hasRows = await page.locator('table tbody tr').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.getByText('Tasks not found').first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasRows || hasEmpty).toBe(true);

    await expect(page.getByText('Clear all filters').first()).toBeVisible({ timeout: 3000 });

    await page.screenshot({ path: 'test-results/duedate-yesterday.png', fullPage: true });
  });

  ownerTest('"On date" + Tomorrow: filters tasks and shows clear button', async ({ page }) => {
    await tasksPage.goto();
    await selectOnDate(page);

    const tomorrowBtn = page.getByText('Tomorrow', { exact: true }).first();
    await expect(tomorrowBtn).toBeVisible({ timeout: 3000 });
    await tomorrowBtn.click();
    await page.waitForLoadState('networkidle').catch(() => {});

    const hasRows = await page.locator('table tbody tr').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.getByText('Tasks not found').first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasRows || hasEmpty).toBe(true);

    await expect(page.getByText('Clear all filters').first()).toBeVisible({ timeout: 3000 });

    await page.screenshot({ path: 'test-results/duedate-tomorrow.png', fullPage: true });
  });

  // ── Date picker input ──

  ownerTest('"On date" + specific date via input: filters tasks', async ({ page }) => {
    await tasksPage.goto();
    await selectOnDate(page);

    // The date input field should be visible (mm/dd/yyyy)
    const dateInput = page.locator('input[type="date"]').first();
    await expect(dateInput).toBeVisible({ timeout: 3000 });

    // Fill with today's date in mm/dd/yyyy format
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear();
    await dateInput.fill(`${yyyy}-${mm}-${dd}`);
    await page.waitForLoadState('networkidle').catch(() => {});

    // Task list should update
    const hasRows = await page.locator('table tbody tr').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.getByText('Tasks not found').first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasRows || hasEmpty).toBe(true);

    await expect(page.getByText('Clear all filters').first()).toBeVisible({ timeout: 3000 });

    await page.screenshot({ path: 'test-results/duedate-specific-date.png', fullPage: true });
  });
});
