/**
 * Custom Fields Settings Selectors
 */

export const CustomFieldsSelectors = {
  heading: 'h1:has-text("Custom Fields")',
  entityFilter: 'select >> nth=0', // First select on page — entity filter
  addButton: 'button:has-text("Add Field")',
  emptyState: 'text=No custom fields defined',

  // Field list
  list: '[data-testid="custom-fields-list"]',
  item: (code: string) => `[data-testid="custom-field-item-${code}"]`,
  itemEdit: (code: string) => `[data-testid="custom-field-item-${code}-edit"]`,
  itemDelete: (code: string) => `[data-testid="custom-field-item-${code}-delete"]`,

  // Slide-over form (create & edit)
  form: {
    container: '[data-testid="custom-field-form"]',
    close: '[data-testid="slide-over-close"]',
    code: 'input[name="code"]',
    name: 'input[name="name"]',
    type: 'select[name="type"]',
    required: 'input[name="required"]',
    // Type-specific
    maxLength: 'input[name="maxLength"]',
    minValue: 'input[name="minValue"]',
    maxValue: 'input[name="maxValue"]',
    options: 'textarea[name="options"]',
    dictionaryCode: 'select[name="dictionaryCode"]',
    // Buttons
    cancel: '[data-testid="custom-field-form-button-cancel"]',
    submit: '[data-testid="custom-field-form-button-submit"]',
  },

  // Delete confirmation dialog (no role attribute — uses fixed overlay)
  deleteDialog: {
    container: '.fixed.inset-0',
    title: 'text=Delete custom field?',
    confirm: '.fixed.inset-0 button:has-text("Delete")',
    cancel: '.fixed.inset-0 button:has-text("Cancel")',
  },
} as const;
