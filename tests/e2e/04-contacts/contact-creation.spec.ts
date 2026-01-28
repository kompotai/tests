/**
 * Contact Creation Tests
 *
 * Tests for creating contacts with various field combinations.
 * Uses fixtures from contacts.fixture.ts for test data.
 */

import { adminTest, expect } from '@fixtures/auth.fixture';
import { ContactsPage } from '@pages/ContactsPage';
import {
  // Factory functions
  createMinimalContact,
  createFullContact,
  createBusinessContact,
  createContact,
  createContactWithAddress,
  createCompleteContact,
  // Static fixtures
  CONTACT_WITH_EMAIL,
  CONTACT_WITH_PHONE,
  CONTACT_WITH_COMPANY,
  CONTACT_WITH_POSITION,
  CONTACT_WITH_NOTES,
  CONTACT_B2B_STYLE,
  CONTACT_MULTIPLE_EMAILS,
  CONTACT_MULTIPLE_PHONES,
  CONTACT_WITH_TELEGRAM,
  CONTACT_WITH_US_ADDRESS,
  CONTACT_WITH_RU_ADDRESS,
  CONTACT_UNICODE_NAME,
  CONTACT_SPECIAL_CHARS_NAME,
  CONTACT_WITH_NUMBERS,
  CONTACT_US_PHONE,
  CONTACT_RU_PHONE,
  CONTACT_UK_PHONE,
  US_ADDRESS,
  RU_ADDRESS,
  INVALID_EMPTY_NAME,
} from './contacts.fixture';

adminTest.describe('Contact Creation', () => {
  let contactsPage: ContactsPage;

  adminTest.beforeEach(async ({ page }) => {
    contactsPage = new ContactsPage(page);
    await contactsPage.goto();
  });

  // ============================================
  // Basic Creation Tests
  // ============================================

  adminTest.describe('Basic Creation', () => {
    adminTest('creates contact with name only (minimal)', async () => {
      const contact = createMinimalContact();

      await contactsPage.create(contact);

      await contactsPage.shouldSeeContact(contact.name);
    });

    adminTest('creates contact with all basic fields', async () => {
      const contact = createFullContact();

      await contactsPage.create(contact);

      await contactsPage.shouldSeeContact(contact.name);
    });

    adminTest('creates complete contact with all fields', async () => {
      const contact = createCompleteContact();

      await contactsPage.create(contact);

      await contactsPage.shouldSeeContact(contact.name);
    });
  });

  // ============================================
  // Single Field Variations
  // ============================================

  adminTest.describe('Single Field Variations', () => {
    adminTest('creates contact with email only', async () => {
      const contact = createContact({
        name: CONTACT_WITH_EMAIL.name,
        emails: CONTACT_WITH_EMAIL.emails,
      });

      await contactsPage.create(contact);

      await contactsPage.shouldSeeContact(contact.name);
    });

    adminTest('creates contact with phone only', async () => {
      const contact = createContact({
        name: CONTACT_WITH_PHONE.name,
        phones: CONTACT_WITH_PHONE.phones,
      });

      await contactsPage.create(contact);

      await contactsPage.shouldSeeContact(contact.name);
    });

    adminTest('creates contact with company only', async () => {
      const contact = createContact({
        name: CONTACT_WITH_COMPANY.name,
        company: CONTACT_WITH_COMPANY.company,
      });

      await contactsPage.create(contact);

      await contactsPage.shouldSeeContact(contact.name);
    });

    adminTest('creates contact with position only', async () => {
      const contact = createContact({
        name: CONTACT_WITH_POSITION.name,
        position: CONTACT_WITH_POSITION.position,
      });

      await contactsPage.create(contact);

      await contactsPage.shouldSeeContact(contact.name);
    });

    adminTest('creates contact with notes only', async () => {
      const contact = createContact({
        name: CONTACT_WITH_NOTES.name,
        notes: CONTACT_WITH_NOTES.notes,
      });

      await contactsPage.create(contact);

      await contactsPage.shouldSeeContact(contact.name);
    });

    adminTest('creates contact with telegram only', async () => {
      const contact = createContact({
        name: CONTACT_WITH_TELEGRAM.name,
        telegrams: CONTACT_WITH_TELEGRAM.telegrams,
      });

      await contactsPage.create(contact);

      await contactsPage.shouldSeeContact(contact.name);
    });
  });

  // ============================================
  // Business Style Contacts
  // ============================================

  adminTest.describe('Business Contacts', () => {
    adminTest('creates B2B style contact', async () => {
      const contact = createBusinessContact();

      await contactsPage.create(contact);

      await contactsPage.shouldSeeContact(contact.name);
    });

    adminTest('creates contact with company and position', async () => {
      const contact = createContact({
        name: CONTACT_B2B_STYLE.name,
        emails: CONTACT_B2B_STYLE.emails,
        company: CONTACT_B2B_STYLE.company,
        position: CONTACT_B2B_STYLE.position,
      });

      await contactsPage.create(contact);

      await contactsPage.shouldSeeContact(contact.name);
    });
  });

  // ============================================
  // Multiple Values Tests
  // ============================================

  adminTest.describe('Multiple Values', () => {
    adminTest('creates contact with multiple emails', async () => {
      const contact = createContact({
        name: CONTACT_MULTIPLE_EMAILS.name,
        emails: CONTACT_MULTIPLE_EMAILS.emails,
      });

      await contactsPage.create(contact);

      await contactsPage.shouldSeeContact(contact.name);
    });

    adminTest('creates contact with multiple phones', async () => {
      const contact = createContact({
        name: CONTACT_MULTIPLE_PHONES.name,
        phones: CONTACT_MULTIPLE_PHONES.phones,
      });

      await contactsPage.create(contact);

      await contactsPage.shouldSeeContact(contact.name);
    });
  });

  // ============================================
  // Address Tests
  // ============================================

  adminTest.describe('Address Handling', () => {
    adminTest('creates contact with US address', async () => {
      const contact = createContactWithAddress(US_ADDRESS);

      await contactsPage.create(contact);

      await contactsPage.shouldSeeContact(contact.name);
    });

    adminTest('creates contact with Russian address', async () => {
      const contact = createContactWithAddress(RU_ADDRESS);

      await contactsPage.create(contact);

      await contactsPage.shouldSeeContact(contact.name);
    });
  });

  // ============================================
  // Name Edge Cases
  // ============================================

  adminTest.describe('Name Edge Cases', () => {
    adminTest('creates contact with unicode name', async () => {
      const contact = createContact({ name: CONTACT_UNICODE_NAME.name });

      await contactsPage.create(contact);

      await contactsPage.shouldSeeContact(contact.name);
    });

    adminTest('creates contact with special characters', async () => {
      const contact = createContact({ name: CONTACT_SPECIAL_CHARS_NAME.name });

      await contactsPage.create(contact);

      await contactsPage.shouldSeeContact(contact.name);
    });

    adminTest('creates contact with numbers in name', async () => {
      const contact = createContact({ name: CONTACT_WITH_NUMBERS.name });

      await contactsPage.create(contact);

      await contactsPage.shouldSeeContact(contact.name);
    });
  });

  // ============================================
  // Phone Format Tests
  // ============================================

  adminTest.describe('Phone Formats', () => {
    adminTest('creates contact with US phone', async () => {
      const contact = createContact({
        name: CONTACT_US_PHONE.name,
        phones: CONTACT_US_PHONE.phones,
      });

      await contactsPage.create(contact);

      await contactsPage.shouldSeeContact(contact.name);
    });

    adminTest('creates contact with Russian phone', async () => {
      const contact = createContact({
        name: CONTACT_RU_PHONE.name,
        phones: CONTACT_RU_PHONE.phones,
      });

      await contactsPage.create(contact);

      await contactsPage.shouldSeeContact(contact.name);
    });

    adminTest('creates contact with UK phone', async () => {
      const contact = createContact({
        name: CONTACT_UK_PHONE.name,
        phones: CONTACT_UK_PHONE.phones,
      });

      await contactsPage.create(contact);

      await contactsPage.shouldSeeContact(contact.name);
    });
  });

  // ============================================
  // Validation Tests
  // ============================================

  adminTest.describe('Validation', () => {
    adminTest('shows error when name is empty', async ({ page }) => {
      await contactsPage.openCreateForm();

      // Try to submit without filling name
      await contactsPage.submitForm();

      // Form should still be visible (not submitted)
      const formVisible = await contactsPage.shouldSeeForm();
      expect(formVisible).toBe(true);
    });

    adminTest('form remains open after validation error', async ({ page }) => {
      await contactsPage.openCreateForm();

      // Fill with invalid data (empty name)
      await contactsPage.fillForm(INVALID_EMPTY_NAME);
      await contactsPage.submitForm();

      // Form should still be visible
      const formVisible = await contactsPage.shouldSeeForm();
      expect(formVisible).toBe(true);
    });
  });

  // ============================================
  // UI Behavior Tests
  // ============================================

  adminTest.describe('UI Behavior', () => {
    adminTest('opens create form when clicking create button', async ({ page }) => {
      await contactsPage.openCreateForm();

      const formVisible = await contactsPage.shouldSeeForm();
      expect(formVisible).toBe(true);
    });

    adminTest('form has empty name field initially', async ({ page }) => {
      await contactsPage.openCreateForm();

      const nameValue = await contactsPage.getFormNameValue();
      expect(nameValue).toBe('');
    });

    adminTest('can cancel contact creation', async ({ page }) => {
      await contactsPage.openCreateForm();

      // Click cancel button
      await page.locator('[data-testid="contact-form-button-cancel"]').click();

      // Wait for form to close - check that the contact form specifically is hidden
      await expect(page.locator('[data-testid="contact-form"]')).toBeHidden({ timeout: 5000 });
    });
  });
});
