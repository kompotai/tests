export const DictionariesSelectors = {
  heading: 'h1:has-text("Dictionaries")',
  list: '[data-testid="dictionaries-list"]',
  createButton: 'text=Create Dictionary',

  // Dictionary row on list page
  dictionaryRow: (id: string) => `[data-testid="dictionary-item-${id}"]`,
  dictionaryEdit: (id: string) => `[data-testid="dictionary-item-${id}-edit"]`,
  dictionaryDelete: (id: string) => `[data-testid="dictionary-item-${id}-delete"]`,

  // Create/Edit dictionary form (slide-over)
  form: '[data-testid="dictionary-form"]',
  formInputCode: '[data-testid="dictionary-form"] input[name="code"]',
  formInputName: '[data-testid="dictionary-form"] input[name="name"]',
  formInputDescription: '[data-testid="dictionary-form"] textarea[name="description"]',
  formCancel: '[data-testid="dictionary-form-button-cancel"]',
  formSubmit: '[data-testid="dictionary-form-button-submit"]',
  slideOverClose: '[data-testid="slide-over-close"]',

  // Detail page — items list
  itemsList: '[data-testid="dictionary-items-list"]',
  addItemButton: 'text=Add Item',
  backToList: 'text=Back to dictionaries',

  // Item row on detail page
  itemRow: (id: string) => `[data-testid="dictionary-item-${id}"]`,
  itemToggle: (id: string) => `[data-testid="dictionary-item-${id}-toggle"]`,
  itemEdit: (id: string) => `[data-testid="dictionary-item-${id}-edit"]`,
  itemDelete: (id: string) => `[data-testid="dictionary-item-${id}-delete"]`,

  // Add/Edit item form (slide-over)
  itemForm: '[data-testid="dictionary-item-form"]',
  itemFormInputCode: '[data-testid="dictionary-item-form"] input[name="code"]',
  itemFormInputName: '[data-testid="dictionary-item-form"] input[name="name"]',
  itemFormInputColor: '[data-testid="dictionary-item-form"] input[placeholder="#000000"]',
  itemFormCancel: '[data-testid="dictionary-item-form-button-cancel"]',
  itemFormSubmit: '[data-testid="dictionary-item-form-button-submit"]',
} as const;
