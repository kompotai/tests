export const ContactsSelectors = {
  heading: 'h1:has-text("Contacts"), [data-testid="contacts-heading"]',
  table: '[data-testid="contacts-table"], table',
  emptyState: 'text="Contact not found"',
  createButton: '[data-testid="contacts-create-button"], button:has-text("Create Contact")',
  searchInput: '[data-testid="contacts-search"], input[placeholder*="search" i]',

  form: {
    container: '[data-testid="contact-form"], form',
    // Basic fields
    name: '[data-testid="contact-form-input-name"], input[name="name"]',
    company: '[data-testid="contact-form-input-company"], input[name="company"]',
    position: '[data-testid="contact-form-input-position"], input[name="position"]',
    notes: '[data-testid="contact-form-input-notes"], textarea[name="notes"]',
    // Dynamic fields (by index)
    email: (index: number) => `[data-testid="contact-form-input-email-${index}"], input[name="emails.${index}.address"]`,
    phone: (index: number) => `[data-testid="contact-form-input-phone-${index}"]`,
    // Address fields (by index)
    addressLine1: (index: number) => `input[name="addresses.${index}.line1"]`,
    addressLine2: (index: number) => `input[name="addresses.${index}.line2"]`,
    addressCity: (index: number) => `input[name="addresses.${index}.city"]`,
    addressState: (index: number) => `input[name="addresses.${index}.state"]`,
    addressZip: (index: number) => `input[name="addresses.${index}.zip"]`,
    addressCountry: (index: number) => `select[name="addresses.${index}.country"]`,
    // Telegram (by index)
    telegram: (index: number) => `input[name="telegrams.${index}.username"]`,
    // Select fields (ColorSelect components)
    contactType: '#contactType, #edit-contactType',
    source: '#source, #edit-source',
    ownerId: '#ownerId, #edit-ownerId',
    // Add buttons - using nth-match since they appear in order: Email, Phone, Address, Telegram
    addEmail: ':nth-match(button:has-text("+ Add"), 1)',
    addPhone: ':nth-match(button:has-text("+ Add"), 2)',
    addAddress: ':nth-match(button:has-text("+ Add"), 3)',
    addTelegram: ':nth-match(button:has-text("+ Add"), 4)',
    // Form actions (inside form only)
    submit: '[data-testid="contact-form-button-submit"]',
    cancel: '[data-testid="contact-form-button-cancel"]',
  },

  // Table row and actions
  row: (identifier: string) => `tr:has-text("${identifier}")`,
  rowName: (identifier: string) => `tr:has-text("${identifier}") td:first-child`,
  rowNameLink: (identifier: string) => `tr:has-text("${identifier}") td:first-child button, tr:has-text("${identifier}") td:first-child a`,
  rowViewButton: (identifier: string) => `tr:has-text("${identifier}") a[href*="/contacts/"]`,
  rowEditButton: (identifier: string) => `tr:has-text("${identifier}") button:has(svg.lucide-pencil)`,
  rowDeleteButton: (identifier: string) => `tr:has-text("${identifier}") button:has(svg.lucide-trash-2)`,

  // Badges in table row
  rowTypeBadge: (identifier: string) => `tr:has-text("${identifier}") button:has-text("type"), tr:has-text("${identifier}") button:has-text("тип")`,
  rowSourceBadge: (identifier: string) => `tr:has-text("${identifier}") button:has-text("source"), tr:has-text("${identifier}") button:has-text("источник")`,

  // Badge popover
  badgePopover: '[role="dialog"], [data-radix-popper-content-wrapper]',
  badgeOption: (label: string) => `[role="option"]:has-text("${label}"), button:has-text("${label}")`,
  badgeClear: 'button:has-text("Clear"), button:has-text("Очистить")',

  // Quick view panel (slide-over)
  quickViewPanel: '[data-testid="contact-preview-panel"], [class*="fixed"][class*="right-0"]',
  quickViewBackdrop: '[class*="fixed"][class*="inset-0"][class*="bg-black"]',
  quickViewClose: '[data-testid="contact-preview-close"], button[aria-label="Close"]',

  // Contact detail page
  detailPage: '[data-testid="contact-detail"], [class*="ContactContent"], main',
  detailName: 'h1, [data-testid="contact-name"]',
  detailEmail: '[data-testid="contact-email"], a[href^="mailto:"]',
  detailPhone: '[data-testid="contact-phone"], a[href^="tel:"]',
  detailCompany: '[data-testid="contact-company"]',
  detailPosition: '[data-testid="contact-position"]',
  detailEditButton: 'button:has(svg.lucide-pencil), button:has-text("Edit")',

  // Legacy selectors (keep for backward compatibility)
  rowEditButtonLegacy: 'td:last-child button:first-child',
  rowDeleteButtonLegacy: 'button:has-text("Delete")',
  rowOpenLink: 'a:has-text("Open page")',
} as const;
