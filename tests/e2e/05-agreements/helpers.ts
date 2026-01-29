import { Page } from '@playwright/test';
import { ContactsPage } from '@pages/ContactsPage';

/**
 * Creates test contacts for agreement tests
 * Returns an object with created contact names
 */
export async function createTestContacts(page: Page) {
  const contactsPage = new ContactsPage(page);
  await contactsPage.goto();

  const timestamp = Date.now();

  // Create Carol Lopez
  const contact1Name = `Carol Lopez ${timestamp}`;
  await contactsPage.create({
    name: contact1Name,
    email: `carol.lopez.${timestamp}@test.com`,
  });

  // Create Thomas Walker
  const contact2Name = `Thomas Walker ${timestamp}`;
  await contactsPage.create({
    name: contact2Name,
    email: `thomas.walker.${timestamp}@test.com`,
  });

  // Create Nancy Moore
  const contact3Name = `Nancy Moore ${timestamp}`;
  await contactsPage.create({
    name: contact3Name,
    email: `nancy.moore.${timestamp}@test.com`,
  });

  return {
    contact1: contact1Name,
    contact2: contact2Name,
    contact3: contact3Name,
  };
}

/**
 * Deletes test contacts created for agreement tests
 */
export async function cleanupTestContacts(
  page: Page,
  contactNames: string[]
) {
  const contactsPage = new ContactsPage(page);
  await contactsPage.goto();

  for (const name of contactNames) {
    try {
      await contactsPage.delete(name);
    } catch (error) {
      console.warn(`Failed to delete contact ${name}:`, error);
    }
  }
}