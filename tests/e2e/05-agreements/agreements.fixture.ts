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

export const DOCUMENT_FIELD_TYPES = [
  'signature',
  'initials',
  'creationDate',
  'text',
  'number',
] as const;

export const SIGNATORY_FIELD_TYPES = [
  // Signature fields
  'signature',
  'initials',
  // Contact data fields
  'contact.name',
  'contact.email',
  'contact.phone',
  'contact.company',
  'contact.address',
  // Date fields
  'dateSigned',
  // Input fields
  'fullName',
  'text',
  'date',
  'checkbox',
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
