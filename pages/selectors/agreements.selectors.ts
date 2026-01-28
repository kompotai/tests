/**
 * Agreements and Agreement Templates Selectors
 */

export const AgreementsSelectors = {
  // List page
  heading: 'h1:has-text("Agreements")',
  createButton: '[data-testid="create-agreement-button"]',
  table: 'table',
  emptyState: '[data-testid="empty-state"]',

  // Row selectors
  row: (identifier: string) => `tr:has-text("${identifier}")`,
  rowViewButton: (identifier: string) => `tr:has-text("${identifier}") a:has([data-testid="view-icon"]), tr:has-text("${identifier}") a[href*="/agreements/"]`,
  rowEditButton: (identifier: string) => `tr:has-text("${identifier}") button:has([data-testid="edit-icon"]), tr:has-text("${identifier}") button:has-text("Edit")`,
  rowDeleteButton: (identifier: string) => `tr:has-text("${identifier}") button:has([data-testid="delete-icon"]), tr:has-text("${identifier}") button:has-text("Delete")`,

  // Create form
  form: {
    container: '[data-testid="agreement-form"], form',
    templateSelect: '[data-testid="template-select"]',
    title: 'input[name="title"], [data-testid="title-input"]',
    typeSelect: 'select[name="type"], [data-testid="type-select"]',
    statusSelect: 'select[name="status"], [data-testid="status-select"]',
    contactSearch: 'input[placeholder*="contact"], [data-testid="contact-search"]',
    contactOption: (name: string) => `button:has-text("${name}"), [role="option"]:has-text("${name}")`,
    // Multi-signer contact selectors
    signerRole: (order: number) => `[data-testid="signer-role-${order}"]`,
    signerContactInput: (order: number) => `[data-testid="signer-contact-input-${order}"]`,
    signerContactDropdown: (order: number) => `[data-testid="signer-contact-dropdown-${order}"]`,
    signerContactOption: (name: string) => `[data-testid="signer-contact-option-${name.replace(/\s+/g, '-')}"]`,
    // Legacy single contact
    signatoryContact: (index: number) => `[data-testid="signatory-${index}-contact"], input[placeholder*="Select contact"]`,
    submit: '[data-testid="agreement-form-submit"]',
    cancel: 'button:has-text("Cancel")',
  },

  // View page
  view: {
    number: '[data-testid="agreement-number"]',
    title: '[data-testid="agreement-title"]',
    status: '[data-testid="agreement-status"]',
    type: '[data-testid="agreement-type"]',
    documentPreview: '[data-testid="document-preview"]',
    contact: '[data-testid="agreement-contact"]',
    owner: '[data-testid="agreement-owner"]',
    template: '[data-testid="agreement-template"]',
    templateLink: '[data-testid="template-link"]',
    editButton: '[data-testid="edit-agreement-button"]',
    signersSection: '[data-testid="signers-section"]',
    signerCard: (index: number) => `[data-testid="signer-card-${index}"]`,
    filledField: (label: string) => `[data-testid="field-${label}"], :has-text("${label}")`,
    sendForSignature: '[data-testid="send-for-signature-button"]',
    // PDF page navigation (numbered buttons)
    pdfPageButton: (page: number) => `[data-testid="pdf-page-${page}"]`,
    pdfActivePageButton: 'button[data-testid^="pdf-page-"].bg-zinc-900, button[class*="bg-zinc-900"][data-testid^="pdf-page-"]',
    pdfPageButtons: '[data-testid^="pdf-page-"]',
    // Legacy selectors (not used in current UI but kept for compatibility)
    pdfPrevPage: '[data-testid="pdf-prev-page"]',
    pdfNextPage: '[data-testid="pdf-next-page"]',
    pdfPageIndicator: '[data-testid="pdf-page-indicator"]',
    // Field overlays on PDF
    fieldOverlay: (type: string) => `[data-testid="field-overlay-${type.replace(/\./g, '-')}"]`,
    fieldOverlayByPage: (page: number) => `[data-field-page="${page}"]`,
  },

  // Tabs
  tabs: {
    agreements: 'button:has-text("Agreements")',
    templates: 'button:has-text("Templates")',
  },
};

export const AgreementTemplatesSelectors = {
  // List page
  heading: 'h1:has-text("Templates")',
  createButton: '[data-testid="create-template-button"]',
  table: 'table',
  emptyState: '[data-testid="empty-state"]',

  // Row selectors
  row: (identifier: string) => `tr:has-text("${identifier}")`,
  // Click on the row to open edit page (entire row is clickable)
  rowEditButton: (identifier: string) => `tr:has-text("${identifier}") td:first-child`,
  rowDeleteButton: (identifier: string) => `tr:has-text("${identifier}") button[title*="Delete"], tr:has-text("${identifier}") button:has-text("Delete")`,

  // Create form
  form: {
    container: '[data-testid="template-form"], form',
    name: 'input[name="name"], [data-testid="name-input"]',
    typeSelect: 'select[name="type"], [data-testid="type-select"]',
    description: 'textarea[name="description"], [data-testid="description-input"]',
    submit: 'button[type="submit"], button:has-text("Create"), button:has-text("Save")',
    cancel: 'button:has-text("Cancel")',
  },

  // Editor page
  editor: {
    container: '[data-testid="template-editor"]',
    pdfViewer: '[data-testid="pdf-viewer"]',
    sidebar: '[data-testid="editor-sidebar"]',

    // Document upload
    uploadButton: 'button:has-text("Upload"), input[type="file"]',
    fileInput: 'input[type="file"]',

    // Roles/Signatories (sidebar items)
    documentFields: '[data-testid="document-fields"]',
    addSignatory: '[data-testid="add-signatory"]',
    signatoryItem: (name: string) => `[data-testid="signatory-${name.toLowerCase().replace(/ /g, '-')}"]`,
    deleteSignatory: 'button[data-testid="delete-role"], button:has([data-testid="delete-icon"])',

    // Field type dropdown
    addFieldButton: '[data-testid="add-field-button"]',
    fieldTypeDropdown: '[data-testid="field-type-dropdown"]',
    fieldTypeOption: (type: string) => `[data-testid="field-type-${type.toLowerCase().replace(/\\.+/g, '-').replace(/\\s+/g, '-')}"]`,

    // Field on canvas
    field: (label: string) => `[data-testid="field-${label}"], [data-field-label="${label}"]`,
    selectedField: '[data-testid="selected-field"]',

    // Field properties
    fieldProperties: '[data-testid="field-properties"]',
    fieldLabel: 'input[data-testid="field-label"], input[name="label"]',
    fieldRequired: 'input[type="checkbox"][name="required"]',
    fieldWidth: 'input[name="width"]',
    fieldHeight: 'input[name="height"]',
    deleteField: 'button:has-text("Delete Field")',

    // Signature pad
    signaturePad: '[data-testid="signature-pad"], canvas',
    signatureClear: 'button:has-text("Clear")',

    // Page navigation
    prevPage: 'button[data-testid="prev-page"]',
    nextPage: 'button[data-testid="next-page"]',
    currentPage: '[data-testid="current-page"]',

    // Save
    saveButton: 'button:has-text("Save"), button[type="submit"]',
  },
};
