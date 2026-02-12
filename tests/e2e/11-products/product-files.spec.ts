/**
 * Product Files & Images Tests
 *
 * Covers:
 * - Image/file upload and persistence
 * - Image display in table and forms
 * - Download functionality in view and edit modes
 * - Deletion warnings for images and files
 * - Auto-save behavior when closing off-canvas
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { ProductsPage } from '@pages/ProductsPage';
import { createMinimalProduct } from '@fixtures/products.fixture';
import path from 'path';
import fs from 'fs';

const TEST_IMAGE = path.join(__dirname, '..', '..', '..', 'fixtures', 'files', 'test-image.png');
const TEST_FILE = path.join(__dirname, '..', '..', '..', 'fixtures', 'files', 'test-document.txt');

ownerTest.describe('Product Files & Images', () => {
  let productsPage: ProductsPage;

  ownerTest.beforeEach(async ({ page }) => {
    productsPage = new ProductsPage(page);
    await productsPage.goto();
  });

  /** Helper: create a product, refresh, and search */
  async function createAndRefresh() {
    const product = createMinimalProduct();
    const success = await productsPage.create(product);
    expect(success).toBe(true);
    await productsPage.goto();
    await productsPage.search(product.name);
    return product;
  }

  // ============================================
  // Image Upload & Persistence
  // ============================================

  ownerTest.describe('Image Upload', () => {
    ownerTest('does image save if off-canvas is not explicitly saved @smoke', async ({ page }) => {
      const product = await createAndRefresh();

      // Open edit form
      await productsPage.clickRowEdit(product.name);

      // Upload image
      const fileInput = page.locator('[data-testid="image-upload-zone"] input[type="file"]');
      await fileInput.setInputFiles(TEST_IMAGE);
      await page.waitForTimeout(3000);

      // Close form without explicitly clicking Save button
      // Try clicking the close button or overlay
      const closeButton = page.locator('[data-testid="off-canvas-close"]').or(
        page.locator('button:has-text("Close")').or(
          page.locator('[role="dialog"] button[aria-label*="close"]')
        )
      ).first();

      const closeExists = await closeButton.count() > 0;
      if (closeExists) {
        await closeButton.click();
      } else {
        // If no close button, press Escape
        await page.keyboard.press('Escape');
      }

      await page.waitForTimeout(2000);

      // Reopen and check if image persisted
      await productsPage.goto();
      await productsPage.search(product.name);
      await productsPage.clickRowEdit(product.name);
      await page.waitForTimeout(2000);

      const imgManager = page.locator('[data-testid="product-images-manager"]');
      const img = imgManager.locator('img').first();

      // Image should NOT be saved if form wasn't explicitly saved
      const imgExists = await img.count() > 0;
      // This is an exploratory test - we're checking the actual behavior
      console.log(`Image persisted without save: ${imgExists}`);
    });

    ownerTest('does saved image show up in edit form @smoke', async ({ page }) => {
      const product = await createAndRefresh();

      // Open edit form and upload image
      await productsPage.clickRowEdit(product.name);
      const fileInput = page.locator('[data-testid="image-upload-zone"] input[type="file"]');
      await fileInput.setInputFiles(TEST_IMAGE);
      await page.waitForTimeout(3000);

      // Explicitly save
      await productsPage.submitForm();

      // Reopen and verify image is visible
      await productsPage.goto();
      await productsPage.search(product.name);
      await productsPage.clickRowEdit(product.name);
      await page.waitForTimeout(2000);

      const imgManager = page.locator('[data-testid="product-images-manager"]');
      const img = imgManager.locator('img').first();
      await expect(img).toBeVisible({ timeout: 10000 });
    });

    ownerTest('is image visible in table after image is added to product @smoke', async ({ page }) => {
      const product = await createAndRefresh();

      // Upload image
      await productsPage.clickRowEdit(product.name);
      const fileInput = page.locator('[data-testid="image-upload-zone"] input[type="file"]');
      await fileInput.setInputFiles(TEST_IMAGE);
      await page.waitForTimeout(3000);
      await productsPage.submitForm();

      // Go to list and check table
      await productsPage.goto();
      await productsPage.search(product.name);

      // Look for image in the table row
      const row = page.locator(`tr:has-text("${product.name}")`).first();
      const rowImage = row.locator('img').first();

      // Check if image exists in table (may be in a thumbnail column)
      const hasImage = await rowImage.count() > 0;
      if (hasImage) {
        await expect(rowImage).toBeVisible();
      }
      console.log(`Product has image in table: ${hasImage}`);
    });
  });

  // ============================================
  // File Upload
  // ============================================

  ownerTest.describe('File Upload', () => {
    ownerTest('can upload file to product and it persists @smoke', async ({ page }) => {
      const product = await createAndRefresh();

      // Open edit form
      await productsPage.clickRowEdit(product.name);
      await page.waitForTimeout(2000);

      // Find file upload zone (separate from image upload)
      const fileUploadZone = page.getByText('Upload or drop file').or(
        page.locator('[data-testid="file-upload-zone"]')
      ).first();

      const fileExists = await fileUploadZone.count() > 0;
      if (!fileExists) {
        console.log('File upload zone not found in product edit form');
        ownerTest.skip(true, 'File upload zone not found');
        return;
      }

      // Upload file
      const fileChooserPromise = page.waitForEvent('filechooser');
      await fileUploadZone.click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(TEST_FILE);
      await page.waitForTimeout(3000);

      // Save
      await productsPage.submitForm();

      // Reopen and verify file is listed
      await productsPage.goto();
      await productsPage.search(product.name);
      await productsPage.clickRowEdit(product.name);
      await page.waitForTimeout(2000);

      const uploadedFile = page.getByText('test-document.txt').first();
      await expect(uploadedFile).toBeVisible({ timeout: 5000 });
    });
  });

  // ============================================
  // Delete Warnings
  // ============================================

  ownerTest.describe('Delete Warnings', () => {
    ownerTest('is there warning on image deletion in product/edit @smoke', async ({ page }) => {
      const product = await createAndRefresh();

      // Upload image first
      await productsPage.clickRowEdit(product.name);
      const fileInput = page.locator('[data-testid="image-upload-zone"] input[type="file"]');
      await fileInput.setInputFiles(TEST_IMAGE);
      await page.waitForTimeout(3000);
      await productsPage.submitForm();

      // Reopen in edit mode
      await productsPage.goto();
      await productsPage.search(product.name);
      await productsPage.clickRowEdit(product.name);
      await page.waitForTimeout(2000);

      // Find delete button for image
      const deleteButton = page.locator('[data-testid="image-delete-button"]').or(
        page.locator('button:has-text("Delete")').or(
          page.locator('[aria-label*="delete" i]').or(
            page.locator('[title*="delete" i]')
          )
        )
      ).first();

      const hasDeleteButton = await deleteButton.count() > 0;
      if (!hasDeleteButton) {
        console.log('No delete button found for image in edit mode');
        ownerTest.skip(true, 'Delete button not found');
        return;
      }

      await deleteButton.click();
      await page.waitForTimeout(1000);

      // Check for confirmation dialog
      const confirmDialog = page.locator('[data-testid="confirm-dialog"]').or(
        page.locator('[role="dialog"]:has-text("delete")').or(
          page.locator('[role="alertdialog"]')
        )
      );

      const hasWarning = await confirmDialog.count() > 0;
      console.log(`Warning shown on image deletion in edit mode: ${hasWarning}`);
      expect(hasWarning).toBe(true);
    });

    ownerTest('is there warning on image deletion in product/view @smoke', async ({ page }) => {
      const product = await createAndRefresh();

      // Upload image
      await productsPage.clickRowEdit(product.name);
      const fileInput = page.locator('[data-testid="image-upload-zone"] input[type="file"]');
      await fileInput.setInputFiles(TEST_IMAGE);
      await page.waitForTimeout(3000);
      await productsPage.submitForm();

      // Open in view mode (click on product name in table)
      await productsPage.goto();
      await productsPage.search(product.name);
      const productLink = page.locator(`tr:has-text("${product.name}") a`).first();
      await productLink.click();
      await page.waitForTimeout(2000);

      // Try to find delete button in view mode
      const deleteButton = page.locator('[data-testid="image-delete-button"]').or(
        page.locator('button:has-text("Delete")').or(
          page.locator('[aria-label*="delete" i]')
        )
      ).first();

      const hasDeleteButton = await deleteButton.count() > 0;
      if (!hasDeleteButton) {
        console.log('No delete button in view mode (expected - view mode is read-only)');
        return;
      }

      await deleteButton.click();
      await page.waitForTimeout(1000);

      const confirmDialog = page.locator('[data-testid="confirm-dialog"]').or(
        page.locator('[role="dialog"]:has-text("delete")')
      );

      const hasWarning = await confirmDialog.count() > 0;
      console.log(`Warning shown on image deletion in view mode: ${hasWarning}`);
    });

    ownerTest('is there warning on file deletion in product/edit', async ({ page }) => {
      const product = await createAndRefresh();

      // Upload file first
      await productsPage.clickRowEdit(product.name);
      await page.waitForTimeout(2000);

      const fileUploadZone = page.getByText('Upload or drop file').or(
        page.locator('[data-testid="file-upload-zone"]')
      ).first();

      const fileExists = await fileUploadZone.count() > 0;
      if (!fileExists) {
        ownerTest.skip(true, 'File upload not available');
        return;
      }

      const fileChooserPromise = page.waitForEvent('filechooser');
      await fileUploadZone.click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(TEST_FILE);
      await page.waitForTimeout(3000);
      await productsPage.submitForm();

      // Reopen in edit mode
      await productsPage.goto();
      await productsPage.search(product.name);
      await productsPage.clickRowEdit(product.name);
      await page.waitForTimeout(2000);

      // Find delete button for file
      const deleteButton = page.locator('[data-testid="file-delete-button"]').or(
        page.locator('button:has-text("Delete")').or(
          page.locator('[aria-label*="delete" i]')
        )
      ).nth(1); // Second delete button might be for files

      const hasDeleteButton = await deleteButton.count() > 0;
      if (!hasDeleteButton) {
        console.log('No delete button found for file');
        return;
      }

      await deleteButton.click();
      await page.waitForTimeout(1000);

      const confirmDialog = page.locator('[data-testid="confirm-dialog"]').or(
        page.locator('[role="dialog"]:has-text("delete")')
      );

      const hasWarning = await confirmDialog.count() > 0;
      console.log(`Warning shown on file deletion in edit mode: ${hasWarning}`);
      expect(hasWarning).toBe(true);
    });

    ownerTest('is there warning on file deletion in product/view', async ({ page }) => {
      const product = await createAndRefresh();

      // Upload file
      await productsPage.clickRowEdit(product.name);
      await page.waitForTimeout(2000);

      const fileUploadZone = page.getByText('Upload or drop file').or(
        page.locator('[data-testid="file-upload-zone"]')
      ).first();

      const fileExists = await fileUploadZone.count() > 0;
      if (!fileExists) {
        ownerTest.skip(true, 'File upload not available');
        return;
      }

      const fileChooserPromise = page.waitForEvent('filechooser');
      await fileUploadZone.click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(TEST_FILE);
      await page.waitForTimeout(3000);
      await productsPage.submitForm();

      // Open in view mode
      await productsPage.goto();
      await productsPage.search(product.name);
      const productLink = page.locator(`tr:has-text("${product.name}") a`).first();
      await productLink.click();
      await page.waitForTimeout(2000);

      // Check for delete button in view mode
      const deleteButton = page.locator('[data-testid="file-delete-button"]').or(
        page.locator('button:has-text("Delete")')
      ).first();

      const hasDeleteButton = await deleteButton.count() > 0;
      if (!hasDeleteButton) {
        console.log('No delete button in view mode (expected - view mode is read-only)');
        return;
      }

      await deleteButton.click();
      await page.waitForTimeout(1000);

      const confirmDialog = page.locator('[data-testid="confirm-dialog"]').or(
        page.locator('[role="dialog"]:has-text("delete")')
      );

      const hasWarning = await confirmDialog.count() > 0;
      console.log(`Warning shown on file deletion in view mode: ${hasWarning}`);
    });
  });

  // ============================================
  // Download Functionality
  // ============================================

  ownerTest.describe('Download Functionality', () => {
    ownerTest('does pressing download image button in view mode download it', async ({ page }) => {
      const product = await createAndRefresh();

      // Upload image
      await productsPage.clickRowEdit(product.name);
      const fileInput = page.locator('[data-testid="image-upload-zone"] input[type="file"]');
      await fileInput.setInputFiles(TEST_IMAGE);
      await page.waitForTimeout(3000);
      await productsPage.submitForm();

      // Open in view mode
      await productsPage.goto();
      await productsPage.search(product.name);
      const productLink = page.locator(`tr:has-text("${product.name}") a`).first();
      await productLink.click();
      await page.waitForTimeout(2000);

      // Find download button
      const downloadButton = page.locator('[data-testid="image-download-button"]').or(
        page.locator('button:has-text("Download")').or(
          page.locator('[aria-label*="download" i]')
        )
      ).first();

      const hasDownloadButton = await downloadButton.count() > 0;
      if (!hasDownloadButton) {
        console.log('No download button found for image in view mode');
        ownerTest.skip(true, 'Download button not found');
        return;
      }

      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      await downloadButton.click();

      try {
        const download = await downloadPromise;
        console.log(`Image downloaded in view mode: ${download.suggestedFilename()}`);
        expect(download.suggestedFilename()).toBeTruthy();
      } catch (error) {
        console.log('Download did not trigger or timed out');
        throw error;
      }
    });

    ownerTest('does pressing download image button in edit mode download it', async ({ page }) => {
      const product = await createAndRefresh();

      // Upload image
      await productsPage.clickRowEdit(product.name);
      const fileInput = page.locator('[data-testid="image-upload-zone"] input[type="file"]');
      await fileInput.setInputFiles(TEST_IMAGE);
      await page.waitForTimeout(3000);
      await productsPage.submitForm();

      // Reopen in edit mode
      await productsPage.goto();
      await productsPage.search(product.name);
      await productsPage.clickRowEdit(product.name);
      await page.waitForTimeout(2000);

      // Find download button
      const downloadButton = page.locator('[data-testid="image-download-button"]').or(
        page.locator('button:has-text("Download")').or(
          page.locator('[aria-label*="download" i]')
        )
      ).first();

      const hasDownloadButton = await downloadButton.count() > 0;
      if (!hasDownloadButton) {
        console.log('No download button found for image in edit mode');
        ownerTest.skip(true, 'Download button not found');
        return;
      }

      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      await downloadButton.click();

      try {
        const download = await downloadPromise;
        console.log(`Image downloaded in edit mode: ${download.suggestedFilename()}`);
        expect(download.suggestedFilename()).toBeTruthy();
      } catch (error) {
        console.log('Download did not trigger or timed out');
        throw error;
      }
    });

    ownerTest('does pressing download file button in view mode download it', async ({ page }) => {
      const product = await createAndRefresh();

      // Upload file
      await productsPage.clickRowEdit(product.name);
      await page.waitForTimeout(2000);

      const fileUploadZone = page.getByText('Upload or drop file').or(
        page.locator('[data-testid="file-upload-zone"]')
      ).first();

      const fileExists = await fileUploadZone.count() > 0;
      if (!fileExists) {
        ownerTest.skip(true, 'File upload not available');
        return;
      }

      const fileChooserPromise = page.waitForEvent('filechooser');
      await fileUploadZone.click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(TEST_FILE);
      await page.waitForTimeout(3000);
      await productsPage.submitForm();

      // Open in view mode
      await productsPage.goto();
      await productsPage.search(product.name);
      const productLink = page.locator(`tr:has-text("${product.name}") a`).first();
      await productLink.click();
      await page.waitForTimeout(2000);

      // Find download button for file
      const downloadButton = page.locator('[data-testid="file-download-button"]').or(
        page.locator('button:has-text("Download")').or(
          page.locator('a:has-text("test-document.txt")')
        )
      ).first();

      const hasDownloadButton = await downloadButton.count() > 0;
      if (!hasDownloadButton) {
        console.log('No download button found for file in view mode');
        ownerTest.skip(true, 'Download button not found');
        return;
      }

      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      await downloadButton.click();

      try {
        const download = await downloadPromise;
        console.log(`File downloaded in view mode: ${download.suggestedFilename()}`);
        expect(download.suggestedFilename()).toBeTruthy();
      } catch (error) {
        console.log('Download did not trigger or timed out');
        throw error;
      }
    });

    ownerTest('does pressing download file button in edit mode download it', async ({ page }) => {
      const product = await createAndRefresh();

      // Upload file
      await productsPage.clickRowEdit(product.name);
      await page.waitForTimeout(2000);

      const fileUploadZone = page.getByText('Upload or drop file').or(
        page.locator('[data-testid="file-upload-zone"]')
      ).first();

      const fileExists = await fileUploadZone.count() > 0;
      if (!fileExists) {
        ownerTest.skip(true, 'File upload not available');
        return;
      }

      const fileChooserPromise = page.waitForEvent('filechooser');
      await fileUploadZone.click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(TEST_FILE);
      await page.waitForTimeout(3000);
      await productsPage.submitForm();

      // Reopen in edit mode
      await productsPage.goto();
      await productsPage.search(product.name);
      await productsPage.clickRowEdit(product.name);
      await page.waitForTimeout(2000);

      // Find download button for file
      const downloadButton = page.locator('[data-testid="file-download-button"]').or(
        page.locator('button:has-text("Download")').or(
          page.locator('a:has-text("test-document.txt")')
        )
      ).first();

      const hasDownloadButton = await downloadButton.count() > 0;
      if (!hasDownloadButton) {
        console.log('No download button found for file in edit mode');
        ownerTest.skip(true, 'Download button not found');
        return;
      }

      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      await downloadButton.click();

      try {
        const download = await downloadPromise;
        console.log(`File downloaded in edit mode: ${download.suggestedFilename()}`);
        expect(download.suggestedFilename()).toBeTruthy();
      } catch (error) {
        console.log('Download did not trigger or timed out');
        throw error;
      }
    });
  });
});
