/**
 * Opportunity Creation Tests
 *
 * Tests for creating opportunities with various field combinations.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { OpportunitiesPage } from '@pages/OpportunitiesPage';
import { uniqueOpportunityName, createFullOpportunity, TEST_CONTACTS } from './opportunities.fixture';

ownerTest.describe('Opportunity Creation', () => {
  let opportunitiesPage: OpportunitiesPage;

  ownerTest.beforeEach(async ({ page }) => {
    opportunitiesPage = new OpportunitiesPage(page);
    await opportunitiesPage.goto();
  });

  // ============================================
  // Basic Creation
  // ============================================

  ownerTest.describe('Basic Creation', () => {
    ownerTest('creates opportunity with name and contact', async ({ page }) => {
      const name = uniqueOpportunityName('Basic');
      const created = await opportunitiesPage.create({
        name,
        contactName: TEST_CONTACTS.CONTACT_1,
      });

      expect(created).toBe(true);
      await opportunitiesPage.shouldSeeOpportunity(name);
    });

    ownerTest('creates opportunity with all basic fields', async ({ page }) => {
      const opportunity = createFullOpportunity();
      const created = await opportunitiesPage.create({
        name: opportunity.name,
        amount: opportunity.amount,
        contactName: opportunity.contactName,
      });

      expect(created).toBe(true);
      await opportunitiesPage.shouldSeeOpportunity(opportunity.name);
    });

    ownerTest('creates opportunity with description', async ({ page }) => {
      const name = uniqueOpportunityName('With Description');
      const description = 'Test opportunity description for E2E testing';

      const created = await opportunitiesPage.create({
        name,
        contactName: TEST_CONTACTS.CONTACT_1,
        description,
      });

      expect(created).toBe(true);
      await opportunitiesPage.shouldSeeOpportunity(name);
    });

    ownerTest('created opportunity appears in table', async ({ page }) => {
      const name = uniqueOpportunityName('In Table');
      await opportunitiesPage.create({
        name,
        contactName: TEST_CONTACTS.CONTACT_1,
      });

      // Refresh and verify
      await opportunitiesPage.goto();
      await opportunitiesPage.shouldSeeOpportunity(name);
    });

    ownerTest('created opportunity persists after page refresh', async ({ page }) => {
      const name = uniqueOpportunityName('Persisted');
      await opportunitiesPage.create({
        name,
        contactName: TEST_CONTACTS.CONTACT_1,
      });

      await page.reload();
      await opportunitiesPage.waitForPageLoad();
      await opportunitiesPage.shouldSeeOpportunity(name);
    });
  });

  // ============================================
  // Form UI Behavior
  // ============================================

  ownerTest.describe('Form UI', () => {
    ownerTest('opens create form when clicking create button', async ({ page }) => {
      await opportunitiesPage.openCreateForm();
      const formVisible = await opportunitiesPage.shouldSeeForm();
      expect(formVisible).toBe(true);
    });

    ownerTest('can cancel opportunity creation', async ({ page }) => {
      const name = uniqueOpportunityName('Cancelled');
      await opportunitiesPage.openCreateForm();

      // Fill name
      await page.locator('[data-testid="opportunity-form-input-name"]').fill(name);

      // Cancel
      await opportunitiesPage.cancelForm();

      // Should not see the opportunity
      await opportunitiesPage.shouldNotSeeOpportunity(name);
    });

    ownerTest('form has empty name field initially', async ({ page }) => {
      await opportunitiesPage.openCreateForm();
      const nameInput = page.locator('[data-testid="opportunity-form-input-name"]');
      await expect(nameInput).toHaveValue('');
    });
  });

  // ============================================
  // Pipeline and Stage
  // ============================================

  ownerTest.describe('Pipeline and Stage', () => {
    ownerTest('shows pipeline tabs on opportunities page', async ({ page }) => {
      const hasPipelineTabs = await opportunitiesPage.shouldSeePipelineTabs();
      expect(hasPipelineTabs).toBe(true);
    });

    ownerTest('shows stage column in table', async ({ page }) => {
      // Create an opportunity first to ensure table has data
      const name = uniqueOpportunityName('Stage Test');
      await opportunitiesPage.create({
        name,
        contactName: TEST_CONTACTS.CONTACT_1,
      });

      const hasStageColumn = await opportunitiesPage.shouldSeeStageColumn();
      expect(hasStageColumn).toBe(true);
    });
  });

  // ============================================
  // Search
  // ============================================

  ownerTest.describe('Search', () => {
    ownerTest('search filters opportunities', async ({ page }) => {
      // Create opportunity with unique name
      const uniquePart = `SearchTest${Date.now()}`;
      const name = uniqueOpportunityName(uniquePart);
      await opportunitiesPage.create({
        name,
        contactName: TEST_CONTACTS.CONTACT_1,
      });

      // Search for it
      await opportunitiesPage.search(uniquePart);
      await opportunitiesPage.shouldSeeOpportunity(name);
    });
  });
});
