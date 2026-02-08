/**
 * Login Page Selectors
 *
 * @deprecated Prefer using LoginPage methods with user-facing locators
 * (getByRole, getByLabel) instead of these CSS selectors.
 *
 * These selectors are kept for backward compatibility with existing tests.
 */
export const LoginSelectors = {
  // Form
  form: '[data-testid="login-form"]',

  // Tabs (new login form structure)
  employeeTab: '[role="tab"]:has-text("Employee")',
  ownerTab: '[role="tab"]:has-text("Company Owner"), [role="tab"]:has-text("Owner")',

  // Inputs (data-testid for fallback)
  wsidInput: '[data-testid="login-input-wsid"]',
  emailInput: '[data-testid="login-input-email"]',
  passwordInput: '[data-testid="login-input-password"]',
  submitButton: '[data-testid="login-button-submit"]',

  // Error states
  errorMessage: '[data-testid="login-error"], [role="alert"]',
} as const;
