/**
 * Opportunity Table View Tests
 *
 * Tests for table display, filtering, and search functionality.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { OpportunitiesPage } from '@pages/OpportunitiesPage';
import {
  createFullOpportunity,
  uniqueOpportunityName,
  uniqueAmount,
  TEST_CONTACTS,
} from './opportunities.fixture';

ownerTest.describe('Opportunity Table View', () => {
  let opportunitiesPage: OpportunitiesPage;

  ownerTest.beforeEach(async ({ page }) => {
    opportunitiesPage = new OpportunitiesPage(page);
    await opportunitiesPage.goto();
  });

  ownerTest.describe('Table Display', () => {
    ownerTest('should display opportunity name in table', async ({ page }) => {
      // Arrange: Create opportunity
      const opportunity = createFullOpportunity();
      await opportunitiesPage.create(opportunity);

      // Act & Assert: Name should be visible
      await opportunitiesPage.shouldSeeOpportunity(opportunity.name);
    });

    ownerTest('should display formatted amount in table', async ({ page }) => {
      // Arrange: Create opportunity with specific amount
      const opportunity = {
        name: uniqueOpportunityName('Amount Display'),
        amount: 5000,
        contactName: TEST_CONTACTS.CONTACT_1,
      };
      await opportunitiesPage.create(opportunity);

      // Act: Check if amount is visible in row
      await opportunitiesPage.shouldRowContain(opportunity.name, { amount: opportunity.amount });

      // Assert: Amount should be displayed (any format accepted)
      const displayedAmount = await opportunitiesPage.getAmountDisplay(opportunity.name);
      ownerTest.expect(displayedAmount.length).toBeGreaterThan(0);
    });

    ownerTest('should display contact name in table', async ({ page }) => {
      // Arrange: Create opportunity with contact
      const opportunity = createFullOpportunity();
      await opportunitiesPage.create(opportunity);

      // Act & Assert: Contact name should be visible in row
      await opportunitiesPage.shouldRowContain(opportunity.name, {
        contactName: opportunity.contactName,
      });
    });

    ownerTest('should display stage badge in table', async ({ page }) => {
      // Arrange: Create opportunity
      const opportunity = createFullOpportunity();
      await opportunitiesPage.create(opportunity);

      // Act: Check if stage column exists
      const stageColumnVisible = await opportunitiesPage.shouldSeeStageColumn();

      // Assert: Stage column should be visible
      ownerTest.expect(stageColumnVisible).toBe(true);
    });
  });

  ownerTest.describe('Search and Filter', () => {
    ownerTest('should find opportunity by name search', async ({ page }) => {
      // Arrange: Create opportunity with unique name
      const opportunity = {
        name: uniqueOpportunityName('Searchable'),
        contactName: TEST_CONTACTS.CONTACT_1,
      };
      await opportunitiesPage.create(opportunity);

      // Act: Search for opportunity
      await opportunitiesPage.search(opportunity.name);

      // Assert: Opportunity should be visible in results
      await opportunitiesPage.shouldSeeOpportunity(opportunity.name);
    });

    ownerTest('should find opportunity by contact name', async ({ page }) => {
      // Arrange: Create opportunity with specific contact
      const opportunity = {
        name: uniqueOpportunityName('Contact Search'),
        contactName: TEST_CONTACTS.CONTACT_2,
      };
      await opportunitiesPage.create(opportunity);

      // Act: Search by contact name
      await opportunitiesPage.search(TEST_CONTACTS.CONTACT_2);

      // Assert: Opportunity should be visible
      await opportunitiesPage.shouldSeeOpportunity(opportunity.name);
    });

    ownerTest.skip('should filter by amount range', async ({ page }) => {
      // NOTE: Skipped - requires amount range filter UI implementation
      // To enable: add amount filter controls to page

      // Arrange: Create opportunities with different amounts
      const lowAmount = {
        name: uniqueOpportunityName('Low Amount'),
        amount: 1000,
        contactName: TEST_CONTACTS.CONTACT_1,
      };
      const highAmount = {
        name: uniqueOpportunityName('High Amount'),
        amount: 10000,
        contactName: TEST_CONTACTS.CONTACT_1,
      };
      await opportunitiesPage.create(lowAmount);
      await opportunitiesPage.create(highAmount);

      // Act: Filter by amount range (implementation needed)
      // await opportunitiesPage.filterByAmountRange(5000, 15000);

      // Assert: Only high amount opportunity should be visible
      await opportunitiesPage.shouldSeeOpportunity(highAmount.name);
      await opportunitiesPage.shouldNotSeeOpportunity(lowAmount.name);
    });
  });

  ownerTest.describe('Multiple Opportunities', () => {
    ownerTest('should display multiple opportunities in table', async ({ page }) => {
      // Arrange: Create multiple opportunities
      const opp1 = createFullOpportunity();
      const opp2 = {
        name: uniqueOpportunityName('Second'),
        amount: uniqueAmount(),
        contactName: TEST_CONTACTS.CONTACT_2,
      };
      const opp3 = {
        name: uniqueOpportunityName('Third'),
        amount: uniqueAmount(),
        contactName: TEST_CONTACTS.CONTACT_3,
      };

      await opportunitiesPage.create(opp1);
      await opportunitiesPage.create(opp2);
      await opportunitiesPage.create(opp3);

      // Act: Get opportunity count
      const count = await opportunitiesPage.getOpportunityCount();

      // Assert: Should have at least 3 opportunities
      ownerTest.expect(count).toBeGreaterThanOrEqual(3);

      // Verify all three are visible
      await opportunitiesPage.shouldSeeOpportunity(opp1.name);
      await opportunitiesPage.shouldSeeOpportunity(opp2.name);
      await opportunitiesPage.shouldSeeOpportunity(opp3.name);
    });
  });
});
