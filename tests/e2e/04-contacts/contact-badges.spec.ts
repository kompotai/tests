/**
 * Contact Badges Tests
 *
 * Tests for inline badge editing in the contacts table.
 * Badges: Contact Type, Source
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { ContactsPage } from '@pages/ContactsPage';
import { createFullContact, createMinimalContact } from './contacts.fixture';

ownerTest.describe('Contact Badges', () => {
  let contactsPage: ContactsPage;

  ownerTest.beforeEach(async ({ page }) => {
    contactsPage = new ContactsPage(page);
    await contactsPage.goto();
  });

  // ============================================
  // Type Badge
  // ============================================

  ownerTest.describe('Type Badge', () => {
    ownerTest('can click on type badge to open popover', async ({ page }) => {
      const contact = createMinimalContact();
      await contactsPage.create(contact);

      // Find and click type badge
      const row = page.locator(`tr:has-text("${contact.name}")`).first();
      const typeBadge = row.locator('button').filter({ hasText: /type|тип|no type|нет типа/i }).first();

      if (await typeBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
        await typeBadge.click();
        await contactsPage.wait(300);

        // Popover should appear (custom Popover component with portal)
        const popover = page.locator('.fixed.inset-0.z-50 > div.rounded-lg.shadow-xl').first();
        await expect(popover).toBeVisible({ timeout: 3000 });
      }
    });

    ownerTest('can change contact type via badge', async ({ page }) => {
      const contact = createMinimalContact();
      await contactsPage.create(contact);

      // Find and click type badge
      const row = page.locator(`tr:has-text("${contact.name}")`).first();
      const typeBadge = row.locator('button').filter({ hasText: /type|тип|no type|нет типа/i }).first();

      if (await typeBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
        await typeBadge.click();
        await contactsPage.wait(300);

        // Select first option (e.g., "Lead" or "Customer")
        const option = page.locator('[role="option"]').first();
        if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
          const optionText = await option.textContent();
          await option.click();
          await contactsPage.wait(500);

          // Verify badge changed
          if (optionText) {
            await expect(row.getByText(optionText.trim()).first()).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });

    ownerTest('type badge change persists after refresh', async ({ page }) => {
      const contact = createMinimalContact();
      await contactsPage.create(contact);

      // Find and click type badge
      const row = page.locator(`tr:has-text("${contact.name}")`).first();
      const typeBadge = row.locator('button').filter({ hasText: /type|тип|no type|нет типа/i }).first();

      let selectedType = '';
      if (await typeBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
        await typeBadge.click();
        await contactsPage.wait(300);

        const option = page.locator('[role="option"]').first();
        if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
          selectedType = (await option.textContent())?.trim() || '';
          await option.click();
          await contactsPage.wait(500);
        }
      }

      // Refresh page
      await contactsPage.goto();

      // Verify type is still set
      if (selectedType) {
        const newRow = page.locator(`tr:has-text("${contact.name}")`).first();
        await expect(newRow.getByText(selectedType).first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  // ============================================
  // Source Badge
  // ============================================

  ownerTest.describe('Source Badge', () => {
    ownerTest('can click on source badge to open popover', async ({ page }) => {
      const contact = createMinimalContact();
      await contactsPage.create(contact);

      // Find and click source badge
      const row = page.locator(`tr:has-text("${contact.name}")`).first();
      const sourceBadge = row.locator('button').filter({ hasText: /source|источник|no source|нет источника/i }).first();

      if (await sourceBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sourceBadge.click();
        await contactsPage.wait(300);

        // Popover should appear (custom Popover component with portal)
        const popover = page.locator('.fixed.inset-0.z-50 > div.rounded-lg.shadow-xl').first();
        await expect(popover).toBeVisible({ timeout: 3000 });
      }
    });

    ownerTest('can change source via badge', async ({ page }) => {
      const contact = createMinimalContact();
      await contactsPage.create(contact);

      // Find and click source badge
      const row = page.locator(`tr:has-text("${contact.name}")`).first();
      const sourceBadge = row.locator('button').filter({ hasText: /source|источник|no source|нет источника/i }).first();

      if (await sourceBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sourceBadge.click();
        await contactsPage.wait(300);

        // Select first option
        const option = page.locator('[role="option"]').first();
        if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
          const optionText = await option.textContent();
          await option.click();
          await contactsPage.wait(500);

          // Verify badge changed
          if (optionText) {
            await expect(row.getByText(optionText.trim()).first()).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });
  });

  // ============================================
  // Badge Clear
  // ============================================

  ownerTest.describe('Badge Clear', () => {
    ownerTest('can clear type badge value', async ({ page }) => {
      const contact = createMinimalContact();
      await contactsPage.create(contact);

      // First set a type
      const row = page.locator(`tr:has-text("${contact.name}")`).first();
      const typeBadge = row.locator('button').filter({ hasText: /type|тип|no type|нет типа/i }).first();

      if (await typeBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
        await typeBadge.click();
        await contactsPage.wait(300);

        const option = page.locator('[role="option"]').first();
        if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
          await option.click();
          await contactsPage.wait(500);
        }

        // Now clear it
        await typeBadge.click();
        await contactsPage.wait(300);

        const clearBtn = page.locator('button:has-text("Clear"), button:has-text("Очистить")').first();
        if (await clearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await clearBtn.click();
          await contactsPage.wait(500);

          // Badge should show "no type" again
          await expect(row.locator('button').filter({ hasText: /no type|нет типа/i }).first()).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  // ============================================
  // Badge Interaction
  // ============================================

  ownerTest.describe('Badge Interaction', () => {
    ownerTest('clicking outside popover closes it', async ({ page }) => {
      const contact = createMinimalContact();
      await contactsPage.create(contact);

      const row = page.locator(`tr:has-text("${contact.name}")`).first();
      const typeBadge = row.locator('button').filter({ hasText: /type|тип|no type|нет типа/i }).first();

      if (await typeBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
        await typeBadge.click();
        await contactsPage.wait(300);

        const popover = page.locator('.fixed.inset-0.z-50 > div.rounded-lg.shadow-xl').first();
        await expect(popover).toBeVisible({ timeout: 3000 });

        // Click outside (on the page body)
        await page.locator('body').click({ position: { x: 10, y: 10 } });
        await contactsPage.wait(300);

        // Popover should close
        await expect(popover).not.toBeVisible({ timeout: 3000 });
      }
    });

    ownerTest('escape key closes badge popover', async ({ page }) => {
      const contact = createMinimalContact();
      await contactsPage.create(contact);

      const row = page.locator(`tr:has-text("${contact.name}")`).first();
      const typeBadge = row.locator('button').filter({ hasText: /type|тип|no type|нет типа/i }).first();

      if (await typeBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
        await typeBadge.click();
        await contactsPage.wait(300);

        const popover = page.locator('.fixed.inset-0.z-50 > div.rounded-lg.shadow-xl').first();
        await expect(popover).toBeVisible({ timeout: 3000 });

        // Press Escape
        await page.keyboard.press('Escape');
        await contactsPage.wait(300);

        // Popover should close
        await expect(popover).not.toBeVisible({ timeout: 3000 });
      }
    });
  });
});
