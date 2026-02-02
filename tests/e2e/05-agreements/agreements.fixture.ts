/**
 * Agreement Test Fixtures
 *
 * Test data for agreement template and agreement E2E tests.
 */

import { TemplateData, AgreementData, SignatoryData } from '@pages/index';

// ============================================
// Template Fixtures
// ============================================

export function createTestTemplate(overrides: Partial<TemplateData> = {}): TemplateData {
  const timestamp = Date.now();
  return {
    name: `Test Template ${timestamp}`,
    type: 'contract',
    description: 'E2E Test Template',
    ...overrides,
  };
}

export const TEMPLATE_MINIMAL: TemplateData = {
  name: 'Minimal Template',
};

export const TEMPLATE_WITH_DESCRIPTION: TemplateData = {
  name: 'Template With Description',
  type: 'contract',
  description: 'This is a test template for E2E testing',
};

// ============================================
// Contact Names (for signatories)
// These contacts are seeded in megatest workspace
// ============================================

export const TEST_CONTACTS = {
  // Primary contacts from megatest seed data
  CONTACT_1: 'Carol Lopez',
  CONTACT_2: 'Thomas Walker',
  CONTACT_3: 'Nancy Moore',
  // Legacy aliases (for backward compatibility)
  signatory1: 'Carol Lopez',
  signatory2: 'Thomas Walker',
  signatory3: 'Nancy Moore',
  client: 'Carol Lopez',
};

// ============================================
// Agreement Fixtures
// ============================================

export function createTestAgreement(overrides: Partial<AgreementData> = {}): AgreementData {
  const timestamp = Date.now();
  return {
    title: `Test Agreement ${timestamp}`,
    type: 'contract',
    ...overrides,
  };
}

export function createAgreementWithSignatories(
  templateName: string,
  signatories: SignatoryData[]
): AgreementData {
  const timestamp = Date.now();
  return {
    templateName,
    title: `Agreement ${timestamp}`,
    signatories,
  };
}

// ============================================
// Field Types
// ============================================

// ALL 16 FIELD TYPES supported by the system model:
// Base Types (11): signature, initials, date, dateSigned, creationDate, text, number, checkbox, fullName, email, company
// Dynamic Types (5): contact.name, contact.email, contact.phone, contact.address, contact.company
//
// UI AVAILABILITY:
// - Document Fields: signature, initials, creationDate, text, number (5 types)
// - Signatory Fields: all 14 types (email, company are signer data; contact.* are from Contact entity)

// Document-level fields (Company side) - 5 types available in UI
// These are filled by the document creator (company) before sending for signature
export const DOCUMENT_FIELD_TYPES = [
  'signature',      // Company signature
  'initials',       // Company initials
  'creationDate',   // Auto-filled: agreement creation date
  'text',           // Text input (e.g., contract notes)
  'number',         // Number input (e.g., contract amount)
] as const;

// Signatory-level fields (Client/Partner side) - 14 types available in UI
// These are filled by each signatory when signing
export const SIGNATORY_FIELD_TYPES = [
  // Signature fields
  'signature',      // Signer's signature
  'initials',       // Signer's initials
  // Auto-fill fields (from signer form data)
  'dateSigned',     // Auto-filled: date when signed
  'fullName',       // Full name (from signer form)
  'email',          // Email (from signer form)
  'company',        // Company name (from signer form)
  // Dynamic contact fields (auto-filled from Contact entity)
  'contact.name',
  'contact.email',
  'contact.phone',
  'contact.company',
  'contact.address',
  // Input fields (filled by signer)
  'text',           // Text input
  'date',           // Date input (manual)
  'checkbox',       // Checkbox (agreement confirmation, etc.)
] as const;

// All unique field types (union - 16 total)
export const ALL_FIELD_TYPES = [
  ...DOCUMENT_FIELD_TYPES,
  ...SIGNATORY_FIELD_TYPES.filter(f => !DOCUMENT_FIELD_TYPES.includes(f as any)),
] as const;

// ============================================
// Expected Field Values
// ============================================

export interface ExpectedFieldValue {
  label: string;
  type: string;
  expectedValue?: string | RegExp;
}

export const DOCUMENT_EXPECTED_FIELDS: ExpectedFieldValue[] = [
  { label: 'Creation Date', type: 'creationDate', expectedValue: /\d{2}\.\d{2}\.\d{4}/ },
];

export function getContactFieldExpectedValues(contact: {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}): ExpectedFieldValue[] {
  return [
    { label: 'Contact Name', type: 'contact.name', expectedValue: contact.name },
    ...(contact.email ? [{ label: 'Contact Email', type: 'contact.email', expectedValue: contact.email }] : []),
    ...(contact.phone ? [{ label: 'Contact Phone', type: 'contact.phone', expectedValue: contact.phone }] : []),
    ...(contact.company ? [{ label: 'Contact Company', type: 'contact.company', expectedValue: contact.company }] : []),
  ];
}
