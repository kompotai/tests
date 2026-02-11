/**
 * General Settings Tests
 *
 * Settings → General
 *
 * TC-1: Page displays workspace info (read-only)
 * TC-2: Change currency and verify preview
 * TC-3: Change short date preset and verify preview
 * TC-4: Change long date preset and verify preview
 * TC-5: Custom short date pattern updates preview
 * TC-6: Change timezone and save
 * TC-7: Settings persist after page reload
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { GeneralSettingsPage } from '@pages/GeneralSettingsPage';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('General Settings', () => {
  let settingsPage: GeneralSettingsPage;

  ownerTest.beforeEach(async ({ page }) => {
    settingsPage = new GeneralSettingsPage(page);
    await settingsPage.goto();
  });

  ownerTest('TC-1: displays workspace info', async ({ page }) => {
    // Workspace name and ID should be visible
    await settingsPage.shouldSeeText('Gal Company');
    await settingsPage.shouldSeeText(WORKSPACE_ID);

    // Statistics section should be visible
    await settingsPage.shouldSeeText('Statistics');
    await settingsPage.shouldSeeText('Database Size');

    // Current user info
    await settingsPage.shouldSeeText('Current User');
    await settingsPage.shouldSeeText('Natalya Galyamova');
  });

  ownerTest('TC-2: changes currency and verifies preview', async () => {
    const originalCurrency = await settingsPage.getCurrency();

    // Change to EUR
    const newCurrency = originalCurrency === 'EUR' ? 'GBP' : 'EUR';
    await settingsPage.setCurrency(newCurrency);

    // Preview should update — wait for the new symbol to appear
    const expectedSymbol = newCurrency === 'EUR' ? '€' : '£';
    const preview = await settingsPage.getCurrencyPreviewText();
    expect(preview).toContain(expectedSymbol);

    // Save
    await settingsPage.save();

    // Restore original
    await settingsPage.setCurrency(originalCurrency);
    await settingsPage.save();
  });

  ownerTest('TC-3: changes short date preset and verifies preview', async () => {
    const originalPreset = await settingsPage.getShortPreset();

    // Change to US format
    await settingsPage.setShortPreset('MM/DD/YY h:mm A');
    const preview = await settingsPage.getShortPreview();
    // US format shows MM/DD/YY with AM/PM
    expect(preview).toMatch(/\d{2}\/\d{2}\/\d{2}\s+\d{1,2}:\d{2}\s+(AM|PM)/);

    // Save
    await settingsPage.save();

    // Restore
    await settingsPage.setShortPreset(originalPreset);
    await settingsPage.save();
  });

  ownerTest('TC-4: changes long date preset and verifies preview', async () => {
    const originalPreset = await settingsPage.getLongPreset();

    // Change to abbreviated format "31 Dec 2025, 14:30"
    await settingsPage.setLongPreset('DD MMM YYYY, HH:mm');
    const preview = await settingsPage.getLongPreview();
    // Should show abbreviated month
    expect(preview).toMatch(/\d{2}\s+\w{3}\s+\d{4},\s+\d{2}:\d{2}/);

    // Save
    await settingsPage.save();

    // Restore
    await settingsPage.setLongPreset(originalPreset);
    await settingsPage.save();
  });

  ownerTest('TC-5: custom short date pattern updates preview', async () => {
    const originalPattern = await settingsPage.getShortPattern();

    // Set custom pattern
    await settingsPage.setShortPattern('YYYY-MM-DD HH:mm');
    const preview = await settingsPage.getShortPreview();
    // Should show YYYY-MM-DD format
    expect(preview).toMatch(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/);

    // Save
    await settingsPage.save();

    // Restore
    await settingsPage.setShortPattern(originalPattern);
    await settingsPage.save();
  });

  ownerTest('TC-6: changes timezone and saves', async () => {
    const originalTz = await settingsPage.getTimezone();

    // Change timezone
    const newTz = originalTz === 'Europe/Moscow' ? 'Europe/London' : 'Europe/Moscow';
    await settingsPage.setTimezone(newTz);
    await settingsPage.save();

    // Verify saved
    const savedTz = await settingsPage.getTimezone();
    expect(savedTz).toBe(newTz);

    // Restore
    await settingsPage.setTimezone(originalTz);
    await settingsPage.save();
  });

  ownerTest('TC-7: settings persist after page reload', async ({ page }) => {
    const originalCurrency = await settingsPage.getCurrency();
    const newCurrency = originalCurrency === 'EUR' ? 'GBP' : 'EUR';

    // Change currency and save
    await settingsPage.setCurrency(newCurrency);
    await settingsPage.save();

    // Reload page
    await page.reload();
    await settingsPage.waitForPageLoad();

    // Verify currency persisted
    const savedCurrency = await settingsPage.getCurrency();
    expect(savedCurrency).toBe(newCurrency);

    // Restore
    await settingsPage.setCurrency(originalCurrency);
    await settingsPage.save();
  });
});
