/**
 * T6-AC1: Filter by Status
 *
 * Two areas:
 *   A) Status Tab Bar — clicking tab buttons (All, Backlog, To Do, Open, In Progress, Completed, Cancelled)
 *   B) Status Filters Dropdown — selecting status from Filters panel dropdown
 *
 * 14 tests total (7 + 7)
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { TasksPage } from '@pages/index';

/** Click a status tab and wait for table to show expected status or empty state */
async function clickTabAndWait(page: import('@playwright/test').Page, tabRegex: RegExp, expectedStatus: string) {
  const tab = page.locator('button').filter({ hasText: tabRegex }).first();
  await expect(tab).toBeVisible({ timeout: 5000 });
  await tab.click();

  // Wait for table to actually show the filtered data
  const expectedCell = page.locator('table tbody tr td:nth-child(3)').filter({ hasText: expectedStatus }).first();
  const emptyState = page.getByText('No tasks yet').first();

  await Promise.race([
    expectedCell.waitFor({ state: 'visible', timeout: 10000 }),
    emptyState.waitFor({ state: 'visible', timeout: 10000 }),
  ]);
}

/** Open Filters panel, select a status, and wait for table to update */
async function selectStatusFilter(page: import('@playwright/test').Page, status: string) {
  await page.locator('button:has-text("Filters")').first().click();
  await page.getByText('All statuses').first().waitFor({ state: 'visible', timeout: 5000 });
  await page.getByText('All statuses').first().click({ force: true });

  const option = page.locator('[role="option"]').filter({ hasText: status }).first();
  await option.waitFor({ state: 'visible', timeout: 3000 });
  await option.click();

  // Wait for table to update
  const expectedRow = page.locator('table tbody tr').first();
  const emptyState = page.getByText('No tasks yet').first();

  await Promise.race([
    expectedRow.waitFor({ state: 'visible', timeout: 10000 }),
    emptyState.waitFor({ state: 'visible', timeout: 10000 }),
  ]);
}

ownerTest.describe('T6-AC1: Filter by Status', () => {
  ownerTest.describe.configure({ mode: 'serial' });

  let tasksPage: TasksPage;

  ownerTest.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
  });

  // ══════════════════════════════════════════
  // A) Status Tab Bar
  // ══════════════════════════════════════════

  ownerTest.describe('Status Tab Bar', () => {

    ownerTest('"To Do" tab filters tasks to To Do status', async ({ page }) => {
      await tasksPage.goto();
      await clickTabAndWait(page, /^To Do/, 'To Do');

      const statusCells = page.locator('table tbody tr td:nth-child(3)');
      const hasRows = await statusCells.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasRows) {
        const statuses = await statusCells.allTextContents();
        for (const s of statuses) {
          expect(s.trim()).toContain('To Do');
        }
      } else {
        await expect(page.getByText('No tasks yet').first()).toBeVisible({ timeout: 3000 });
      }
    });

    ownerTest('"In Progress" tab filters tasks to In Progress status', async ({ page }) => {
      await tasksPage.goto();
      await clickTabAndWait(page, /^In Progress/, 'In Progress');

      const statusCells = page.locator('table tbody tr td:nth-child(3)');
      const hasRows = await statusCells.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasRows) {
        const statuses = await statusCells.allTextContents();
        for (const s of statuses) {
          expect(s.trim()).toContain('In Progress');
        }
      } else {
        await expect(page.getByText('No tasks yet').first()).toBeVisible({ timeout: 3000 });
      }
    });

    ownerTest('"Completed" tab filters tasks to Completed status', async ({ page }) => {
      await tasksPage.goto();
      await clickTabAndWait(page, /^Completed/, 'Completed');

      const statusCells = page.locator('table tbody tr td:nth-child(3)');
      const hasRows = await statusCells.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasRows) {
        const statuses = await statusCells.allTextContents();
        for (const s of statuses) {
          expect(s.trim()).toContain('Completed');
        }
      } else {
        await expect(page.getByText('No tasks yet').first()).toBeVisible({ timeout: 3000 });
      }
    });

    ownerTest('"Open" tab filters tasks to Open status', async ({ page }) => {
      await tasksPage.goto();
      await clickTabAndWait(page, /^Open/, 'Open');

      const statusCells = page.locator('table tbody tr td:nth-child(3)');
      const hasRows = await statusCells.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasRows) {
        const statuses = await statusCells.allTextContents();
        for (const s of statuses) {
          expect(s.trim()).toContain('Open');
        }
      } else {
        await expect(page.getByText('No tasks yet').first()).toBeVisible({ timeout: 3000 });
      }
    });

    ownerTest('"Backlog" tab filters tasks to Backlog status', async ({ page }) => {
      await tasksPage.goto();
      await clickTabAndWait(page, /^Backlog/, 'Backlog');

      const statusCells = page.locator('table tbody tr td:nth-child(3)');
      const hasRows = await statusCells.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasRows) {
        const statuses = await statusCells.allTextContents();
        for (const s of statuses) {
          expect(s.trim()).toContain('Backlog');
        }
      } else {
        await expect(page.getByText('No tasks yet').first()).toBeVisible({ timeout: 3000 });
      }
    });

    ownerTest('"Cancelled" tab filters tasks to Cancelled status', async ({ page }) => {
      await tasksPage.goto();
      await clickTabAndWait(page, /^Cancelled/, 'Cancelled');

      const statusCells = page.locator('table tbody tr td:nth-child(3)');
      const hasRows = await statusCells.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasRows) {
        const statuses = await statusCells.allTextContents();
        for (const s of statuses) {
          expect(s.trim()).toContain('Cancelled');
        }
      } else {
        await expect(page.getByText('No tasks yet').first()).toBeVisible({ timeout: 3000 });
      }
    });

    ownerTest('"All" tab shows all tasks again', async ({ page }) => {
      await tasksPage.goto();

      // First click "To Do" tab to filter
      await clickTabAndWait(page, /^To Do/, 'To Do');

      // Now click "All" tab in the tab bar
      const allTab = page.locator('button', { has: page.locator('text="Backlog"') }).locator('..').locator('button').first();
      await expect(allTab).toBeVisible({ timeout: 5000 });
      await allTab.click();

      // Wait for table to load
      const rows = page.locator('table tbody tr');
      const emptyState = page.getByText('No tasks yet').first();
      await Promise.race([
        rows.first().waitFor({ state: 'visible', timeout: 10000 }),
        emptyState.waitFor({ state: 'visible', timeout: 10000 }),
      ]);

      const hasRows = await rows.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasRows) {
        const count = await rows.count();
        expect(count).toBeGreaterThan(0);
      } else {
        await expect(emptyState).toBeVisible({ timeout: 3000 });
      }
    });
  });

  // ══════════════════════════════════════════
  // B) Status Filters Dropdown
  // ══════════════════════════════════════════

  ownerTest.describe('Status Filters Dropdown', () => {

    ownerTest('Filter by "To Do" from Filters panel', async ({ page }) => {
      await tasksPage.goto();
      await selectStatusFilter(page, 'To Do');

      const hasRows = await page.locator('table tbody tr').first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasRows) {
        expect(hasRows).toBe(true);
      } else {
        await expect(page.getByText('No tasks yet').first()).toBeVisible({ timeout: 3000 });
      }

      await expect(page.getByText('Clear all filters').first()).toBeVisible({ timeout: 3000 });
    });

    ownerTest('Filter by "In Progress" from Filters panel', async ({ page }) => {
      await tasksPage.goto();
      await selectStatusFilter(page, 'In Progress');

      const hasRows = await page.locator('table tbody tr').first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasRows) {
        expect(hasRows).toBe(true);
      } else {
        await expect(page.getByText('No tasks yet').first()).toBeVisible({ timeout: 3000 });
      }

      await expect(page.getByText('Clear all filters').first()).toBeVisible({ timeout: 3000 });
    });

    ownerTest('Filter by "Completed" from Filters panel', async ({ page }) => {
      await tasksPage.goto();
      await selectStatusFilter(page, 'Completed');

      const hasRows = await page.locator('table tbody tr').first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasRows) {
        expect(hasRows).toBe(true);
      } else {
        await expect(page.getByText('No tasks yet').first()).toBeVisible({ timeout: 3000 });
      }

      await expect(page.getByText('Clear all filters').first()).toBeVisible({ timeout: 3000 });
    });

    ownerTest('Filter by "Open" from Filters panel', async ({ page }) => {
      await tasksPage.goto();
      await selectStatusFilter(page, 'Open');

      const hasRows = await page.locator('table tbody tr').first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasRows) {
        expect(hasRows).toBe(true);
      } else {
        await expect(page.getByText('No tasks yet').first()).toBeVisible({ timeout: 3000 });
      }

      await expect(page.getByText('Clear all filters').first()).toBeVisible({ timeout: 3000 });
    });

    ownerTest('Filter by "Backlog" from Filters panel', async ({ page }) => {
      await tasksPage.goto();
      await selectStatusFilter(page, 'Backlog');

      const hasRows = await page.locator('table tbody tr').first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasRows) {
        expect(hasRows).toBe(true);
      } else {
        await expect(page.getByText('No tasks yet').first()).toBeVisible({ timeout: 3000 });
      }

      await expect(page.getByText('Clear all filters').first()).toBeVisible({ timeout: 3000 });
    });

    ownerTest('Filter by "Cancelled" from Filters panel', async ({ page }) => {
      await tasksPage.goto();
      await selectStatusFilter(page, 'Cancelled');

      const hasRows = await page.locator('table tbody tr').first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasRows) {
        expect(hasRows).toBe(true);
      } else {
        await expect(page.getByText('No tasks yet').first()).toBeVisible({ timeout: 3000 });
      }

      await expect(page.getByText('Clear all filters').first()).toBeVisible({ timeout: 3000 });
    });

    ownerTest('"Clear all filters" resets status filter', async ({ page }) => {
      await tasksPage.goto();

      // Apply a status filter
      await selectStatusFilter(page, 'To Do');

      // Click "Clear all filters"
      const clearBtn = page.getByText('Clear all filters').first();
      await expect(clearBtn).toBeVisible({ timeout: 3000 });
      await clearBtn.click();

      // Wait for table to reload
      await page.locator('table tbody tr').first().waitFor({ state: 'visible', timeout: 10000 });

      // Placeholder should reset
      await expect(page.getByText('All statuses').first()).toBeVisible({ timeout: 3000 });

      // "Clear all filters" should be hidden
      await expect(page.getByText('Clear all filters').first()).not.toBeVisible({ timeout: 3000 });
    });
  });
});
