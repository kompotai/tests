/**
 * Opportunity Edit Tests
 *
 * Tests for editing opportunities from table and view page.
 * Covers: O4 - Edit opportunity functionality
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { OpportunitiesPage } from '@pages/OpportunitiesPage';
import {
  createFullOpportunity,
  uniqueOpportunityName,
  uniqueAmount,
  TEST_CONTACTS,
} from './opportunities.fixture';

ownerTest.describe('Opportunity Edit', () => {
  let opportunitiesPage: OpportunitiesPage;

  ownerTest.beforeEach(async ({ page }) => {
    opportunitiesPage = new OpportunitiesPage(page);
    await opportunitiesPage.goto();
  });

  ownerTest.describe('Edit from Table', () => {
    ownerTest('should open edit form when clicking row edit button', async ({ page }) => {
      // Arrange: Create opportunity
      const opportunity = createFullOpportunity();
      await opportunitiesPage.create(opportunity);

      // Act: Click edit button
      await opportunitiesPage.clickRowEdit(opportunity.name);

      // Assert: Form should be visible
      const formVisible = await opportunitiesPage.shouldSeeForm();
      ownerTest.expect(formVisible).toBe(true);
    });

    ownerTest('should edit opportunity name', async ({ page }) => {
      // Arrange: Create opportunity
      const opportunity = createFullOpportunity();
      await opportunitiesPage.create(opportunity);

      // Act: Edit name
      const newName = uniqueOpportunityName('Edited Name');
      await opportunitiesPage.edit(opportunity.name, { name: newName });

      // Assert: New name should be visible, old name should not
      await opportunitiesPage.shouldSeeOpportunity(newName);
      await opportunitiesPage.shouldNotSeeOpportunity(opportunity.name);
    });

    ownerTest('should edit opportunity amount', async ({ page }) => {
      // Arrange: Create opportunity
      const opportunity = createFullOpportunity();
      await opportunitiesPage.create(opportunity);

      // Act: Edit amount
      const newAmount = uniqueAmount();
      await opportunitiesPage.edit(opportunity.name, { amount: newAmount });

      // Assert: New amount should be visible in row
      await opportunitiesPage.shouldRowContain(opportunity.name, { amount: newAmount });
    });

    ownerTest('should edit opportunity contact', async ({ page }) => {
      // Arrange: Create opportunity
      const opportunity = createFullOpportunity();
      await opportunitiesPage.create(opportunity);

      // Act: Edit contact
      const newContact = TEST_CONTACTS.CONTACT_2;
      await opportunitiesPage.edit(opportunity.name, { contactName: newContact });

      // Assert: New contact should be visible in row
      await opportunitiesPage.shouldRowContain(opportunity.name, { contactName: newContact });
    });

    ownerTest('should persist edits after page refresh', async ({ page }) => {
      // Arrange: Create and edit opportunity
      const opportunity = createFullOpportunity();
      await opportunitiesPage.create(opportunity);
      const newName = uniqueOpportunityName('Persisted Edit');
      await opportunitiesPage.edit(opportunity.name, { name: newName });

      // Act: Refresh page
      await page.reload();
      await opportunitiesPage.waitForPageLoad();

      // Assert: Edited name should still be visible
      await opportunitiesPage.shouldSeeOpportunity(newName);
      await opportunitiesPage.shouldNotSeeOpportunity(opportunity.name);
    });
  });

  ownerTest.describe('Edit Multiple Fields', () => {
    ownerTest('should edit name and amount together', async ({ page }) => {
      // Arrange: Create opportunity
      const opportunity = createFullOpportunity();
      await opportunitiesPage.create(opportunity);

      // Act: Edit multiple fields
      const newName = uniqueOpportunityName('Multi Edit');
      const newAmount = uniqueAmount();
      await opportunitiesPage.edit(opportunity.name, {
        name: newName,
        amount: newAmount,
      });

      // Assert: Both changes should be visible
      await opportunitiesPage.shouldSeeOpportunity(newName);
      await opportunitiesPage.shouldRowContain(newName, { amount: newAmount });
    });

    ownerTest('should edit all fields together', async ({ page }) => {
      // Arrange: Create opportunity
      const opportunity = createFullOpportunity();
      await opportunitiesPage.create(opportunity);

      // Act: Edit all fields
      const newName = uniqueOpportunityName('Complete Edit');
      const newAmount = uniqueAmount();
      const newContact = TEST_CONTACTS.CONTACT_3;
      await opportunitiesPage.edit(opportunity.name, {
        name: newName,
        amount: newAmount,
        contactName: newContact,
      });

      // Assert: All changes should be visible
      await opportunitiesPage.shouldSeeOpportunity(newName);
      await opportunitiesPage.shouldRowContain(newName, {
        amount: newAmount,
        contactName: newContact,
      });
    });
  });

  ownerTest.describe('Edit Cancel', () => {
    ownerTest('should not save changes when canceling edit', async ({ page }) => {
      // Arrange: Create opportunity
      const opportunity = createFullOpportunity();
      await opportunitiesPage.create(opportunity);
      const originalName = opportunity.name;

      // Act: Open edit form, change name, but cancel
      await opportunitiesPage.clickRowEdit(originalName);
      await opportunitiesPage.page.locator('[data-testid="opportunity-form-input-name"]').fill('Should Not Save');
      await opportunitiesPage.cancelForm();

      // Assert: Original name should still be visible
      await opportunitiesPage.shouldSeeOpportunity(originalName);
      await opportunitiesPage.shouldNotSeeOpportunity('Should Not Save');
    });

    ownerTest('should retain original data after cancel', async ({ page }) => {
      // Arrange: Create opportunity
      const opportunity = createFullOpportunity();
      await opportunitiesPage.create(opportunity);

      // Act: Open edit, cancel without changes
      await opportunitiesPage.clickRowEdit(opportunity.name);
      await opportunitiesPage.cancelForm();

      // Assert: Original opportunity should still be visible
      await opportunitiesPage.shouldSeeOpportunity(opportunity.name);
      await opportunitiesPage.shouldRowContain(opportunity.name, {
        amount: opportunity.amount,
        contactName: opportunity.contactName,
      });
    });
  });
});
