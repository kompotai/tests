/**
 * Payment Access Tests
 *
 * Tests for verifying access to payment pages.
 * Tests navigation between invoices and payments sections.
 */

import { accountantTest, expect } from '@fixtures/auth.fixture';
import { InvoicesPage, PaymentsPage } from '@pages/index';

accountantTest.describe('Payment Access', () => {
  accountantTest.describe('Page Access', () => {
    accountantTest('can open payments page', async ({ page }) => {
      const paymentsPage = new PaymentsPage(page);

      await paymentsPage.goto();
      await paymentsPage.waitForPageLoad();

      // Verify page loaded - check for header
      const header = await paymentsPage.getPageHeader();
      expect(header).toBeTruthy();

      // Verify we're on the correct page
      expect(page.url()).toContain('/finances/payments');
    });

    accountantTest('payments page shows table or empty state', async ({ page }) => {
      const paymentsPage = new PaymentsPage(page);

      await paymentsPage.goto();
      await paymentsPage.waitForPageLoad();

      // Page should show either a table with payments or empty state
      const hasTable = await paymentsPage.shouldSeeTable();
      const hasPayments = await paymentsPage.hasPayments();

      if (hasTable && hasPayments) {
        const rowCount = await paymentsPage.getRowCount();
        expect(rowCount).toBeGreaterThan(0);
      } else {
        // Empty state should be visible
        await paymentsPage.shouldSeeEmptyState();
      }
    });
  });

  accountantTest.describe('Invoice to Payments Navigation', () => {
    accountantTest('can navigate from invoice to payments page', async ({ page }) => {
      const invoicesPage = new InvoicesPage(page);
      const paymentsPage = new PaymentsPage(page);

      // Step 1: Navigate to invoices list
      await invoicesPage.goto();
      await invoicesPage.waitForPageLoad();

      // Step 2: Verify invoices table is displayed
      const hasTable = await invoicesPage.shouldSeeTable();
      expect(hasTable).toBe(true);

      // Step 3: Check if there are any invoices
      const hasInvoices = await invoicesPage.hasInvoices();
      if (!hasInvoices) {
        accountantTest.skip();
        return;
      }

      // Step 4: Open first invoice
      const invoiceId = await invoicesPage.openFirstInvoice();
      expect(invoiceId).not.toBeNull();

      // Step 5: Verify invoice number in header
      const invoiceNumber = await invoicesPage.getInvoiceNumber();
      expect(invoiceNumber).toBeTruthy();
      expect(invoiceNumber.toUpperCase()).toContain('INV');

      // Step 6: Verify payments section exists on invoice page
      const hasPaymentsSection = await invoicesPage.hasPaymentsSection();
      expect(hasPaymentsSection).toBe(true);

      // Step 7: Navigate to payments page
      await paymentsPage.goto();
      await paymentsPage.waitForPageLoad();

      // Step 8: Verify payments table or empty state
      const paymentsTableVisible = await paymentsPage.shouldSeeTable();

      if (!paymentsTableVisible) {
        await paymentsPage.shouldSeeEmptyState();
      } else {
        const rowCount = await paymentsPage.getRowCount();
        expect(rowCount).toBeGreaterThanOrEqual(0);
      }

      // Verify correct URL
      expect(page.url()).toContain('/finances/payments');
    });
  });
});
