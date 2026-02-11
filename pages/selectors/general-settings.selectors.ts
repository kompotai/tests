export const GeneralSettingsSelectors = {
  heading: 'h1:has-text("General Settings")',
  form: '[data-testid="settings-general-form"]',

  // Info block (read-only)
  workspaceName: 'text=Workspace Name:',
  workspaceId: 'text=Workspace ID:',

  // Form fields
  selectLanguage: '[data-testid="settings-general-form"] select >> nth=0',
  selectCurrency: '[data-testid="settings-general-form-select-currency"]',
  currencyPreview: 'text=/\\$[\\d\\s,\\.]+/',
  selectTimezone: '[data-testid="settings-general-form"] select >> nth=2',

  // Date & Time
  selectShortPreset: '[data-testid="settings-general-form-select-short-preset"]',
  inputShortPattern: '[data-testid="settings-general-form-input-short-pattern"]',
  previewShort: '[data-testid="settings-general-form-preview-short"]',

  selectLongPreset: '[data-testid="settings-general-form-select-long-preset"]',
  inputLongPattern: '[data-testid="settings-general-form-input-long-pattern"]',
  previewLong: '[data-testid="settings-general-form-preview-long"]',

  // Actions
  submitButton: '[data-testid="settings-general-form-button-submit"]',
} as const;
