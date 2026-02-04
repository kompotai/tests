/**
 * Email Templates Tests
 *
 * Tests for email templates functionality at /settings/email/templates
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Email Templates', () => {
  const templatesUrl = `/ws/${WORKSPACE_ID}/settings/email/templates`;

  ownerTest.beforeEach(async ({ page }) => {
    await page.goto(templatesUrl);
    await page.waitForLoadState('networkidle');
  });

  // ============================================
  // Page Display
  // ============================================

  ownerTest.describe('Page Display', () => {
    ownerTest('shows email templates page', async ({ page }) => {
      // Should show create button (use exact name to avoid multiple matches)
      await expect(page.getByRole('button', { name: 'Create Template' }).first()).toBeVisible();
    });

    ownerTest('shows templates count or empty state', async ({ page }) => {
      // Should show either "X template(s)" count or empty state message
      // Count format: "1 template" or "2 templates"
      // Empty state: "No templates yet" or "Create your first email template"
      const hasCount = await page.getByText(/\d+ templates?/).isVisible().catch(() => false);
      const hasNoTemplates = await page.getByText('No templates yet').isVisible().catch(() => false);
      const hasCreateFirst = await page.getByText('Create your first email template').isVisible().catch(() => false);
      expect(hasCount || hasNoTemplates || hasCreateFirst).toBe(true);
    });

    ownerTest('Email Templates tab is active', async ({ page }) => {
      const templatesTab = page.getByRole('link', { name: /email templates/i });
      await expect(templatesTab).toHaveClass(/border-blue-600/);
    });
  });

  // ============================================
  // Tab Navigation
  // ============================================

  ownerTest.describe('Tab Navigation', () => {
    ownerTest('can navigate to User Mailboxes', async ({ page }) => {
      await page.getByRole('link', { name: /user mailboxes/i }).click();
      await expect(page).toHaveURL(/\/settings\/email$/);
    });

    ownerTest('can navigate to Email Services', async ({ page }) => {
      await page.getByRole('link', { name: /email services/i }).click();
      await expect(page).toHaveURL(/\/settings\/email\/services/);
    });
  });

  // ============================================
  // Template CRUD
  // ============================================

  ownerTest.describe('Template Management', () => {
    ownerTest('can open create template dialog', async ({ page }) => {
      await page.getByRole('button', { name: 'Create Template' }).first().click();

      // Dialog should appear with "Create Template" heading (it's h2, not h1)
      await expect(page.locator('h2').filter({ hasText: 'Create Template' })).toBeVisible({ timeout: 5000 });
    });

    ownerTest('create template dialog has required fields', async ({ page }) => {
      await page.getByRole('button', { name: 'Create Template' }).first().click();

      // Wait for dialog heading to confirm it's open
      await expect(page.locator('h2').filter({ hasText: 'Create Template' })).toBeVisible({ timeout: 5000 });

      // Should see name field (using placeholder)
      await expect(page.getByPlaceholder('Welcome Email')).toBeVisible({ timeout: 5000 });
      // Should see subject field (find by looking for "Subject Line" label text nearby)
      await expect(page.getByText('Subject Line').first()).toBeVisible({ timeout: 5000 });
    });

    ownerTest('can create a simple template', async ({ page }) => {
      const templateName = `Test Template ${Date.now()}`;

      // Dismiss cookie consent if visible
      const acceptButton = page.getByRole('button', { name: /accept all/i });
      if (await acceptButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await acceptButton.click();
        await page.waitForTimeout(500);
      }

      await page.getByRole('button', { name: 'Create Template' }).first().click();

      // Wait for dialog to open
      await expect(page.locator('h2').filter({ hasText: 'Create Template' })).toBeVisible({ timeout: 5000 });

      // Fill template name
      await page.getByPlaceholder('Welcome Email').fill(templateName);

      // Fill subject - find the input after "Subject Line" label
      const subjectContainer = page.locator('div').filter({ hasText: /^Subject Line/ }).first();
      const subjectInput = subjectContainer.locator('input');
      await subjectInput.fill('Test Subject');

      // Body textarea already has default template content - no need to fill

      // Save - button text is "Save Template" - use force:true to bypass overlay
      await page.getByRole('button', { name: 'Save Template' }).click({ force: true });

      // Wait for dialog to close (h2 should disappear)
      await expect(page.locator('h2').filter({ hasText: 'Create Template' })).not.toBeVisible({ timeout: 10000 });

      // Should see the template in the list
      await expect(page.getByText(templateName)).toBeVisible({ timeout: 5000 });
    });

    ownerTest('template card shows menu with actions', async ({ page }) => {
      // Check if we have templates (look for count like "1 template" or "2 templates")
      const templateCount = await page.getByText(/\d+ templates?/).isVisible({ timeout: 3000 }).catch(() => false);
      if (!templateCount) {
        // No templates, skip this test
        ownerTest.skip();
        return;
      }

      // Find template cards by looking for font-medium h3 elements (template names)
      const templateName = page.locator('h3.font-medium').first();
      await expect(templateName).toBeVisible({ timeout: 5000 });

      // Click the menu button (three dots) - it's a sibling of the template name area
      // Look for button with SVG inside that's near template card
      const templateCard = page.locator('.rounded-lg.border').filter({ has: page.locator('h3') }).first();
      const menuButton = templateCard.locator('button').first();
      await menuButton.click();

      // Should see dropdown menu with Edit, Duplicate, Delete options
      const editOption = page.getByRole('button', { name: /edit template/i }).or(page.locator('button').filter({ hasText: /^Edit$/i }));
      await expect(editOption.first()).toBeVisible({ timeout: 3000 });
    });
  });
});
