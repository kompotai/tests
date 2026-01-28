/**
 * Agreement Template Tests
 *
 * Tests for creating agreement templates with various field types.
 * Covers the template editor functionality including:
 * - Template creation
 * - PDF upload
 * - Document field placement
 * - Signatory role creation
 * - Signatory field placement
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { AgreementTemplatesPage } from '@pages/AgreementTemplatesPage';
import { ContactsPage } from '@pages/ContactsPage';
import {
  createTestTemplate,
  DOCUMENT_FIELD_TYPES,
  SIGNATORY_FIELD_TYPES,
  TEST_CONTACTS,
} from './agreements.fixture';
import path from 'path';

const TEST_PDF_PATH = path.join(__dirname, '../../../fixtures/test-agreement.pdf');

ownerTest.describe('Agreement Templates', () => {
  let templatesPage: AgreementTemplatesPage;

  ownerTest.beforeEach(async ({ page }) => {
    templatesPage = new AgreementTemplatesPage(page);
    await templatesPage.goto();
  });

  // ============================================
  // Basic Template Creation
  // ============================================

  ownerTest.describe('Template Creation', () => {
    ownerTest('creates template with name only', async () => {
      const template = createTestTemplate({ name: `Minimal Template ${Date.now()}` });

      await templatesPage.createAndReturnToList(template);

      await templatesPage.shouldSeeTemplate(template.name);
    });

    ownerTest('creates template with all fields', async () => {
      const template = createTestTemplate({
        name: `Full Template ${Date.now()}`,
        type: 'contract',
        description: 'Test description for E2E testing',
      });

      await templatesPage.createAndReturnToList(template);

      await templatesPage.shouldSeeTemplate(template.name);
    });
  });

  // ============================================
  // Template Editor - PDF Upload
  // ============================================

  ownerTest.describe('Template Editor - PDF', () => {
    ownerTest('uploads PDF to template', async () => {
      // Create template with PDF - automatically redirects to editor
      const template = createTestTemplate({
        name: `PDF Upload Test ${Date.now()}`,
        pdfPath: TEST_PDF_PATH,
      });
      await templatesPage.create(template);

      // Verify PDF viewer is visible (PDF was uploaded during creation)
      const pdfVisible = await templatesPage.shouldSeePDFViewer();
      expect(pdfVisible).toBe(true);
    });
  });

  // ============================================
  // Template Editor - Document Fields
  // ============================================

  ownerTest.describe('Template Editor - Document Fields', () => {
    ownerTest('adds signature field to document', async () => {
      const template = createTestTemplate({
        name: `Doc Signature Test ${Date.now()}`,
        pdfPath: TEST_PDF_PATH,
      });
      await templatesPage.create(template);

      // Select document fields mode
      await templatesPage.selectDocumentFields();

      // Add signature field
      await templatesPage.addField('Signature');

      // Save template
      await templatesPage.save();
    });

    ownerTest('adds creation date field to document', async () => {
      const template = createTestTemplate({
        name: `Doc Date Test ${Date.now()}`,
        pdfPath: TEST_PDF_PATH,
      });
      await templatesPage.create(template);

      await templatesPage.selectDocumentFields();
      await templatesPage.addField('Creation Date');
      await templatesPage.save();
    });

    ownerTest('adds text and number fields to document', async () => {
      const template = createTestTemplate({
        name: `Doc Input Test ${Date.now()}`,
        pdfPath: TEST_PDF_PATH,
      });
      await templatesPage.create(template);

      await templatesPage.selectDocumentFields();

      // Add text field
      await templatesPage.addField('Text');

      // Add number field
      await templatesPage.addField('Number');

      await templatesPage.save();
    });
  });

  // ============================================
  // Template Editor - Signatory Roles
  // ============================================

  ownerTest.describe('Template Editor - Signatory Roles', () => {
    ownerTest('adds signatory role', async () => {
      const template = createTestTemplate({
        name: `Signatory Test ${Date.now()}`,
        pdfPath: TEST_PDF_PATH,
      });
      await templatesPage.create(template);

      // Add signatory
      await templatesPage.addSignatory();

      await templatesPage.save();
    });

    ownerTest('adds multiple signatory roles', async () => {
      const template = createTestTemplate({
        name: `Multi Signatory Test ${Date.now()}`,
        pdfPath: TEST_PDF_PATH,
      });
      await templatesPage.create(template);

      // Add first signatory
      await templatesPage.addSignatory();

      // Add second signatory
      await templatesPage.addSignatory();

      await templatesPage.save();
    });
  });

  // ============================================
  // Template Editor - Signatory Fields
  // ============================================

  ownerTest.describe('Template Editor - Signatory Fields', () => {
    ownerTest('adds signature field to signatory', async () => {
      const template = createTestTemplate({
        name: `Signer Signature Test ${Date.now()}`,
        pdfPath: TEST_PDF_PATH,
      });
      await templatesPage.create(template);

      // Add and select signatory
      await templatesPage.addSignatory();
      await templatesPage.selectSignatory('Signatory 1');

      // Add signature field
      await templatesPage.addField('Signature');

      await templatesPage.save();
    });

    ownerTest('adds contact data fields to signatory', async () => {
      const template = createTestTemplate({
        name: `Signer Contact Test ${Date.now()}`,
        pdfPath: TEST_PDF_PATH,
      });
      await templatesPage.create(template);

      await templatesPage.addSignatory();
      await templatesPage.selectSignatory('Signatory 1');

      // Add contact data fields
      await templatesPage.addField('Contact Name');
      await templatesPage.addField('Contact Email');

      await templatesPage.save();
    });

    ownerTest('adds date signed field to signatory', async () => {
      const template = createTestTemplate({
        name: `Signer Date Test ${Date.now()}`,
        pdfPath: TEST_PDF_PATH,
      });
      await templatesPage.create(template);

      await templatesPage.addSignatory();
      await templatesPage.selectSignatory('Signatory 1');

      await templatesPage.addField('Date Signed');

      await templatesPage.save();
    });
  });

  // ============================================
  // Full Template Setup
  // ============================================

  ownerTest.describe('Full Template Setup', () => {
    ownerTest('creates complete template with document and signatory fields', async () => {
      const template = createTestTemplate({
        name: `Complete Template ${Date.now()}`,
        pdfPath: TEST_PDF_PATH,
      });
      await templatesPage.create(template);

      // Add document fields
      await templatesPage.selectDocumentFields();
      await templatesPage.addField('Signature');
      await templatesPage.addField('Creation Date');

      // Add first signatory with fields
      await templatesPage.addSignatory();
      await templatesPage.selectSignatory('Signatory 1');
      await templatesPage.addField('Contact Name');
      await templatesPage.addField('Contact Email');
      await templatesPage.addField('Signature');
      await templatesPage.addField('Date Signed');

      // Add second signatory with fields
      await templatesPage.addSignatory();
      await templatesPage.selectSignatory('Signatory 2');
      await templatesPage.addField('Contact Name');
      await templatesPage.addField('Signature');

      await templatesPage.save();

      // Return to list and verify template exists
      await templatesPage.goto();
      await templatesPage.shouldSeeTemplate(template.name);
    });
  });
});
