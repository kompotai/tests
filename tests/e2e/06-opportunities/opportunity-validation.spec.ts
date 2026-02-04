/**
 * Opportunity Form Validation Tests
 *
 * Tests for form validation when creating opportunities.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { OpportunitiesPage } from '@pages/OpportunitiesPage';
import { uniqueOpportunityName } from './opportunities.fixture';

ownerTest.describe('Opportunity Form Validation', () => {
  let opportunitiesPage: OpportunitiesPage;

  ownerTest.beforeEach(async ({ page }) => {
    opportunitiesPage = new OpportunitiesPage(page);
    await opportunitiesPage.goto();
  });

  ownerTest('form stays open when submitting without name', async ({ page }) => {
    await opportunitiesPage.openCreateForm();

    // Try to submit without filling any fields
    await opportunitiesPage.submitForm();

    // Form should still be visible (not submitted)
    const formVisible = await opportunitiesPage.shouldSeeForm();
    expect(formVisible).toBe(true);
  });

  ownerTest('form stays open when submitting without contact', async ({ page }) => {
    await opportunitiesPage.openCreateForm();

    // Fill name but don't select contact
    const name = uniqueOpportunityName('No Contact');
    await opportunitiesPage.fillName(name);

    await opportunitiesPage.submitForm();

    // Form should still be visible (not submitted)
    const formVisible = await opportunitiesPage.shouldSeeForm();
    expect(formVisible).toBe(true);
  });

  ownerTest('can successfully create after fixing validation errors', async ({ page }) => {
    await opportunitiesPage.openCreateForm();

    // Dismiss any overlays before clicking submit
    await opportunitiesPage.dismissToasts();

    // Try to submit empty form — click submit directly to avoid 10s form-close wait
    await page.locator('[data-testid="opportunity-form-button-submit"]').click();
    await opportunitiesPage.wait(500);

    // Form should still be visible
    const formStillVisible = await opportunitiesPage.shouldSeeForm();
    expect(formStillVisible).toBe(true);

    // Now fill in required fields and submit
    const name = uniqueOpportunityName('FixedVal');
    await opportunitiesPage.fillName(name);
    await opportunitiesPage.selectFirstContact();
    await opportunitiesPage.submitForm();

    // Should succeed
    await opportunitiesPage.shouldSeeOpportunity(name);
  });
});
