export const PaymentsSelectors = {
  // Page structure
  pageHeader: 'h1',
  table: 'table',
  tableBody: 'table tbody',
  tableRow: 'table tbody tr',

  // Empty state
  emptyState: '[data-testid="payments-empty-state"]',
  emptyStateText: 'text=No payments',
  emptyStateTextRu: 'text=Нет платежей',

  // Actions
  createButton: '[data-testid="payments-create-button"]',
  searchInput: '[data-testid="payments-search-input"]',

  // Payment details
  detailsHeader: '[data-testid="payment-details-header"]',
  detailsAmount: '[data-testid="payment-amount"]',
  detailsStatus: '[data-testid="payment-status"]',
  detailsDate: '[data-testid="payment-date"]',
  detailsContact: '[data-testid="payment-contact"]',
} as const;
