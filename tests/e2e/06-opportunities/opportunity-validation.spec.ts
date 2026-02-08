/**
 * Opportunity Form Validation Tests
 *
 * Tests for form validation rules and edge cases.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { OpportunitiesPage } from '@pages/OpportunitiesPage';
import {
  uniqueOpportunityName,
  INVALID_EMPTY_NAME,
  INVALID_NEGATIVE_AMOUNT,
  VALID_LARGE_AMOUNT,
  TEST_CONTACTS,
} from './opportunities.fixture';

ownerTest.describe('Opportunity Form Validation', () => {
  let opportunitiesPage: OpportunitiesPage;

  ownerTest.beforeEach(async ({ page }) => {
    opportunitiesPage = new OpportunitiesPage(page);
    await opportunitiesPage.goto();
  });

  ownerTest.describe('Required Fields', () => {
    ownerTest('should not create opportunity without name', async ({ page }) => {
      // Arrange: Open form
      await opportunitiesPage.openCreateForm();

      // Act: Try to create without name (only select contact)
      await opportunitiesPage.selectContact(TEST_CONTACTS.CONTACT_1);
      await opportunitiesPage.clickSubmitButton();

      // Assert: Form should still be visible (not submitted)
      const formVisible = await opportunitiesPage.shouldSeeForm();
      ownerTest.expect(formVisible).toBe(true);
    });

    ownerTest('should not create opportunity without contact', async ({ page }) => {
      // Arrange: Open form
      await opportunitiesPage.openCreateForm();

      // Act: Try to create without contact (only fill name)
      await opportunitiesPage.page.locator('[data-testid="opportunity-form-input-name"]').fill(
        uniqueOpportunityName('No Contact')
      );
      await opportunitiesPage.clickSubmitButton();

      // Assert: Form should still be visible (not submitted)
      const formVisible = await opportunitiesPage.shouldSeeForm();
      ownerTest.expect(formVisible).toBe(true);
    });

    ownerTest.skip('should show validation error for empty name', async ({ page }) => {
      // NOTE: Skipped - requires UI to show validation error messages
      // To enable: check if error message selector exists

      // Arrange: Open form
      await opportunitiesPage.openCreateForm();

      // Act: Submit with empty name
      await opportunitiesPage.selectContact(TEST_CONTACTS.CONTACT_1);
      await opportunitiesPage.page.locator('[data-testid="opportunity-form-button-submit"]').click();

      // Assert: Error message should be visible
      const errorVisible = await opportunitiesPage.page
        .locator('[data-testid="error-name"], [data-testid="form-error"]')
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      ownerTest.expect(errorVisible).toBe(true);
    });

    ownerTest('should keep form open on validation error', async ({ page }) => {
      // Arrange: Open form
      await opportunitiesPage.openCreateForm();

      // Act: Try to submit invalid form (empty name, no contact)
      await opportunitiesPage.clickSubmitButton();

      // Assert: Form should remain open
      const formVisible = await opportunitiesPage.shouldSeeForm();
      ownerTest.expect(formVisible).toBe(true);
    });
  });

  ownerTest.describe('Field Format Validation', () => {
    ownerTest('should accept valid positive amount', async ({ page }) => {
      // Arrange: Create opportunity with valid amount
      const opportunity = {
        name: uniqueOpportunityName('Valid Amount'),
        amount: 10000,
        contactName: TEST_CONTACTS.CONTACT_1,
      };

      // Act: Create opportunity
      const created = await opportunitiesPage.create(opportunity);

      // Assert: Opportunity should be created successfully
      ownerTest.expect(created).toBe(true);
      await opportunitiesPage.shouldSeeOpportunity(opportunity.name);
    });

    ownerTest.skip('should reject negative amount', async ({ page }) => {
      // NOTE: Skipped - requires validation for negative amounts in UI
      // Current UI may allow negative amounts

      // Arrange: Open form
      await opportunitiesPage.openCreateForm();

      // Act: Try to enter negative amount
      await opportunitiesPage.page.locator('[data-testid="opportunity-form-input-name"]').fill(
        uniqueOpportunityName('Negative')
      );
      await opportunitiesPage.page.locator('[data-testid="opportunity-form-input-amount"]').fill('-1000');
      await opportunitiesPage.selectContact(TEST_CONTACTS.CONTACT_1);
      await opportunitiesPage.page.locator('[data-testid="opportunity-form-button-submit"]').click();

      // Assert: Should show error or prevent submission
      const formVisible = await opportunitiesPage.shouldSeeForm();
      ownerTest.expect(formVisible).toBe(true);
    });

    ownerTest('should accept decimal amounts', async ({ page }) => {
      // Arrange: Create opportunity with decimal amount
      const opportunity = {
        name: uniqueOpportunityName('Decimal Amount'),
        amount: 12345.67,
        contactName: TEST_CONTACTS.CONTACT_1,
      };

      // Act: Create opportunity
      const created = await opportunitiesPage.create(opportunity);

      // Assert: Opportunity should be created successfully
      ownerTest.expect(created).toBe(true);
      await opportunitiesPage.shouldSeeOpportunity(opportunity.name);
    });

    ownerTest.skip('should format currency correctly', async ({ page }) => {
      // NOTE: Skipped - requires checking currency formatting in display
      // May depend on locale settings

      // Arrange: Create opportunity with specific amount
      const opportunity = {
        name: uniqueOpportunityName('Currency Format'),
        amount: 1234.56,
        contactName: TEST_CONTACTS.CONTACT_1,
      };
      await opportunitiesPage.create(opportunity);

      // Act: Get amount display
      const displayedAmount = await opportunitiesPage.getAmountDisplay(opportunity.name);

      // Assert: Should show formatted currency (e.g., "1,234.56" or "$1,234.56")
      ownerTest.expect(displayedAmount).toMatch(/1[,.]?234[,.]?56/);
    });
  });

  ownerTest.describe('Edge Cases', () => {
    ownerTest('should accept very long opportunity name', async ({ page }) => {
      // Arrange: Create opportunity with long name (255 chars)
      const longName = uniqueOpportunityName('Long') + ' ' + 'A'.repeat(200);
      const opportunity = {
        name: longName.substring(0, 255), // Limit to 255 chars
        contactName: TEST_CONTACTS.CONTACT_1,
      };

      // Act: Create opportunity
      const created = await opportunitiesPage.create(opportunity);

      // Assert: Opportunity should be created successfully
      ownerTest.expect(created).toBe(true);
      await opportunitiesPage.shouldSeeOpportunity(opportunity.name.substring(0, 50)); // Check first 50 chars
    });

    ownerTest('should accept very large amount', async ({ page }) => {
      // Arrange: Create opportunity with large amount
      const created = await opportunitiesPage.create(VALID_LARGE_AMOUNT);

      // Assert: Opportunity should be created successfully
      ownerTest.expect(created).toBe(true);
      await opportunitiesPage.shouldSeeOpportunity(VALID_LARGE_AMOUNT.name);
    });
  });
});
