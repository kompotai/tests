/**
 * Product Selectors
 *
 * All critical elements have data-testid attributes.
 * Row edit/delete buttons use dynamic testids (products-row-{id}-edit)
 * so they are matched via the row's text + testid suffix pattern.
 */

export const ProductsSelectors = {
  // List page
  table: '[data-testid="products-table"]',
  createButton: '[data-testid="products-button-create"]',
  searchInput: 'input[placeholder="Search by name, SKU, description..."]',

  // Category sidebar
  categoryTree: '[data-testid="category-tree"]',
  categoryCreateBtn: '[data-testid="category-create-btn"]',
  categoryAll: '[data-testid="category-all-products"]',

  // Table rows — scoped by product name text
  row: (name: string) => `tr:has-text("${name}")`,
  rowEdit: (name: string) => `tr:has-text("${name}") button[data-testid$="-edit"]`,
  rowDelete: (name: string) => `tr:has-text("${name}") button[data-testid$="-delete"]`,

  // Creation / Edit form
  form: {
    container: '[data-testid="product-form"]',
    nameInput: '[data-testid="product-form-input-name"]',
    typeSelect: '[data-testid="product-form-select-type"]',
    skuInput: '[data-testid="product-form-input-sku"]',
    categorySelector: '[data-testid="category-selector"]',
    descriptionInput: '[data-testid="product-form-input-description"]',
    purchasePriceInput: '[data-testid="product-purchase-price-input"]',
    sellingPriceInput: '[data-testid="product-form-input-sellingPrice"]',
    unitInput: '[data-testid="product-unit-input"]',
    taxableCheckbox: '[data-testid="product-taxable-checkbox"]',
    taxRateInput: '[data-testid="product-tax-rate-input"]',
    activeCheckbox: '[data-testid="product-active-checkbox"]',
    tagsInput: '[data-testid="product-tags-input"]',
    notesInput: '[data-testid="product-notes-input"]',
    imageUrlInput: 'input[name="imageUrl"]',
    submitBtn: '[data-testid="product-form-button-submit"]',
    cancelBtn: '[data-testid="product-form-button-cancel"]',
  },
} as const;
