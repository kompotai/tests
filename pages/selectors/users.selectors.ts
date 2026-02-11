export const UsersSelectors = {
  heading: 'h1:has-text("Users")',
  list: '[data-testid="users-list"]',
  table: '[data-testid="users-table"]',
  createButton: '[data-testid="users-button-create"]',

  form: {
    container: '[data-testid="user-form-input-name"]',
    inputName: '[data-testid="user-form-input-name"]',
    inputJobTitle: '[data-testid="user-form-input-job-title"]',
    inputEmail: '[data-testid="user-form-input-email"]',
    inputPassword: '[data-testid="user-form-input-password"]',
    generatePassword: '[data-testid="user-form-button-generate-password"]',
    credentials: '[data-testid="user-form-credentials"]',
    copyCredentials: '[data-testid="user-form-button-copy-credentials"]',
    cancel: '[data-testid="user-form-button-cancel"]',
    submit: '[data-testid="user-form-button-submit"]',
    roleCheckbox: (role: string) => `label:has-text("${role}") input[type="checkbox"]`,
    activeCheckbox: 'label:has-text("Active user") input[type="checkbox"]',
  },

  row: (identifier: string) => `[data-testid="users-table"] tr:has-text("${identifier}")`,
  rowToggle: (id: string) => `[data-testid="users-row-${id}-toggle"]`,
  rowEdit: (id: string) => `[data-testid="users-row-${id}-edit"]`,
  rowDelete: (id: string) => `[data-testid="users-row-${id}-delete"]`,

  detail: {
    backToList: 'a:has-text("Back to list")',
  },
} as const;
