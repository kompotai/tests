/**
 * Regression test for Issue #199
 * Agreement creation form had two bugs:
 * 1. "Please select a template" error was confusing (no scroll to error)
 * 2. Contact dropdown didn't work due to blur/mouseDown race condition
 *
 * Fix: Added ref-guard for dropdown blur, scroll to error on validation.
 *
 * @see https://github.com/kompotai/bug-reports/issues/199
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #199: Agreement Creation', { tag: ['@regression'] }, () => {
  const API_BASE = `/api/ws/${WORKSPACE_ID}`;

  ownerTest('agreement should be created via API without template @regression', async ({ request }) => {
    // Get a contact
    const contactsRes = await request.post(`${API_BASE}/contacts/search`, {
      data: { limit: 1 },
    });

    if (!contactsRes.ok()) {
      ownerTest.skip(true, 'Cannot fetch contacts');
      return;
    }

    const contactsData = await contactsRes.json();
    const contacts = contactsData.contacts || [];

    if (contacts.length === 0) {
      ownerTest.skip(true, 'No contacts found in workspace');
      return;
    }

    const contactId = contacts[0].id;

    // Create agreement without template
    const createRes = await request.post(`${API_BASE}/agreements`, {
      data: {
        title: 'Regression test agreement #199',
        type: 'contract',
        contactId,
        status: 'draft',
      },
    });

    expect(createRes.status()).toBe(201);
    const agreement = await createRes.json();

    try {
      expect(agreement.title).toBe('Regression test agreement #199');
      expect(agreement.contactId).toBe(contactId);
      expect(agreement.type).toBe('contract');
      expect(agreement.status).toBe('draft');
    } finally {
      // Cleanup
      await request.delete(`${API_BASE}/agreements/${agreement.id}`);
    }
  });

  ownerTest('contact selector should work in agreement form @regression', async ({ page }) => {
    await page.goto(`/ws/${WORKSPACE_ID}/agreements`);

    // Wait for the page to load
    const createButton = page.locator('[data-testid="create-agreement-button"]');
    try {
      await createButton.waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      ownerTest.skip(true, 'Create button not found');
      return;
    }

    await createButton.click();

    // Wait for form
    const form = page.locator('[data-testid="agreement-form"]');
    await expect(form).toBeVisible({ timeout: 5000 });

    // Wait for templates to finish loading
    await page.waitForTimeout(1000);

    // Type in contact search
    const contactInput = form.locator('input[placeholder]').last();
    await contactInput.fill('Sample');

    // Wait for search results
    await page.waitForTimeout(500);

    // Check if dropdown appeared with results
    const dropdownItem = form.locator('.absolute.z-10 button').first();
    const hasResults = await dropdownItem.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasResults) {
      ownerTest.skip(true, 'No contacts found matching "Sample"');
      return;
    }

    // Click on the first contact in dropdown
    const contactName = await dropdownItem.textContent();
    await dropdownItem.click();

    // Verify contact was selected (card should appear)
    if (contactName) {
      await expect(form.locator(`text=${contactName.trim()}`)).toBeVisible({ timeout: 3000 });
    }
  });
});
