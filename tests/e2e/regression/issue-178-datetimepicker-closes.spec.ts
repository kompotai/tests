/**
 * Regression test for Issue #178
 * DateTimePicker calendar should close after selecting a date
 *
 * Bug: Calendar stayed open after clicking on a date number
 * Fix: Added setIsOpen(false) in handleDateSelect
 *
 * @see https://github.com/kompotai/bug-reports/issues/178
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #178: DateTimePicker Closes After Selection', { tag: ['@regression'] }, () => {
  ownerTest('calendar closes after selecting date in job form @regression', async ({ page, request }) => {
    // First create a contact for the job
    const contactResponse = await request.post('/api/ws/megatest/contacts', {
      data: { name: `Test Contact #178 - ${Date.now()}` },
    });
    expect(contactResponse.status()).toBe(201);
    const contact = await contactResponse.json();

    try {
      // Navigate to jobs page
      await page.goto(`/ws/${WORKSPACE_ID}/jobs`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      // Handle cookie consent if present
      const acceptCookies = page.getByRole('button', { name: 'Accept All' });
      if (await acceptCookies.isVisible({ timeout: 1000 }).catch(() => false)) {
        await acceptCookies.click();
        await page.waitForTimeout(300);
      }

      // Click create job button
      const createButton = page.getByRole('button', { name: /Create job|Создать работу|New job|Новая работа/i });
      await expect(createButton).toBeVisible({ timeout: 10000 });
      await createButton.click();

      // Wait for job form to appear
      const jobForm = page.getByTestId('job-form');
      await expect(jobForm).toBeVisible({ timeout: 5000 });

      // Find the "Start at" label and the DateTimePicker next to it
      const startAtLabel = page.locator('label').filter({ hasText: /^Start at|^Начало/i });
      await expect(startAtLabel).toBeVisible({ timeout: 5000 });

      // Find the button with calendar icon - it's the button inside the Start at field container
      const startAtContainer = startAtLabel.locator('..').locator('button').last();
      await startAtContainer.click();

      // Wait for calendar to appear - look for quick select buttons (Today 9:00, Tomorrow 9:00)
      const todayButton = page.getByRole('button', { name: /Today \d|Сегодня \d/i });
      await expect(todayButton).toBeVisible({ timeout: 3000 });

      // Click a day number to select a date (e.g., day 15)
      const day15 = page.locator('button').filter({ hasText: '15' }).first();
      await day15.click();

      // Calendar should close automatically after date selection
      await page.waitForTimeout(500);
      await expect(todayButton).not.toBeVisible({ timeout: 3000 });

      // Job form should still be open
      await expect(jobForm).toBeVisible();
    } finally {
      // Cleanup
      await request.delete(`/api/ws/megatest/contacts/${contact.id}`);
    }
  });

  ownerTest('datetimepicker quick select works @regression', async ({ page, request }) => {
    // First create a contact
    const contactResponse = await request.post('/api/ws/megatest/contacts', {
      data: { name: `Test Contact #178b - ${Date.now()}` },
    });
    expect(contactResponse.status()).toBe(201);
    const contact = await contactResponse.json();

    try {
      // Navigate to jobs page
      await page.goto(`/ws/${WORKSPACE_ID}/jobs`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      // Handle cookie consent if present
      const acceptCookies = page.getByRole('button', { name: 'Accept All' });
      if (await acceptCookies.isVisible({ timeout: 1000 }).catch(() => false)) {
        await acceptCookies.click();
        await page.waitForTimeout(300);
      }

      // Click create job button
      const createButton = page.getByRole('button', { name: /Create job|Создать работу|New job|Новая работа/i });
      await expect(createButton).toBeVisible({ timeout: 10000 });
      await createButton.click();

      // Wait for job form to appear
      const jobForm = page.getByTestId('job-form');
      await expect(jobForm).toBeVisible({ timeout: 5000 });

      // Find the "End at" label and the DateTimePicker
      const endAtLabel = page.locator('label').filter({ hasText: /^End at|^Окончание/i });
      await expect(endAtLabel).toBeVisible({ timeout: 5000 });

      // Click to open the date picker
      const endAtButton = endAtLabel.locator('..').locator('button').last();
      await endAtButton.click();

      // Wait for calendar with quick select buttons
      const tomorrowButton = page.getByRole('button', { name: /Tomorrow \d|Завтра \d/i });
      await expect(tomorrowButton).toBeVisible({ timeout: 3000 });

      // Select tomorrow using quick select
      await tomorrowButton.click();
      await page.waitForTimeout(300);

      // Calendar should close
      await expect(tomorrowButton).not.toBeVisible({ timeout: 2000 });

      // Form should still be visible
      await expect(jobForm).toBeVisible();
    } finally {
      // Cleanup
      await request.delete(`/api/ws/megatest/contacts/${contact.id}`);
    }
  });
});
