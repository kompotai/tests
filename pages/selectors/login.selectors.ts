export const LoginSelectors = {
  form: '[data-testid="login-form"]',
  wsidInput: '[data-testid="login-input-wsid"]',
  emailInput: '[data-testid="login-input-email"]',
  passwordInput: '[data-testid="login-input-password"]',
  submitButton: '[data-testid="login-button-submit"]',
  errorMessage: '[data-testid="login-error"], .error, [class*="error"], [role="alert"]',
} as const;
