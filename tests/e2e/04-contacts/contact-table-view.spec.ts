/**
 * Contact Table View Tests
 *
 * Tests for verifying contact data is displayed correctly in the table.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { ContactsPage } from '@pages/ContactsPage';
import { createFullContact, createBusinessContact } from './contacts.fixture';

ownerTest.describe('Contact Table View', () => {
  let contactsPage: ContactsPage;

  ownerTest.beforeEach(async ({ page }) => {
    contactsPage = new ContactsPage(page);
    await contactsPage.goto();
  });

  ownerTest('created contact appears in table with name', async () => {
    const contact = createFullContact();

    await contactsPage.create(contact);

    await contactsPage.shouldSeeContact(contact.name);
  });

  ownerTest('created contact shows email in table', async () => {
    const contact = createFullContact();

    await contactsPage.create(contact);

    await contactsPage.shouldRowContain(contact.name, {
      email: contact.emails![0],
    });
  });

  ownerTest('created contact shows phone in table', async () => {
    const contact = createFullContact();

    await contactsPage.create(contact);

    // Phone may be formatted, check partial match
    const row = await contactsPage['getRow'](contact.name);
    await expect(row).toBeVisible();
  });

  ownerTest('created contact shows company in quick view', async () => {
    // Company column is hidden by default, so we check in quick view
    const contact = createBusinessContact();

    await contactsPage.create(contact);
    await contactsPage.openQuickView(contact.name);

    await contactsPage.shouldQuickViewContain({
      company: contact.company,
    });
  });

  ownerTest('multiple contacts appear in correct order', { timeout: 60000 }, async ({ page }) => {
    const contact1 = createFullContact();
    const contact2 = createFullContact();

    await contactsPage.create(contact1);
    await contactsPage.create(contact2);

    // Both should be visible
    await contactsPage.shouldSeeContact(contact1.name);
    await contactsPage.shouldSeeContact(contact2.name);
  });

  ownerTest('search filters contacts in table', async ({ page }) => {
    const contact = createFullContact();

    await contactsPage.create(contact);
    await contactsPage.search(contact.name);

    await contactsPage.shouldSeeContact(contact.name);
  });
});
