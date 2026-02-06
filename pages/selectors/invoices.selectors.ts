export const InvoicesSelectors = {
  // Page structure
  pageHeader: 'h1',
  table: 'table',
  tableBody: 'table tbody',
  tableRow: 'table tbody tr',
  tableCell: 'td',

  // Empty state
  emptyState: '[data-testid="invoices-empty-state"]',
  emptyStateText: 'text=No invoices',
  emptyStateTextRu: 'text=Нет счетов',

  // Actions
  createButton: '[data-testid="invoices-create-button"]',
  searchInput: '[data-testid="invoices-search-input"]',

  // Invoice details
  detailsHeader: '[data-testid="invoice-details-header"]',
  invoiceNumber: '[data-testid="invoice-number"]',
  invoiceAmount: '[data-testid="invoice-amount"]',
  invoiceStatus: '[data-testid="invoice-status"]',

  // Related sections
  paymentsSection: '[data-testid="invoice-related-payments"]',
  paymentsSectionText: 'text=Payments',
  paymentsSectionTextRu: 'text=Оплаты',
  refundsSection: '[data-testid="invoice-related-refunds"]',
} as const;
