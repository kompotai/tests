/**
 * Opportunity Edit Tests
 *
 * Tests for editing opportunities from the table.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { OpportunitiesPage } from '@pages/OpportunitiesPage';
import { uniqueOpportunityName } from './opportunities.fixture';

ownerTest.describe('Opportunity Edit', () => {
  let opportunitiesPage: OpportunitiesPage;

  ownerTest.beforeEach(async ({ page }) => {
    opportunitiesPage = new OpportunitiesPage(page);
    await opportunitiesPage.goto();
  });

  ownerTest.describe('Edit from Table', () => {
    ownerTest('can open edit form from table', async ({ page }) => {
      const name = uniqueOpportunityName('OpenEdit');
      const created = await opportunitiesPage.create({ name });
      expect(created).toBe(true);

      const opened = await opportunitiesPage.clickRowEditByName(name);
      expect(opened).toBe(true);

      const formVisible = await opportunitiesPage.shouldSeeForm();
      expect(formVisible).toBe(true);
    });

    ownerTest('can edit opportunity name', async ({ page }) => {
      const name = uniqueOpportunityName('OrigName');
      const created = await opportunitiesPage.create({ name });
      expect(created).toBe(true);

      const newName = uniqueOpportunityName('NewName');
      await opportunitiesPage.edit(name, { name: newName });

      await opportunitiesPage.shouldSeeOpportunity(newName);
      await opportunitiesPage.shouldNotSeeOpportunity(name);
    });

    ownerTest('can edit opportunity amount', async ({ page }) => {
      const name = uniqueOpportunityName('EditAmt');
      const created = await opportunitiesPage.create({ name, amount: 1000 });
      expect(created).toBe(true);

      await opportunitiesPage.edit(name, { amount: 5000 });

      await opportunitiesPage.shouldSeeOpportunity(name);
      const amount = await opportunitiesPage.getOpportunityAmount(name);
      expect(amount).toContain('5,000');
    });

    ownerTest('edited opportunity persists after page refresh', async ({ page }) => {
      const name = uniqueOpportunityName('EditPersist');
      const created = await opportunitiesPage.create({ name });
      expect(created).toBe(true);

      const newName = uniqueOpportunityName('Persisted');
      await opportunitiesPage.edit(name, { name: newName });

      await page.reload();
      await opportunitiesPage.waitForPageLoad();
      await opportunitiesPage.shouldSeeOpportunity(newName);
    });

    ownerTest('can cancel edit without saving', async ({ page }) => {
      const name = uniqueOpportunityName('CancelEdit');
      const created = await opportunitiesPage.create({ name });
      expect(created).toBe(true);

      const opened = await opportunitiesPage.clickRowEditByName(name);
      expect(opened).toBe(true);

      // Change name but cancel
      const newName = uniqueOpportunityName('Cancelled');
      await opportunitiesPage.fillName(newName);

      await opportunitiesPage.cancelForm();

      // Original name should still be there
      await opportunitiesPage.shouldSeeOpportunity(name);
      await opportunitiesPage.shouldNotSeeOpportunity(newName);
    });
  });
});
