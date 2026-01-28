/**
 * Contact Edit Tests
 *
 * Tests for editing contacts from:
 * - Table (pencil icon)
 * - Quick view panel (edit button)
 * - Full page view (edit button)
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { ContactsPage } from '@pages/ContactsPage';
import { createFullContact, uniqueName, uniqueEmail } from './contacts.fixture';

ownerTest.describe('Contact Edit', () => {
  let contactsPage: ContactsPage;

  ownerTest.beforeEach(async ({ page }) => {
    contactsPage = new ContactsPage(page);
    await contactsPage.goto();
  });

  // ============================================
  // Edit from Table
  // ============================================

  ownerTest.describe('Edit from Table', () => {
    ownerTest('can open edit form from table', async ({ page }) => {
      const contact = createFullContact();
      await contactsPage.create(contact);

      await contactsPage.clickRowEdit(contact.name);

      const formVisible = await contactsPage.shouldSeeForm();
      expect(formVisible).toBe(true);
    });

    ownerTest('can edit contact name from table', async ({ page }) => {
      const contact = createFullContact();
      await contactsPage.create(contact);

      const newName = uniqueName('Edited');
      await contactsPage.edit(contact.name, { name: newName });

      await contactsPage.shouldSeeContact(newName);
      await contactsPage.shouldNotSeeContact(contact.name);
    });

    ownerTest('edited contact persists after page refresh', async ({ page }) => {
      const contact = createFullContact();
      await contactsPage.create(contact);

      const newName = uniqueName('Persisted');
      await contactsPage.edit(contact.name, { name: newName });

      await contactsPage.goto(); // Refresh

      await contactsPage.shouldSeeContact(newName);
    });
  });

  // ============================================
  // Edit from Quick View
  // ============================================

  ownerTest.describe('Edit from Quick View', () => {
    ownerTest('can open edit form from quick view', async ({ page }) => {
      const contact = createFullContact();
      await contactsPage.create(contact);

      await contactsPage.openQuickView(contact.name);

      // Find and click edit button in quick view panel
      const panel = page.locator('[class*="fixed"][class*="right-0"]').first();
      const editBtn = panel.locator('button:has(svg.lucide-pencil)').first();
      await editBtn.click();
      await contactsPage.wait(500);

      const formVisible = await contactsPage.shouldSeeForm();
      expect(formVisible).toBe(true);
    });

    ownerTest('can edit contact from quick view', async ({ page }) => {
      const contact = createFullContact();
      await contactsPage.create(contact);

      await contactsPage.openQuickView(contact.name);

      // Click edit in quick view
      const panel = page.locator('[class*="fixed"][class*="right-0"]').first();
      const editBtn = panel.locator('button:has(svg.lucide-pencil)').first();
      await editBtn.click();
      await contactsPage.wait(500);

      // Edit name
      const newName = uniqueName('QuickViewEdit');
      const nameInput = page.locator('[data-testid="contact-form-input-name"], input[name="name"]').first();
      await nameInput.clear();
      await nameInput.fill(newName);

      await contactsPage.submitForm();
      await contactsPage.closeQuickView();

      await contactsPage.shouldSeeContact(newName);
    });
  });

  // ============================================
  // Edit from Full Page View
  // ============================================

  ownerTest.describe('Edit from Full Page', () => {
    ownerTest('can open edit form from full page', async ({ page }) => {
      const contact = createFullContact();
      await contactsPage.create(contact);

      await contactsPage.openFullPageView(contact.name);
      await contactsPage.clickDetailEdit();

      const formVisible = await contactsPage.shouldSeeForm();
      expect(formVisible).toBe(true);
    });

    ownerTest('can edit contact from full page', async ({ page }) => {
      const contact = createFullContact();
      await contactsPage.create(contact);

      await contactsPage.openFullPageView(contact.name);
      await contactsPage.clickDetailEdit();

      // Edit name
      const newName = uniqueName('FullPageEdit');
      const nameInput = page.locator('[data-testid="contact-form-input-name"], input[name="name"]').first();
      await nameInput.clear();
      await nameInput.fill(newName);

      await contactsPage.submitForm();

      // Verify on full page
      await contactsPage.shouldDetailPageContain({ name: newName });
    });

    ownerTest('can edit email from full page', async ({ page }) => {
      const contact = createFullContact();
      await contactsPage.create(contact);

      await contactsPage.openFullPageView(contact.name);
      await contactsPage.clickDetailEdit();

      // Edit email
      const newEmail = uniqueEmail('fullpage');
      const emailInput = page.locator('[data-testid="contact-form-input-email-0"], input[name="emails.0.address"]').first();
      await emailInput.clear();
      await emailInput.fill(newEmail);

      await contactsPage.submitForm();

      // Verify on full page
      await contactsPage.shouldDetailPageContain({ email: newEmail });
    });
  });

  // ============================================
  // Edit Field Combinations
  // ============================================

  ownerTest.describe('Edit Various Fields', () => {
    ownerTest('can edit company field', async ({ page }) => {
      const contact = createFullContact();
      await contactsPage.create(contact);

      await contactsPage.clickRowEdit(contact.name);

      const newCompany = 'New Company Name';
      const companyInput = page.locator('[data-testid="contact-form-input-company"], input[name="company"]').first();
      await companyInput.clear();
      await companyInput.fill(newCompany);

      await contactsPage.submitForm();

      // Company column is hidden by default, check in detail view
      await contactsPage.openFullPageView(contact.name);
      await expect(page.getByText(newCompany).first()).toBeVisible();
    });

    ownerTest('can edit position field', async ({ page }) => {
      const contact = createFullContact();
      await contactsPage.create(contact);

      await contactsPage.clickRowEdit(contact.name);

      const newPosition = 'New Position';
      const positionInput = page.locator('[data-testid="contact-form-input-position"], input[name="position"]').first();
      await positionInput.clear();
      await positionInput.fill(newPosition);

      await contactsPage.submitForm();

      // Position might not be visible in table, check in detail view
      await contactsPage.openFullPageView(contact.name);
      await expect(page.getByText(newPosition).first()).toBeVisible();
    });

    ownerTest('can edit notes field', async ({ page }) => {
      const contact = createFullContact();
      await contactsPage.create(contact);

      await contactsPage.clickRowEdit(contact.name);

      const newNotes = 'Updated notes content';
      const notesInput = page.locator('[data-testid="contact-form-input-notes"], textarea[name="notes"]').first();
      await notesInput.clear();
      await notesInput.fill(newNotes);

      await contactsPage.submitForm();

      // Notes might not be visible in table, check in detail view
      await contactsPage.openFullPageView(contact.name);
      await expect(page.getByText(newNotes).first()).toBeVisible();
    });

    ownerTest('can cancel edit without saving', async ({ page }) => {
      const contact = createFullContact();
      await contactsPage.create(contact);

      await contactsPage.clickRowEdit(contact.name);

      // Change name but cancel
      const newName = uniqueName('Cancelled');
      const nameInput = page.locator('[data-testid="contact-form-input-name"], input[name="name"]').first();
      await nameInput.clear();
      await nameInput.fill(newName);

      // Click cancel
      await page.locator('[data-testid="contact-form-button-cancel"]').click();
      await contactsPage.wait(500);

      // Original name should still be there
      await contactsPage.shouldSeeContact(contact.name);
      await contactsPage.shouldNotSeeContact(newName);
    });
  });
});
