/**
 * Marketing Module — Email Templates CRUD Tests
 *
 * All selectors use data-testid for stability.
 * Template modal: marketing-dialog-template, marketing-input-templateName, etc.
 * Context menu: marketing-template-button-menu-{id}, marketing-menuitem-editTemplate, etc.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { MarketingPage } from '@pages/MarketingPage';
import { MarketingSelectors } from '@pages/selectors/marketing.selectors';

const TEST_HTML = '<h1>Template Test</h1><p>Template body</p>';

// NOTE: Email Templates feature was removed from the UI on Feb 14, 2026.
// All template tests are skipped until the feature is re-enabled.
// The templates page (/marketing/templates) now returns 404.
// The sidebar link "Email Templates" has been removed.
// Selectors and Page Object methods are preserved for when the feature returns.
ownerTest.describe.skip('Marketing — Email Templates [FEATURE REMOVED]', () => {
  let marketing: MarketingPage;

  ownerTest.beforeEach(async ({ page }) => {
    marketing = new MarketingPage(page);
    await marketing.gotoTemplates();
  });

  // ============================================
  // Page Display
  // ============================================

  ownerTest.describe('Page Display', () => {
    ownerTest('shows templates heading and create button', async ({ page }) => {
      await expect(page.locator(MarketingSelectors.templates.heading)).toBeVisible();
      await expect(page.locator(MarketingSelectors.templates.createTemplateBtn)).toBeVisible();
    });

    ownerTest('shows templates grid', async ({ page }) => {
      await expect(page.locator(MarketingSelectors.templates.grid)).toBeVisible();
    });
  });

  // ============================================
  // Template Creation — Happy Path
  // ============================================

  ownerTest.describe('Create Template', () => {
    ownerTest('modal opens with required fields', async ({ page }) => {
      await marketing.clickCreateTemplate();

      await expect(page.locator(MarketingSelectors.templateModal.dialog)).toBeVisible();
      await expect(page.locator(MarketingSelectors.templateModal.templateName)).toBeVisible();
      await expect(page.locator(MarketingSelectors.templateModal.subjectLine)).toBeVisible();
      await expect(page.locator(MarketingSelectors.templateModal.htmlContent)).toBeVisible();
    });

    ownerTest('modal has Edit and Preview tabs', async ({ page }) => {
      await marketing.clickCreateTemplate();

      await expect(page.locator(MarketingSelectors.templateModal.editTab)).toBeVisible();
      await expect(page.locator(MarketingSelectors.templateModal.previewTab)).toBeVisible();
    });

    ownerTest('can create a template', async ({ page }) => {
      const name = `Template ${Date.now()}`;

      await marketing.createTemplate({
        name,
        subject: 'Test Subject',
        html: TEST_HTML,
      });

      // Modal should close
      await expect(page.locator(MarketingSelectors.templateModal.dialog))
        .not.toBeVisible({ timeout: 5000 });

      await marketing.shouldSeeTemplate(name);
    });

    ownerTest('can create template with Cyrillic content', async () => {
      const name = `Шаблон ${Date.now()}`;

      await marketing.createTemplate({
        name,
        subject: 'Тестовая тема',
        html: '<h1>Привет!</h1>',
      });

      await marketing.shouldSeeTemplate(name);
    });

    ownerTest('template count increments after creation', async ({ page }) => {
      const countBefore = await marketing.getTemplateCountFromHeading();
      const name = `Counter ${Date.now()}`;

      await marketing.createTemplate({
        name,
        subject: 'Counter Subject',
        html: TEST_HTML,
      });

      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      const countAfter = await marketing.getTemplateCountFromHeading();

      expect(countAfter).toBe(countBefore + 1);
    });
  });

  // ============================================
  // Template Validation
  // ============================================

  ownerTest.describe('Validation', () => {
    ownerTest('Save is disabled when Template Name is empty', async () => {
      await marketing.clickCreateTemplate();
      await marketing.fillTemplateSubject('Subject');
      await marketing.fillTemplateHtml(TEST_HTML);

      expect(await marketing.isSaveTemplateDisabled()).toBe(true);
    });

    ownerTest('Save is disabled when Subject Line is empty', async () => {
      await marketing.clickCreateTemplate();
      await marketing.fillTemplateName('Name');
      await marketing.fillTemplateHtml(TEST_HTML);

      expect(await marketing.isSaveTemplateDisabled()).toBe(true);
    });

    ownerTest('Save becomes enabled when all required fields filled', async () => {
      await marketing.clickCreateTemplate();
      await marketing.fillTemplateName('Enabled');
      await marketing.fillTemplateSubject('Subject');
      await marketing.fillTemplateHtml(TEST_HTML);

      expect(await marketing.isSaveTemplateDisabled()).toBe(false);
    });
  });

  // ============================================
  // Template Preview
  // ============================================

  ownerTest.describe('Preview', () => {
    ownerTest('Preview tab renders HTML content', async ({ page }) => {
      await marketing.clickCreateTemplate();
      await marketing.fillTemplateName('Preview Test');
      await marketing.fillTemplateSubject('Subject');
      await marketing.fillTemplateHtml('<h1>Hello Preview</h1><p>Body</p>');

      await marketing.clickTemplatePreview();

      // Preview container should show rendered content
      const preview = page.locator(MarketingSelectors.templateModal.previewContainer);
      await expect(preview).toBeVisible();
    });

    ownerTest('can switch between Edit and Preview tabs', async ({ page }) => {
      await marketing.clickCreateTemplate();
      await marketing.fillTemplateHtml('<p>Toggle content</p>');

      await marketing.clickTemplatePreview();
      await expect(page.locator(MarketingSelectors.templateModal.previewContainer)).toBeVisible();

      await marketing.clickTemplateEdit();
      await expect(page.locator(MarketingSelectors.templateModal.htmlContent)).toBeVisible();
    });
  });

  // ============================================
  // Template Context Menu
  // ============================================

  ownerTest.describe('Context Menu', () => {
    let templateName: string;

    ownerTest.beforeEach(async () => {
      templateName = `Action ${Date.now()}`;
      await marketing.createTemplate({
        name: templateName,
        subject: 'Action Subject',
        html: TEST_HTML,
      });
    });

    ownerTest('context menu shows Edit, Duplicate, Delete', async ({ page }) => {
      await marketing.openTemplateMenu(templateName);

      await expect(page.locator(MarketingSelectors.templates.menuEdit)).toBeVisible({ timeout: 3000 });
      await expect(page.locator(MarketingSelectors.templates.menuDuplicate)).toBeVisible({ timeout: 3000 });
      await expect(page.locator(MarketingSelectors.templates.menuDelete)).toBeVisible({ timeout: 3000 });
    });

    ownerTest('Edit opens modal with pre-filled template name', async ({ page }) => {
      await marketing.editTemplate(templateName);

      const nameInput = page.locator(MarketingSelectors.templateModal.templateName);
      await expect(nameInput).toHaveValue(templateName);
    });

    ownerTest('Duplicate increases template count', async ({ page }) => {
      const countBefore = await marketing.getTemplateCountFromHeading();
      await marketing.duplicateTemplate(templateName);

      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      const countAfter = await marketing.getTemplateCountFromHeading();

      expect(countAfter).toBe(countBefore + 1);
    });

    ownerTest('Delete removes template from list', async ({ page }) => {
      const countBefore = await marketing.getTemplateCount();
      await marketing.deleteTemplate(templateName);

      // Verify template is gone from the list
      await expect(page.getByText(templateName).first())
        .not.toBeVisible({ timeout: 10000 });
    });
  });

  // ============================================
  // Modal Close Behavior
  // ============================================

  ownerTest.describe('Modal Close', () => {
    ownerTest('Cancel button closes modal without saving', async ({ page }) => {
      await marketing.clickCreateTemplate();
      await marketing.fillTemplateName('Should Not Save');
      await marketing.cancelTemplate();

      await expect(page.locator(MarketingSelectors.templateModal.dialog))
        .not.toBeVisible({ timeout: 3000 });
    });

    // NOTE: Escape key does NOT close the template modal (confirmed manually).
    // This is a potential UX bug — Escape should close modals per accessibility standards.
    // TODO: File GitHub issue for Escape key support in template modal.
    ownerTest.skip('Escape key closes modal — currently not supported', async ({ page }) => {
      await marketing.clickCreateTemplate();
      await expect(page.locator(MarketingSelectors.templateModal.dialog)).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator(MarketingSelectors.templateModal.dialog))
        .not.toBeVisible({ timeout: 3000 });
    });
  });
});
