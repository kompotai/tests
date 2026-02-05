/**
 * Product Test Fixtures
 *
 * Factory functions produce unique product names so tests don't collide.
 * Pre-existing workspace products: "Sample Product" ($99), "Sample Service" ($150).
 */

import type { ProductData } from '@pages/ProductsPage';

// ============================================
// Unique name generator
// ============================================

let counter = 0;
const RUN_SUFFIX = Date.now().toString().slice(-6);

export function uniqueProductName(prefix = 'Test Product'): string {
  counter++;
  return `${prefix}-${counter}-${RUN_SUFFIX}`;
}

// ============================================
// Pre-existing products (read-only reference)
// ============================================

export const EXISTING_PRODUCTS = {
  PRODUCT: { name: 'Sample Product', sku: 'PRD-SAMPLE-01', sellingPrice: 99, type: 'Product' },
  SERVICE: { name: 'Sample Service', sku: 'SRV-SAMPLE-01', sellingPrice: 150, type: 'Service' },
};

// ============================================
// Factory functions
// ============================================

/** Minimal product — only the fields required by the form */
export function createMinimalProduct(overrides: Partial<ProductData> = {}): ProductData {
  return {
    name: uniqueProductName(),
    sellingPrice: 100,
    ...overrides,
  };
}

/** Product with all optional fields filled */
export function createFullProduct(overrides: Partial<ProductData> = {}): ProductData {
  return {
    name: uniqueProductName('Full Product'),
    type: 'product',
    sku: `SKU-${RUN_SUFFIX}-${++counter}`,
    description: 'A test product with all fields filled',
    purchasePrice: 40,
    sellingPrice: 99.99,
    unit: 'ea',
    taxable: true,
    taxRate: 10,
    tags: 'test,automation',
    notes: 'Internal test notes',
    ...overrides,
  };
}

/** Service-type product */
export function createServiceProduct(overrides: Partial<ProductData> = {}): ProductData {
  return {
    name: uniqueProductName('Test Service'),
    type: 'service',
    sellingPrice: 150,
    unit: 'hour',
    ...overrides,
  };
}
