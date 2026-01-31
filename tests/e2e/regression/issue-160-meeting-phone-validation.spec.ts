/**
 * Regression test for Issue #160
 * Phone number field should validate input and reject invalid characters
 *
 * Bug: Phone number field in meeting form accepted letters and other invalid characters
 * Fix: Added regex validation to only allow digits, +, spaces, hyphens, and parentheses
 *
 * @see https://github.com/kompotai/bug-reports/issues/160
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #160: Meeting Phone Validation', { tag: ['@regression'] }, () => {
  ownerTest('phone field rejects invalid characters @regression', async ({ page, request }) => {
    // First create a contact for the meeting
    const contactResponse = await request.post('/api/ws/megatest/contacts', {
      data: { name: `Test Contact #160 - ${Date.now()}` },
    });
    expect(contactResponse.status()).toBe(201);
    const contact = await contactResponse.json();

    try {
      // Navigate to meetings page
      await page.goto(`/ws/${WORKSPACE_ID}/meetings`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000); // Wait for data to load

      // Handle cookie consent if present
      const acceptCookies = page.getByRole('button', { name: 'Accept All' });
      if (await acceptCookies.isVisible({ timeout: 1000 }).catch(() => false)) {
        await acceptCookies.click();
        await page.waitForTimeout(300);
      }

      // Click create meeting button (translated text)
      const createButton = page.getByRole('button', { name: /Create meeting|Создать встречу/i });
      await expect(createButton).toBeVisible({ timeout: 10000 });
      await createButton.click();

      // Wait for form to appear in SlideOver
      await page.waitForSelector('form', { timeout: 5000 });

      // Fill title
      await page.fill('#meeting-title', 'Test Meeting #160');

      // Select contact - use the EntitySelect component
      const contactSelect = page.locator('#meeting-contactId').locator('..');
      await contactSelect.click();
      await page.keyboard.type(contact.name.slice(0, 10));
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');

      // Select phone format - click the format ColorSelect and choose Phone
      const formatSelect = page.locator('#meeting-format').locator('..');
      await formatSelect.click();
      // Wait for dropdown and click Phone option
      await page.getByRole('option', { name: /Phone|Телефон/i }).click();

      // Wait for phone fields section to appear
      await page.waitForSelector('#meeting-phoneNumber', { timeout: 5000 });

      // Enter invalid phone number with letters
      await page.fill('#meeting-phoneNumber', '111111111111fff');

      // Click submit button
      const submitButton = page.getByRole('button', { name: /Create meeting|Создать встречу/i }).last();
      await submitButton.click();

      // Should show validation error for phone (handle both EN and RU)
      const errorMessage = page.locator('text=/Phone number can only contain|Номер телефона может содержать только/');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    } finally {
      // Cleanup
      await request.delete(`/api/ws/megatest/contacts/${contact.id}`);
    }
  });

  ownerTest('phone field accepts valid phone number @regression', async ({ page, request }) => {
    // First create a contact for the meeting
    const contactResponse = await request.post('/api/ws/megatest/contacts', {
      data: { name: `Test Contact #160 valid - ${Date.now()}` },
    });
    expect(contactResponse.status()).toBe(201);
    const contact = await contactResponse.json();

    try {
      // Navigate to meetings page
      await page.goto(`/ws/${WORKSPACE_ID}/meetings`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000); // Wait for data to load

      // Handle cookie consent if present
      const acceptCookies = page.getByRole('button', { name: 'Accept All' });
      if (await acceptCookies.isVisible({ timeout: 1000 }).catch(() => false)) {
        await acceptCookies.click();
        await page.waitForTimeout(300);
      }

      // Click create meeting button
      const createButton = page.getByRole('button', { name: /Create meeting|Создать встречу/i });
      await expect(createButton).toBeVisible({ timeout: 10000 });
      await createButton.click();

      // Wait for form
      await page.waitForSelector('form', { timeout: 5000 });

      // Select phone format
      const formatSelect = page.locator('#meeting-format').locator('..');
      await formatSelect.click();
      await page.getByRole('option', { name: /Phone|Телефон/i }).click();

      // Wait for phone field
      await page.waitForSelector('#meeting-phoneNumber', { timeout: 5000 });

      // Enter valid phone number
      const phoneInput = page.locator('#meeting-phoneNumber');
      await phoneInput.fill('+1 (555) 123-4567');

      // The input should accept this value without error
      await expect(phoneInput).toHaveValue('+1 (555) 123-4567');
    } finally {
      // Cleanup
      await request.delete(`/api/ws/megatest/contacts/${contact.id}`);
    }
  });
});
