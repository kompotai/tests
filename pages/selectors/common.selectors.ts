export const CommonSelectors = {
  confirmDialog: '[data-testid="confirm-dialog"]',
  confirmDialogYes: '[data-testid="confirm-dialog-button-confirm"]',
  confirmDialogNo: '[data-testid="confirm-dialog-button-cancel"]',

  spinner: '.animate-spin, [class*="loading"], [class*="spinner"]',

  toast: '[data-testid="toast"], .toast',
  toastSuccess: '[data-testid="toast-success"], .toast-success',
  toastError: '[data-testid="toast-error"], .toast-error',

  sidebar: '[data-testid="sidebar"], nav',
  header: '[data-testid="header"], header',

  cookieAccept: 'button:has-text("Accept")',
  modal: '[role="dialog"]',
  modalClose: '[role="dialog"] button:has-text("Close"), [role="dialog"] button[aria-label="Close"]',

  selectOption: '[role="option"]',
} as const;
