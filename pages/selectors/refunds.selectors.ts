export const RefundsSelectors = {
  heading: 'h1:has-text("Refunds")',
  table: '[data-testid="refunds-table"]',
  createButton: 'button:has-text("Create Refund")',
  searchInput: 'input[placeholder*="Search by number"]',

  form: {
    container: '[data-testid="refund-form"]',
    contact: '[data-testid="refund-form-select-contact"]',
    invoice: '[data-testid="refund-form-select-invoice"]',
    amount: '[data-testid="refund-form-input-amount"]',
    method: '[data-testid="refund-form-select-method"]',
    reasonCode: '[data-testid="refund-form-select-reasonCode"]',
    reason: '[data-testid="refund-form-input-reason"]',
    referenceNumber: '[data-testid="refund-form-input-referenceNumber"]',
    notes: '[data-testid="refund-form-input-notes"]',
    submit: '[data-testid="refund-form-button-submit"]',
    cancel: '[data-testid="refund-form-button-cancel"]',
  },

  slideOverClose: '[data-testid="slide-over-close"]',

  row: (identifier: string) => `[data-testid="refunds-table"] tr:has-text("${identifier}")`,
  rowView: (id: string) => `[data-testid="refunds-row-${id}-view"]`,
  rowEdit: (id: string) => `[data-testid="refunds-row-${id}-edit"]`,
  rowDelete: (id: string) => `[data-testid="refunds-row-${id}-delete"]`,

  deleteDialog: {
    container: '.fixed.inset-0',
    confirm: 'button:has-text("Delete")',
    cancel: 'button:has-text("Cancel")',
  },
} as const;
