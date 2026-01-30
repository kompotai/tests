/**
 * Regression Test: Issue #154
 * Bug: Invoice upload file does not work
 *
 * Problem: File upload to invoices, estimates, and expenses failed with validation error
 * because 'estimate' and 'expense' entity types were missing from the Zod schema
 * and Mongoose enum for linkedTo.entityType.
 *
 * Fix: Added 'estimate' and 'expense' to:
 * - modules/workspace/file/validation.ts (linkedEntityTypeSchema)
 * - modules/workspace/file/model.ts (LinkedEntityType type and LinkedEntitySchema enum)
 *
 * @see https://github.com/kompotai/bug-reports/issues/154
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import path from 'path';
import fs from 'fs';

// Test file paths
const TEST_FILES_DIR = path.join(__dirname, '..', '..', '..', 'fixtures', 'files');
const TEST_FILE = path.join(TEST_FILES_DIR, 'test-document.txt');

ownerTest.describe('Issue #154: Invoice File Upload', () => {
  ownerTest.beforeAll(async () => {
    // Create test file if it doesn't exist
    if (!fs.existsSync(TEST_FILES_DIR)) {
      fs.mkdirSync(TEST_FILES_DIR, { recursive: true });
    }
    if (!fs.existsSync(TEST_FILE)) {
      fs.writeFileSync(TEST_FILE, 'Test file for invoice upload regression test');
    }
  });

  ownerTest('can upload file to invoice @regression @smoke', async ({ page }) => {
    // Navigate to invoices
    await page.goto('/ws/finances/invoices');
    await page.waitForLoadState('networkidle');

    // Check if there are any invoices
    const invoiceLink = page.locator('table tbody tr:first-child td:first-child a');
    const hasInvoices = await invoiceLink.count() > 0;

    if (!hasInvoices) {
      // Skip if no invoices exist - this is a regression test, not a creation test
      ownerTest.skip(true, 'No invoices exist in the workspace');
      return;
    }

    // Open first invoice
    await invoiceLink.click();
    await page.waitForLoadState('networkidle');

    // Find the Files section and upload zone
    const uploadZone = page.getByText('Upload or drop file');
    await expect(uploadZone).toBeVisible({ timeout: 10000 });

    // Set up file chooser listener
    const fileChooserPromise = page.waitForEvent('filechooser');
    await uploadZone.click();
    const fileChooser = await fileChooserPromise;

    // Upload the test file
    await fileChooser.setFiles(TEST_FILE);

    // Wait for upload to complete - check for success indicator or file in list
    // The component shows "Uploaded!" text briefly, then the file appears in the list
    await page.waitForTimeout(3000);

    // Verify no error message is shown
    const errorMessage = page.locator('text=Upload failed');
    await expect(errorMessage).not.toBeVisible();

    // Verify the file appears in the list (check for the filename)
    const uploadedFile = page.getByText('test-document.txt');
    await expect(uploadedFile).toBeVisible({ timeout: 5000 });
  });
});
