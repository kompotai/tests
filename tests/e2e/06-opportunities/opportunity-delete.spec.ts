/**
 * Opportunity Delete Tests
 *
 * Tests for deleting opportunities from table and view page.
 * Covers: O5 - Delete opportunity functionality
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { OpportunitiesPage } from '@pages/OpportunitiesPage';
import { createFullOpportunity } from './opportunities.fixture';

ownerTest.describe('Opportunity Delete', () => {
  let opportunitiesPage: OpportunitiesPage;

  ownerTest.beforeEach(async ({ page }) => {
    opportunitiesPage = new OpportunitiesPage(page);
    await opportunitiesPage.goto();
  });

  ownerTest.describe('Delete from Table', () => {
    ownerTest('should show confirmation dialog when clicking delete button', async ({ page }) => {
      // Arrange: Create opportunity
      const opportunity = createFullOpportunity();
      await opportunitiesPage.create(opportunity);

      // Act: Click delete button
      await opportunitiesPage.clickRowDelete(opportunity.name);

      // Assert: Confirmation dialog should be visible
      const dialogVisible = await opportunitiesPage.isConfirmDialogVisible();
      ownerTest.expect(dialogVisible).toBe(true);

      // Cleanup: Cancel dialog
      await opportunitiesPage.cancelDialog();
    });

    ownerTest('should delete opportunity after confirming', async ({ page }) => {
      // Arrange: Create opportunity
      const opportunity = createFullOpportunity();
      await opportunitiesPage.create(opportunity);

      // Act: Delete opportunity
      await opportunitiesPage.delete(opportunity.name);

      // Assert: Opportunity should not be visible
      await opportunitiesPage.shouldNotSeeOpportunity(opportunity.name);
    });

    ownerTest('should not be visible after deletion and refresh', async ({ page }) => {
      // Arrange: Create and delete opportunity
      const opportunity = createFullOpportunity();
      await opportunitiesPage.create(opportunity);
      await opportunitiesPage.delete(opportunity.name);

      // Act: Refresh page
      await page.reload();
      await opportunitiesPage.waitForPageLoad();

      // Assert: Opportunity should still not be visible
      await opportunitiesPage.shouldNotSeeOpportunity(opportunity.name);
    });

    ownerTest('should not delete when canceling confirmation', async ({ page }) => {
      // Arrange: Create opportunity
      const opportunity = createFullOpportunity();
      await opportunitiesPage.create(opportunity);

      // Act: Click delete but cancel
      await opportunitiesPage.clickRowDelete(opportunity.name);
      if (await opportunitiesPage.isConfirmDialogVisible()) {
        await opportunitiesPage.cancelDialog();
      }

      // Assert: Opportunity should still be visible
      await opportunitiesPage.shouldSeeOpportunity(opportunity.name);
    });
  });

  ownerTest.describe('Delete Persistence', () => {
    ownerTest('should stay deleted after page refresh', async ({ page }) => {
      // Arrange: Create opportunity
      const opportunity = createFullOpportunity();
      await opportunitiesPage.create(opportunity);
      const opportunityName = opportunity.name;

      // Act: Delete and refresh
      await opportunitiesPage.delete(opportunityName);
      await page.reload();
      await opportunitiesPage.waitForPageLoad();

      // Assert: Should not be visible after refresh
      await opportunitiesPage.shouldNotSeeOpportunity(opportunityName);
    });

    ownerTest('should not be found via search after deletion', async ({ page }) => {
      // Arrange: Create opportunity
      const opportunity = createFullOpportunity();
      await opportunitiesPage.create(opportunity);
      const opportunityName = opportunity.name;

      // Act: Delete and search
      await opportunitiesPage.delete(opportunityName);
      await opportunitiesPage.search(opportunityName);

      // Assert: Should not be found
      await opportunitiesPage.shouldNotSeeOpportunity(opportunityName);
    });
  });
});
