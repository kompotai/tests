export const ContactsSelectors = {
  heading: 'h1:has-text("Contacts"), [data-testid="contacts-heading"]',
  table: '[data-testid="contacts-table"], table',
  emptyState: 'text="Contact not found"',
  createButton: '[data-testid="contacts-create-button"], button:has-text("Create Contact")',
  searchInput: '[data-testid="contacts-search"], input[placeholder*="search" i]',

  form: {
    container: '[data-testid="contact-form"], form',
    name: '[data-testid="contact-form-input-name"], input[name="name"]',
    email: '[data-testid="contact-form-input-email-0"], input[type="email"]',
    phone: '[data-testid="contact-form-input-phone"], input[name="phone"]',
    submit: '[data-testid="contact-form-submit"], button:has-text("Save")',
    cancel: '[data-testid="contact-form-cancel"], button:has-text("Cancel")',
  },

  row: (identifier: string) => `tr:has-text("${identifier}")`,
  rowEditButton: 'td:last-child button:first-child',
  rowDeleteButton: 'button:has-text("Delete")',
  rowOpenLink: 'a:has-text("Open page")',
} as const;
