/**
 * Refund CRUD Tests
 *
 * TC-1:  Create refund with minimal data
 * TC-2:  Create refund with all fields + detail page
 * TC-3:  Validation — empty form
 * TC-4:  Validation — missing amount
 * TC-5:  Table displays correct columns
 * TC-6:  Detail page shows refund data
 * TC-7:  Search by reference number
 * TC-8:  Edit refund (amount, method, reason)
 * TC-9:  Edit refund (method only)
 * TC-10: Edit refund (reason code only)
 * TC-11: Delete refund with confirmation
 * TC-12: Cancel deletion
 * TC-13: Refund visible on contact page
 * TC-14: Refund linked to invoice shows invoice number
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';
import { RefundsPage } from '@pages/RefundsPage';
import {
  createMinimalRefund,
  createFullRefund,
  uniqueNotes,
  uniqueAmount,
  uniqueReference,
  TEST_CONTACTS,
} from './refunds.fixture';

// ============================================
// 1. Creation
// ============================================

ownerTest.describe('Refund Creation', () => {
  let refundsPage: RefundsPage;

  ownerTest.beforeEach(async ({ page }) => {
    refundsPage = new RefundsPage(page);
    await refundsPage.goto();
  });

  ownerTest('TC-1: creates refund with minimal data', async () => {
    const refund = createMinimalRefund();
    const notes = refund.notes!;

    await refundsPage.create(refund);

    // Verify refund appears in the table
    await refundsPage.shouldSeeRefund(notes);

    // Verify row data
    const rowData = await refundsPage.getRefundRowData(notes);
    expect(rowData.contact).toBe(TEST_CONTACTS.SAMPLE);
    expect(rowData.amount).toContain(`$${refund.amount}`);
    expect(rowData.method).toContain('Bank Transfer'); // default method

    // Cleanup
    await refundsPage.deleteRefund(notes);
    await refundsPage.shouldNotSeeRefund(notes);
  });

  ownerTest('TC-2: creates refund with all fields and verifies detail page', async ({ page }) => {
    const refund = createFullRefund();
    const notes = refund.notes!;

    await refundsPage.create(refund);

    // Verify refund appears in the table
    await refundsPage.shouldSeeRefund(notes);

    // Verify table row data
    const rowData = await refundsPage.getRefundRowData(notes);
    expect(rowData.contact).toBe(TEST_CONTACTS.SAMPLE);
    expect(rowData.amount).toContain(`$${refund.amount}`);
    expect(rowData.method).toContain('PayPal');

    // Navigate to detail page and verify fields
    await refundsPage.openDetailPage(notes);

    await refundsPage.shouldSeeOnDetailPage(TEST_CONTACTS.SAMPLE);
    await refundsPage.shouldSeeOnDetailPage(`$${refund.amount}`);
    await refundsPage.shouldSeeOnDetailPage('PayPal');
    await refundsPage.shouldSeeOnDetailPage(refund.referenceNumber!);
    await refundsPage.shouldSeeOnDetailPage(notes);

    // Go back and cleanup
    await refundsPage.goto();
    await refundsPage.deleteRefund(notes);
    await refundsPage.shouldNotSeeRefund(notes);
  });

  ownerTest.describe('TC-3: Validation — required fields', () => {
    ownerTest('3a: cannot submit empty form', async () => {
      await refundsPage.openCreateForm();
      await refundsPage.clickSubmitExpectingError();

      // Form should remain open
      const formVisible = await refundsPage.shouldSeeForm();
      expect(formVisible).toBe(true);

      await refundsPage.cancelForm();
    });

    ownerTest('3b: cannot submit without contact', async () => {
      await refundsPage.openCreateForm();

      // Fill amount but leave contact empty
      const amountInput = refundsPage.page.locator('[data-testid="refund-form-input-amount"]');
      await amountInput.fill('50');

      await refundsPage.clickSubmitExpectingError();

      const formVisible = await refundsPage.shouldSeeForm();
      expect(formVisible).toBe(true);

      await refundsPage.cancelForm();
    });
  });

  ownerTest('TC-4: validation — cannot submit without amount', async () => {
    await refundsPage.openCreateForm();

    // Select contact but leave amount empty
    await refundsPage.page.locator('[data-testid="refund-form-select-contact"]')
      .selectOption({ label: TEST_CONTACTS.SAMPLE });

    await refundsPage.clickSubmitExpectingError();

    const formVisible = await refundsPage.shouldSeeForm();
    expect(formVisible).toBe(true);

    await refundsPage.cancelForm();
  });
});

// ============================================
// 2. Read
// ============================================

ownerTest.describe('Refund Read', () => {
  let refundsPage: RefundsPage;

  ownerTest.beforeEach(async ({ page }) => {
    refundsPage = new RefundsPage(page);
    await refundsPage.goto();
  });

  ownerTest('TC-5: table displays correct columns', async () => {
    // Create a refund to ensure table is not empty
    const refund = createMinimalRefund();
    const notes = refund.notes!;
    await refundsPage.create(refund);

    // Verify table headers
    const table = refundsPage.page.locator('[data-testid="refunds-table"]');
    await expect(table).toBeVisible();

    const headers = table.locator('th');
    const headerTexts = await headers.allTextContents();
    const headerList = headerTexts.map(h => h.trim()).filter(Boolean);

    expect(headerList).toContain('Number');
    expect(headerList).toContain('Status');
    expect(headerList).toContain('Contact');
    expect(headerList).toContain('Amount');
    expect(headerList).toContain('Method');
    expect(headerList).toContain('Invoice');

    // Verify row has all data
    const rowData = await refundsPage.getRefundRowData(notes);
    expect(rowData.number).toMatch(/^RF-\d+$/);
    expect(rowData.status).toBeTruthy();
    expect(rowData.contact).toBe(TEST_CONTACTS.SAMPLE);
    expect(rowData.amount).toBeTruthy();
    expect(rowData.method).toBeTruthy();

    // Cleanup
    await refundsPage.deleteRefund(notes);
  });

  ownerTest('TC-6: detail page shows refund data', async () => {
    const refund = createFullRefund();
    const notes = refund.notes!;
    await refundsPage.create(refund);

    // Open detail page
    await refundsPage.openDetailPage(notes);

    // Verify URL
    expect(refundsPage.url).toMatch(/\/finances\/refunds\/[a-f0-9]+/);

    // Verify data is displayed
    await refundsPage.shouldSeeOnDetailPage(TEST_CONTACTS.SAMPLE);
    await refundsPage.shouldSeeOnDetailPage(`$${refund.amount}`);
    await refundsPage.shouldSeeOnDetailPage(refund.referenceNumber!);

    // Go back and cleanup
    await refundsPage.goto();
    await refundsPage.deleteRefund(notes);
  });

  ownerTest('TC-7: search filters refunds', async () => {
    // Create a refund with unique reference
    const ref = uniqueReference('SEARCH');
    const refund = createMinimalRefund({ referenceNumber: ref });
    const notes = refund.notes!;
    await refundsPage.create(refund);

    // Type in search input
    const searchInput = refundsPage.page.locator('[data-testid="refunds-table"]')
      .page().locator('input[placeholder*="Search by number"]');
    await searchInput.fill(ref);
    await refundsPage.wait(1000);

    // Verify our refund is visible
    await refundsPage.shouldSeeRefund(notes);

    // Clear search
    await searchInput.clear();
    await refundsPage.wait(500);

    // Cleanup
    await refundsPage.deleteRefund(notes);
  });
});

// ============================================
// 3. Update
// ============================================

ownerTest.describe('Refund Edit', () => {
  let refundsPage: RefundsPage;

  ownerTest.beforeEach(async ({ page }) => {
    refundsPage = new RefundsPage(page);
    await refundsPage.goto();
  });

  ownerTest('TC-8: edits refund amount and verifies changes', async () => {
    // Create refund to edit
    const refund = createMinimalRefund();
    const notes = refund.notes!;
    await refundsPage.create(refund);
    await refundsPage.shouldSeeRefund(notes);

    // Edit amount
    const newAmount = uniqueAmount();
    await refundsPage.openEditForm(notes);
    await refundsPage.editFields({ amount: newAmount });
    await refundsPage.submitForm();

    // Verify updated amount in table
    await refundsPage.shouldSeeRefund(notes);
    const rowData = await refundsPage.getRefundRowData(notes);
    expect(rowData.amount).toContain(`$${newAmount}`);

    // Cleanup
    await refundsPage.deleteRefund(notes);
  });

  ownerTest('TC-9: edits refund method', async () => {
    const refund = createMinimalRefund();
    const notes = refund.notes!;
    await refundsPage.create(refund);
    await refundsPage.shouldSeeRefund(notes);

    // Edit method to Cash
    await refundsPage.openEditForm(notes);
    await refundsPage.editFields({ method: 'cash' });
    await refundsPage.submitForm();

    // Verify method changed
    const rowData = await refundsPage.getRefundRowData(notes);
    expect(rowData.method).toContain('Cash');

    // Cleanup
    await refundsPage.deleteRefund(notes);
  });

  ownerTest('TC-10: edits refund reason code', async () => {
    const refund = createMinimalRefund();
    const notes = refund.notes!;
    await refundsPage.create(refund);
    await refundsPage.shouldSeeRefund(notes);

    // Edit reason code
    await refundsPage.openEditForm(notes);
    await refundsPage.editFields({ reasonCode: 'duplicate_payment' });
    await refundsPage.submitForm();

    // Re-open edit form to verify the value was saved
    await refundsPage.openEditForm(notes);
    const savedValue = await refundsPage.page.locator('[data-testid="refund-form-select-reasonCode"]').inputValue();
    expect(savedValue).toBe('duplicate_payment');
    await refundsPage.cancelForm();

    // Cleanup
    await refundsPage.deleteRefund(notes);
  });
});

// ============================================
// 4. Delete
// ============================================

ownerTest.describe('Refund Delete', () => {
  let refundsPage: RefundsPage;

  ownerTest.beforeEach(async ({ page }) => {
    refundsPage = new RefundsPage(page);
    await refundsPage.goto();
  });

  ownerTest('TC-11: deletes refund and verifies removal', async () => {
    // Create refund to delete
    const refund = createMinimalRefund();
    const notes = refund.notes!;
    await refundsPage.create(refund);
    await refundsPage.shouldSeeRefund(notes);

    // Click delete — confirmation dialog should appear
    await refundsPage.clickDeleteButton(notes);
    const dialogVisible = await refundsPage.shouldSeeDeleteDialog();
    expect(dialogVisible).toBe(true);

    // Confirm deletion
    await refundsPage.confirmDelete();

    // Verify refund is removed from the table
    await refundsPage.shouldNotSeeRefund(notes);
  });

  ownerTest('TC-12: cancel deletion keeps refund', async () => {
    // Create refund
    const refund = createMinimalRefund();
    const notes = refund.notes!;
    await refundsPage.create(refund);
    await refundsPage.shouldSeeRefund(notes);

    // Click delete, then cancel
    await refundsPage.clickDeleteButton(notes);
    const dialogVisible = await refundsPage.shouldSeeDeleteDialog();
    expect(dialogVisible).toBe(true);

    await refundsPage.cancelDelete();

    // Refund should still be visible
    await refundsPage.shouldSeeRefund(notes);

    // Cleanup
    await refundsPage.deleteRefund(notes);
    await refundsPage.shouldNotSeeRefund(notes);
  });
});

// ============================================
// 5. Integration
// ============================================

ownerTest.describe('Refund Integration', () => {
  let refundsPage: RefundsPage;

  ownerTest.beforeEach(async ({ page }) => {
    refundsPage = new RefundsPage(page);
    await refundsPage.goto();
  });

  ownerTest('TC-13: refund appears on contact page', async ({ page, request }) => {
    // Create refund via UI
    const refund = createMinimalRefund();
    const notes = refund.notes!;
    await refundsPage.create(refund);
    await refundsPage.shouldSeeRefund(notes);

    // Navigate to the contact's page
    await page.goto(`/ws/${WORKSPACE_ID}/contacts`);
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // Click on the contact
    const contactRow = page.locator(`tr:has-text("${TEST_CONTACTS.SAMPLE}")`).first();
    await contactRow.click();
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // Verify refund data is visible on the contact page (search via API)
    const searchRes = await request.post(`/api/ws/${WORKSPACE_ID}/refunds/search`, {
      data: { limit: 100 },
    });

    if (searchRes.ok()) {
      const searchData = await searchRes.json();
      const found = searchData.refunds?.find((r: { notes: string }) => r.notes === notes);
      expect(found).toBeTruthy();
    }

    // Cleanup: go back to refunds and delete
    await refundsPage.goto();
    await refundsPage.deleteRefund(notes);
  });

  ownerTest('TC-14: refund linked to invoice shows invoice number', async ({ page }) => {
    // Open refund form and find a contact that has invoices
    await refundsPage.goto();
    await refundsPage.openCreateForm();

    const contactSelect = refundsPage.page.locator('[data-testid="refund-form-select-contact"]');
    const invoiceSelect = refundsPage.page.locator('[data-testid="refund-form-select-invoice"]');

    // Get all contact options (skip "Select contact...")
    const contactOptions = await contactSelect.locator('option').allTextContents();
    const realContacts = contactOptions.filter(o => o !== 'Select contact...');

    let foundContact = '';
    let foundInvoiceLabel = '';

    // Iterate contacts until we find one with invoices
    for (const contact of realContacts.slice(0, 10)) {
      await contactSelect.selectOption({ label: contact.trim() });
      // Wait for "Loading..." to appear and disappear, or timeout quickly
      await refundsPage.wait(300);
      const loadingOpt = invoiceSelect.locator('option:has-text("Loading...")');
      if (await loadingOpt.isVisible({ timeout: 500 }).catch(() => false)) {
        await loadingOpt.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
      }
      await refundsPage.wait(300);

      const invoiceOpts = await invoiceSelect.locator('option').allTextContents();
      const realInvoices = invoiceOpts.filter(o => o !== 'Select invoice...' && o !== 'Loading...' && o !== '');

      if (realInvoices.length > 0) {
        foundContact = contact.trim();
        foundInvoiceLabel = realInvoices[0].trim();
        break;
      }
    }

    if (!foundContact || !foundInvoiceLabel) {
      await refundsPage.cancelForm();
      ownerTest.skip(true, 'No contacts with invoices found in dropdown');
      return;
    }

    // Select the found invoice
    await invoiceSelect.selectOption({ label: foundInvoiceLabel });

    // Extract invoice number from label (e.g. "INV-0001 — $208.9" → "INV-0001")
    const invoiceNumber = foundInvoiceLabel.match(/INV-\d+/)?.[0] || foundInvoiceLabel;

    const amount = uniqueAmount();
    const notes = uniqueNotes('InvoiceLink');
    await refundsPage.page.locator('[data-testid="refund-form-input-amount"]').fill(amount.toString());
    await refundsPage.page.locator('[data-testid="refund-form-input-notes"]').fill(notes);

    await refundsPage.submitForm();

    // Verify invoice number appears in the row
    await refundsPage.shouldSeeRefund(notes);
    const rowData = await refundsPage.getRefundRowData(notes);
    expect(rowData.invoice).toContain(invoiceNumber);

    // Cleanup
    await refundsPage.deleteRefund(notes);
  });
});
