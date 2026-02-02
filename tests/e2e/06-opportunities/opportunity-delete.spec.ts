/**
 * Opportunity Delete Tests
 *
 * Tests for deleting opportunities from the table.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { OpportunitiesPage } from '@pages/OpportunitiesPage';
import { uniqueOpportunityName } from './opportunities.fixture';

ownerTest.describe('Opportunity Delete', () => {
  let opportunitiesPage: OpportunitiesPage;

  ownerTest.beforeEach(async ({ page }) => {
    opportunitiesPage = new OpportunitiesPage(page);
    await opportunitiesPage.goto();
  });

  ownerTest('can delete opportunity from table', async ({ page }) => {
    const name = uniqueOpportunityName('Del Test');
    const created = await opportunitiesPage.create({ name });
    expect(created).toBe(true);

    await opportunitiesPage.shouldSeeOpportunity(name);
    await opportunitiesPage.delete(name);
    await opportunitiesPage.shouldNotSeeOpportunity(name);
  });

  ownerTest('deleted opportunity does not appear after page refresh', async ({ page }) => {
    const name = uniqueOpportunityName('Del Persist');
    const created = await opportunitiesPage.create({ name });
    expect(created).toBe(true);

    await opportunitiesPage.delete(name);

    await page.reload();
    await opportunitiesPage.waitForPageLoad();
    await opportunitiesPage.shouldNotSeeOpportunity(name);
  });

  ownerTest('can cancel delete and keep opportunity', async ({ page }) => {
    const name = uniqueOpportunityName('Cancel Del');
    const created = await opportunitiesPage.create({ name });
    expect(created).toBe(true);

    const clicked = await opportunitiesPage.clickRowDeleteByName(name);
    expect(clicked).toBe(true);

    if (await opportunitiesPage.isConfirmDialogVisible()) {
      await opportunitiesPage.cancelDialog();
    }

    await opportunitiesPage.shouldSeeOpportunity(name);
  });
});
