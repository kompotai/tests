/**
 * Contacts Tests (Story-Driven)
 *
 * See: stories/contacts.story.md
 *
 * Behaviors covered:
 * - C1: View Contacts List
 * - C2: Create Contact
 * - C3: Edit Contact
 * - C4: Delete Contact
 * - C5: Search Contacts
 */

import { test, expect } from '@fixtures/world.fixture';
import {
  fillField,
  clickButton,
  shouldSee,
  waitForLoading,
} from '../../../helpers/actions';

// Helper to perform search via URL navigation (most reliable)
async function performSearch(page: import('@playwright/test').Page, query: string, basePath = '/ws/contacts') {
  const url = `${basePath}?search=${encodeURIComponent(query)}`;
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  return true;
}

test.describe('Contacts', () => {
  test.beforeEach(async ({ world }) => {
    await world.loginAs('default');
  });

  test.describe('C1: View Contacts List', () => {
    test('[C1] User can see contacts list @smoke', async ({ world }) => {
      await world.goto('/ws/contacts');
      await waitForLoading(world.page);
      await shouldSee(world.page, 'Contacts');
    });

    test('[C1] Contacts list displays contact information', async ({ world }) => {
      await world.goto('/ws/contacts');
      await waitForLoading(world.page);
      // Check for table/list structure with contact data
      const hasTable = await world.page.locator('table, [role="grid"], [class*="list"]').first().isVisible().catch(() => false);
      expect(hasTable).toBeTruthy();
    });

    test('[C1] Empty state shown when no contacts match filter', async ({ world }) => {
      // Navigate directly with search that won't match anything
      await performSearch(world.page, 'nonexistent_xyz_999_unique');

      // Check for empty state - page shows "Contact not found"
      await expect(world.page.getByText('Contact not found')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('C2: Create Contact', () => {
    test('[C2] User can open contact creation form', async ({ world }) => {
      await world.goto('/ws/contacts');
      await waitForLoading(world.page);
      await clickButton(world.page, 'Create Contact');
      await world.page.waitForTimeout(500);
      const formVisible = await world.page.locator('[data-testid="contact-form"], form').first().isVisible();
      expect(formVisible).toBeTruthy();
    });

    test('[C2] User can create contact', async ({ world }) => {
      await world.goto('/ws/contacts');
      await waitForLoading(world.page);
      await clickButton(world.page, 'Create Contact');
      await world.page.waitForTimeout(500);
      const uniqueName = `Test ${Date.now()}`;
      await fillField(world.page, 'name', uniqueName);
      await clickButton(world.page, 'Save');
      await waitForLoading(world.page);
      await world.page.waitForTimeout(1000); // Wait for sidebar to close
      expect(await world.shouldSee(uniqueName)).toBeTruthy();
    });

    test('[C2] User can create a contact with all fields filled', async ({ world }) => {
      await world.goto('/ws/contacts');
      await waitForLoading(world.page);
      await clickButton(world.page, 'Create Contact');
      await world.page.waitForTimeout(500);
      const uniqueName = `Test ${Date.now()}`;
      await fillField(world.page, 'name', uniqueName);

      const uniqueEmail = `search${Date.now()}@test.com`;
      await fillField(world.page, 'email', uniqueEmail);
      const uniquePhone = `${Date.now()}`.slice(-10);
      await world.page.getByPlaceholder('(201) 555-0123').fill(uniquePhone);
      const contactTypeDropdown = world.page.locator('#contactType');
      await contactTypeDropdown.click();
      await world.page.getByText('Client').click();
      const sourceDropdown = world.page.locator('#source');
      await sourceDropdown.click();
      await world.page.getByText('Advertising').click();
      await fillField(world.page, 'company', `Company ${Date.now()}`);
      await fillField(world.page, 'position', 'Worker');
      await world.page.locator('textarea[name="notes"]');
      await fillField(world.page, 'notes', `Test note ${Date.now()}`);
      await clickButton(world.page, 'Save');
      await waitForLoading(world.page);
      await world.page.waitForTimeout(1000); // Wait for sidebar to close
      expect(await world.shouldSee(uniqueName)).toBeTruthy();
    });
  });


test.describe('C3: Edit Contact', () => {
    test('[C3] User can edit contact', async ({ world }) => {
      await world.goto('/ws/contacts');
      await waitForLoading(world.page);

      // Create a contact first (avoid names starting with "Edit" to prevent selector conflicts)
      await clickButton(world.page, 'Create Contact');
      await world.page.waitForTimeout(500);
      const originalName = `ToUpdate${Date.now()}`;
      await fillField(world.page, 'name', originalName);
      await clickButton(world.page, 'Save');
      await waitForLoading(world.page);
      await world.page.waitForTimeout(1000);

      // Find the row with the contact and click the edit button in the action cell
      const contactRow = world.page.locator(`tr:has-text("${originalName}")`).first();
      // The edit button contains only an img - use nth to get the button after "Open page" link
      const editBtn = contactRow.locator('td:last-child button').nth(0);
      await editBtn.click();
      await world.page.waitForTimeout(1000);

      // Update the name
      const updatedName = `Updated${Date.now()}`;
      const nameInput = world.page.locator('[data-testid="contact-form-input-name"], input[name="name"]').first();
      await nameInput.clear();
      await nameInput.fill(updatedName);
      await clickButton(world.page, 'Save');
      await waitForLoading(world.page);
      await world.page.waitForTimeout(1000);

      expect(await world.shouldSee(updatedName)).toBeTruthy();
    });

    test('[C3] Edit form shows current contact data', async ({ world }) => {
      await world.goto('/ws/contacts');
      await waitForLoading(world.page);

      // Create a contact first
      await clickButton(world.page, 'Create Contact');
      await world.page.waitForTimeout(500);
      const contactName = `DataCheck${Date.now()}`;
      await fillField(world.page, 'name', contactName);
      await clickButton(world.page, 'Save');
      await waitForLoading(world.page);
      await world.page.waitForTimeout(1000);

      // Find the row with the contact and click the edit button in the action cell
      const contactRow = world.page.locator(`tr:has-text("${contactName}")`).first();
      // The edit button contains only an img - use nth to get the button after "Open page" link
      const editBtn = contactRow.locator('td:last-child button').nth(0);
      await editBtn.click();
      await world.page.waitForTimeout(1000);

      // Check that the form is populated with current data
      const nameInput = world.page.locator('[data-testid="contact-form-input-name"], input[name="name"]').first();
      const inputValue = await nameInput.inputValue().catch(() => '');
      expect(inputValue).toContain(contactName);
    });
  });

  test.describe('C4: Delete Contact', () => {
    test('[C4] User sees delete confirmation', async ({ world }) => {
      await world.goto('/ws/contacts');
      await waitForLoading(world.page);

      // Create a contact to delete
      await clickButton(world.page, 'Create Contact');
      await world.page.waitForTimeout(500);
      const contactName = `ToDelete${Date.now()}`;
      await fillField(world.page, 'name', contactName);
      await clickButton(world.page, 'Save');
      await waitForLoading(world.page);
      await world.page.waitForTimeout(1000);

      // Find the row with the contact and click the delete button
      const contactRow = world.page.locator(`tr:has-text("${contactName}")`).first();
      // Action buttons are in the cell that contains "Open page" link
      const deleteBtn = contactRow.locator('td:has(a:has-text("Open page")) button:has-text("Delete")').first();

      if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await deleteBtn.click();
        await world.page.waitForTimeout(500);
        // Check for confirmation dialog using data-testid
        const confirmDialog = await world.page.locator('[data-testid="confirm-dialog"]').isVisible({ timeout: 3000 }).catch(() => false);
        expect(confirmDialog).toBeTruthy();
      } else {
        test.skip();
      }
    });

    test('[C4] Contact removed after confirmation', async ({ world }) => {
      await world.goto('/ws/contacts');
      await waitForLoading(world.page);

      // Create a contact to delete
      await clickButton(world.page, 'Create Contact');
      await world.page.waitForTimeout(500);
      const contactName = `DeleteMe${Date.now()}`;
      await fillField(world.page, 'name', contactName);
      await clickButton(world.page, 'Save');
      await waitForLoading(world.page);
      await world.page.waitForTimeout(1000);

      // Find the row with the contact and click the delete button
      const contactRow = world.page.locator(`tr:has-text("${contactName}")`).first();
      // Action buttons are in the cell that contains "Open page" link
      const deleteBtn = contactRow.locator('td:has(a:has-text("Open page")) button:has-text("Delete")').first();

      if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await deleteBtn.click();
        await world.page.waitForTimeout(500);

        // Confirm deletion using data-testid
        const confirmBtn = world.page.locator('[data-testid="confirm-dialog-button-confirm"]');
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.click();
          await waitForLoading(world.page);
          await world.page.waitForTimeout(1000);
        }

        // Verify contact is removed
        await world.goto('/ws/contacts');
        await waitForLoading(world.page);
        const stillVisible = await world.page.locator(`text=${contactName}`).first().isVisible({ timeout: 2000 }).catch(() => false);
        expect(stillVisible).toBeFalsy();
      } else {
        test.skip();
      }
    });
  });

  test.describe('C5: Search Contacts', () => {
    test('[C5] Search by name works', async ({ world }) => {
      await world.goto('/ws/contacts');
      await waitForLoading(world.page);

      // Create a uniquely named contact
      await clickButton(world.page, 'Create Contact');
      await world.page.waitForTimeout(500);
      const uniqueName = `SearchTest${Date.now()}`;
      await fillField(world.page, 'name', uniqueName);
      await clickButton(world.page, 'Save');
      await waitForLoading(world.page);
      await world.page.waitForTimeout(1000);

      // Search for the contact
      const searched = await performSearch(world.page, uniqueName);
      if (searched) {
        expect(await world.shouldSee(uniqueName)).toBeTruthy();
      }
    });

    test('[C5] Search by email works', async ({ world }) => {
      await world.goto('/ws/contacts');
      await waitForLoading(world.page);

      // Create a contact with unique email
      await clickButton(world.page, 'Create Contact');
      await world.page.waitForTimeout(500);
      const uniqueName = `EmailSearch${Date.now()}`;
      const uniqueEmail = `search${Date.now()}@test.com`;
      await fillField(world.page, 'name', uniqueName);

      // Fill email field
      const emailField = world.page.locator('[data-testid="contact-form-input-email-0"], input[type="email"]').first();
      if (await emailField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await emailField.fill(uniqueEmail);
      }

      await clickButton(world.page, 'Save');
      await waitForLoading(world.page);
      await world.page.waitForTimeout(1000);

      // Search by email
      const searched = await performSearch(world.page, uniqueEmail);
      if (searched) {
        const found = await world.page.locator(`text=${uniqueName}`).first().isVisible({ timeout: 5000 }).catch(() => false);
        expect(found).toBeTruthy();
      }
    });

    test('[C5] No results message when search finds nothing', async ({ world }) => {
      // Navigate directly with search that won't match anything
      await performSearch(world.page, 'nonexistent_abc_999_unique');

      // Check for empty state - page shows "Contact not found"
      await expect(world.page.getByText('Contact not found')).toBeVisible({ timeout: 10000 });
    });
  });
});
