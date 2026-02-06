/**
 * Contact Views Tests
 *
 * Tests for two view modes:
 * - Quick view (side panel) - click on contact name
 * - Full page view - click on eye icon
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { ContactsPage } from '@pages/ContactsPage';
import { createFullContact, createBusinessContact } from './contacts.fixture';

ownerTest.describe('Contact Views', () => {
  let contactsPage: ContactsPage;

  ownerTest.beforeEach(async ({ page }) => {
    contactsPage = new ContactsPage(page);
    await contactsPage.goto();
  });

  // ============================================
  // Quick View (Side Panel)
  // ============================================

  ownerTest.describe('Quick View Panel', () => {
    ownerTest('opens quick view when clicking contact name', async ({ page }) => {
      const contact = createFullContact();
      await contactsPage.create(contact);

      await contactsPage.openQuickView(contact.name);

      const isVisible = await contactsPage.isQuickViewVisible();
      expect(isVisible).toBe(true);
    });

    ownerTest('quick view shows contact name', async ({ page }) => {
      const contact = createFullContact();
      await contactsPage.create(contact);

      await contactsPage.openQuickView(contact.name);

      await contactsPage.shouldQuickViewContain({ name: contact.name });
    });

    ownerTest('quick view shows contact email', async ({ page }) => {
      const contact = createFullContact();
      await contactsPage.create(contact);

      await contactsPage.openQuickView(contact.name);

      await contactsPage.shouldQuickViewContain({ email: contact.emails![0] });
    });

    ownerTest('quick view shows company info', async ({ page }) => {
      const contact = createBusinessContact();
      await contactsPage.create(contact);

      await contactsPage.openQuickView(contact.name);

      await contactsPage.shouldQuickViewContain({ company: contact.company });
    });

    ownerTest('quick view closes on Escape', async ({ page }) => {
      const contact = createFullContact();
      await contactsPage.create(contact);

      await contactsPage.openQuickView(contact.name);
      expect(await contactsPage.isQuickViewVisible()).toBe(true);

      await contactsPage.closeQuickView();

      expect(await contactsPage.isQuickViewVisible()).toBe(false);
    });
  });

  // ============================================
  // Full Page View
  // ============================================

  ownerTest.describe('Full Page View', () => {
    ownerTest('opens full page view when clicking eye icon', async ({ page }) => {
      const contact = createFullContact();
      await contactsPage.create(contact);

      await contactsPage.openFullPageView(contact.name);

      expect(page.url()).toContain('/contacts/');
    });

    ownerTest('full page shows contact name', async ({ page }) => {
      const contact = createFullContact();
      await contactsPage.create(contact);

      await contactsPage.openFullPageView(contact.name);

      await contactsPage.shouldDetailPageContain({ name: contact.name });
    });

    ownerTest('full page shows contact email', async ({ page }) => {
      const contact = createFullContact();
      await contactsPage.create(contact);

      await contactsPage.openFullPageView(contact.name);

      await contactsPage.shouldDetailPageContain({ email: contact.emails![0] });
    });

    ownerTest('full page shows company info', async ({ page }) => {
      const contact = createBusinessContact();
      await contactsPage.create(contact);

      await contactsPage.openFullPageView(contact.name);

      await contactsPage.shouldDetailPageContain({ company: contact.company });
    });
  });
});
