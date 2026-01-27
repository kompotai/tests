/**
 * Contact Test Data Fixtures
 *
 * Provides test data for contact creation tests with various field combinations.
 * Each fixture represents a specific test scenario.
 */

import { ContactData, ContactAddress } from '@pages/ContactsPage';

// ============================================
// Test Data Generators
// ============================================

/** Generate unique suffix with timestamp */
function uniqueSuffix(): string {
  return Date.now().toString().slice(-6);
}

/** Generate unique contact name with timestamp */
export function uniqueName(prefix: string): string {
  return `${prefix} ${uniqueSuffix()}`;
}

/** Generate unique email */
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${uniqueSuffix()}@test.kompot.ai`;
}

/** Generate unique phone (US format) */
export function uniquePhone(): string {
  const suffix = uniqueSuffix();
  return `+1202${suffix.slice(0, 3)}${suffix.slice(3, 7).padEnd(4, '0')}`;
}

// ============================================
// Minimal Contact (only required fields)
// ============================================

export const MINIMAL_CONTACT: ContactData = {
  name: 'Minimal Contact',
};

// ============================================
// Full Contact (all basic fields filled)
// ============================================

export const FULL_CONTACT: ContactData = {
  name: 'Full Contact',
  emails: ['full@test.kompot.ai'],
  phones: ['+12125551234'],
  company: 'Acme Corporation',
  position: 'CEO',
  notes: 'Important client, prefers email communication.',
};

// ============================================
// Contact with Business Info
// ============================================

export const BUSINESS_CONTACT: ContactData = {
  name: 'Business Contact',
  emails: ['business@company.com'],
  phones: ['+14155559999'],
  company: 'Tech Startup Inc.',
  position: 'CTO',
};

// ============================================
// Partial Contacts (various field combinations)
// ============================================

/** Contact with name + email only */
export const CONTACT_WITH_EMAIL: ContactData = {
  name: 'Contact With Email',
  emails: ['email-only@test.kompot.ai'],
};

/** Contact with name + phone only */
export const CONTACT_WITH_PHONE: ContactData = {
  name: 'Contact With Phone',
  phones: ['+14155551234'],
};

/** Contact with name + company only */
export const CONTACT_WITH_COMPANY: ContactData = {
  name: 'Contact With Company',
  company: 'Company Only LLC',
};

/** Contact with name + position only */
export const CONTACT_WITH_POSITION: ContactData = {
  name: 'Contact With Position',
  position: 'Manager',
};

/** Contact with name + notes only */
export const CONTACT_WITH_NOTES: ContactData = {
  name: 'Contact With Notes',
  notes: 'This is a test note for the contact.',
};

/** Contact with company and position (B2B style) */
export const CONTACT_B2B_STYLE: ContactData = {
  name: 'B2B Contact',
  emails: ['b2b@enterprise.com'],
  company: 'Enterprise Solutions',
  position: 'Procurement Manager',
};

// ============================================
// Multiple Values (arrays)
// ============================================

/** Contact with multiple emails */
export const CONTACT_MULTIPLE_EMAILS: ContactData = {
  name: 'Multi Email Contact',
  emails: [
    'primary@test.kompot.ai',
    'secondary@test.kompot.ai',
  ],
};

/** Contact with multiple phones */
export const CONTACT_MULTIPLE_PHONES: ContactData = {
  name: 'Multi Phone Contact',
  phones: [
    '+12125551111',
    '+12125552222',
  ],
};

/** Contact with multiple telegrams */
export const CONTACT_MULTIPLE_TELEGRAMS: ContactData = {
  name: 'Multi Telegram Contact',
  telegrams: ['@user1', '@user2'],
};

// ============================================
// Address Variations
// ============================================

/** US address */
export const US_ADDRESS: ContactAddress = {
  line1: '123 Main Street',
  line2: 'Suite 100',
  city: 'New York',
  state: 'NY',
  zip: '10001',
  country: 'US',
};

/** Russian address */
export const RU_ADDRESS: ContactAddress = {
  line1: 'ул. Пушкина, д. 10',
  line2: 'кв. 5',
  city: 'Москва',
  state: '',
  zip: '123456',
  country: 'RU',
};

/** Contact with US address */
export const CONTACT_WITH_US_ADDRESS: ContactData = {
  name: 'US Address Contact',
  addresses: [US_ADDRESS],
};

/** Contact with Russian address */
export const CONTACT_WITH_RU_ADDRESS: ContactData = {
  name: 'RU Address Contact',
  addresses: [RU_ADDRESS],
};

/** Contact with multiple addresses */
export const CONTACT_MULTIPLE_ADDRESSES: ContactData = {
  name: 'Multi Address Contact',
  addresses: [
    { line1: 'Home Address', city: 'Los Angeles', state: 'CA', zip: '90001', country: 'US' },
    { line1: 'Work Address', city: 'San Francisco', state: 'CA', zip: '94105', country: 'US' },
  ],
};

// ============================================
// Telegram Contacts
// ============================================

/** Contact with telegram */
export const CONTACT_WITH_TELEGRAM: ContactData = {
  name: 'Telegram Contact',
  telegrams: ['@telegramuser'],
};

/** Contact with telegram (no @ symbol) */
export const CONTACT_TELEGRAM_NO_AT: ContactData = {
  name: 'Telegram No At Contact',
  telegrams: ['telegramuser'],
};

// ============================================
// Edge Cases - Name Variations
// ============================================

/** Contact with minimal valid name (1 character) */
export const CONTACT_SINGLE_CHAR_NAME: ContactData = {
  name: 'A',
};

/** Contact with long name */
export const CONTACT_LONG_NAME: ContactData = {
  name: 'A'.repeat(50) + ' Long Name Contact',
};

/** Contact with unicode characters in name */
export const CONTACT_UNICODE_NAME: ContactData = {
  name: 'Контакт Unicode 日本語',
};

/** Contact with special characters in name */
export const CONTACT_SPECIAL_CHARS_NAME: ContactData = {
  name: "O'Brien & Partners (Test)",
};

/** Contact with numbers in name */
export const CONTACT_WITH_NUMBERS: ContactData = {
  name: 'Contact 123 Test',
};

/** Contact with emoji in name */
export const CONTACT_WITH_EMOJI: ContactData = {
  name: 'Contact Star ⭐ Test',
};

// ============================================
// Phone Format Variations
// ============================================

/** US phone number */
export const CONTACT_US_PHONE: ContactData = {
  name: 'US Phone Contact',
  phones: ['+12025551234'],
};

/** Russian phone number */
export const CONTACT_RU_PHONE: ContactData = {
  name: 'RU Phone Contact',
  phones: ['+79001234567'],
};

/** UK phone number */
export const CONTACT_UK_PHONE: ContactData = {
  name: 'UK Phone Contact',
  phones: ['+442071234567'],
};

/** German phone number */
export const CONTACT_DE_PHONE: ContactData = {
  name: 'DE Phone Contact',
  phones: ['+4930123456789'],
};

// ============================================
// Complete Contact (everything filled)
// ============================================

export const COMPLETE_CONTACT: ContactData = {
  name: 'Complete Contact',
  emails: ['complete@test.kompot.ai', 'backup@test.kompot.ai'],
  phones: ['+12125551234', '+12125555678'],
  company: 'Complete Corp',
  position: 'Director of Everything',
  notes: 'This contact has all fields filled for comprehensive testing.',
  telegrams: ['@completeuser'],
  addresses: [US_ADDRESS],
};

// ============================================
// Invalid Data (for validation tests)
// ============================================

/** Empty name - should fail validation */
export const INVALID_EMPTY_NAME: ContactData = {
  name: '',
};

/** Whitespace only name - should fail validation */
export const INVALID_WHITESPACE_NAME: ContactData = {
  name: '   ',
};

/** Invalid phone format - missing + */
export const INVALID_PHONE_NO_PLUS: ContactData = {
  name: 'Invalid Phone Contact',
  phones: ['12025551234'],
};

/** Invalid phone format - too short */
export const INVALID_PHONE_TOO_SHORT: ContactData = {
  name: 'Invalid Phone Contact',
  phones: ['+123'],
};

/** Invalid email format */
export const INVALID_EMAIL: ContactData = {
  name: 'Invalid Email Contact',
  emails: ['not-an-email'],
};

// ============================================
// Factory Functions for Dynamic Data
// ============================================

/**
 * Create a minimal contact with unique name
 */
export function createMinimalContact(): ContactData {
  return {
    name: uniqueName('Minimal'),
  };
}

/**
 * Create a full contact with unique data
 */
export function createFullContact(): ContactData {
  return {
    name: uniqueName('Full'),
    emails: [uniqueEmail('full')],
    phones: [uniquePhone()],
    company: `Company ${uniqueSuffix()}`,
    position: 'Manager',
    notes: 'Auto-generated test contact',
  };
}

/**
 * Create a business contact with unique data
 */
export function createBusinessContact(): ContactData {
  return {
    name: uniqueName('Business'),
    emails: [uniqueEmail('business')],
    phones: [uniquePhone()],
    company: `Business Corp ${uniqueSuffix()}`,
    position: 'Director',
  };
}

/**
 * Create a contact with specific fields (merges with unique name)
 */
export function createContact(overrides: Partial<ContactData> = {}): ContactData {
  return {
    name: uniqueName('Test'),
    ...overrides,
  };
}

/**
 * Create a contact with address
 */
export function createContactWithAddress(address: ContactAddress = US_ADDRESS): ContactData {
  return {
    name: uniqueName('Address'),
    addresses: [address],
  };
}

/**
 * Create multiple unique contacts
 */
export function createContacts(count: number): ContactData[] {
  return Array.from({ length: count }, (_, i) =>
    createContact({ name: uniqueName(`Batch ${i + 1}`) })
  );
}

/**
 * Create a complete contact with all fields
 */
export function createCompleteContact(): ContactData {
  const suffix = uniqueSuffix();
  return {
    name: uniqueName('Complete'),
    emails: [uniqueEmail('primary'), uniqueEmail('secondary')],
    phones: [uniquePhone()],
    company: `Complete Corp ${suffix}`,
    position: 'CEO',
    notes: `Complete contact created at ${new Date().toISOString()}`,
    telegrams: [`@complete${suffix}`],
    addresses: [{
      line1: `${suffix} Main Street`,
      city: 'Test City',
      state: 'TC',
      zip: suffix.slice(0, 5),
      country: 'US',
    }],
  };
}

// ============================================
// Test Scenarios Groups
// ============================================

/**
 * Minimal variations - just name with one optional field
 */
export const MINIMAL_VARIATIONS: ContactData[] = [
  MINIMAL_CONTACT,
  CONTACT_WITH_EMAIL,
  CONTACT_WITH_PHONE,
  CONTACT_WITH_COMPANY,
  CONTACT_WITH_POSITION,
  CONTACT_WITH_NOTES,
];

/**
 * Business contacts - company/position focused
 */
export const BUSINESS_VARIATIONS: ContactData[] = [
  BUSINESS_CONTACT,
  CONTACT_B2B_STYLE,
  CONTACT_WITH_COMPANY,
];

/**
 * Multi-value contacts - arrays with multiple items
 */
export const MULTI_VALUE_VARIATIONS: ContactData[] = [
  CONTACT_MULTIPLE_EMAILS,
  CONTACT_MULTIPLE_PHONES,
  CONTACT_MULTIPLE_TELEGRAMS,
  CONTACT_MULTIPLE_ADDRESSES,
];

/**
 * Name edge cases
 */
export const NAME_EDGE_CASES: ContactData[] = [
  CONTACT_SINGLE_CHAR_NAME,
  CONTACT_LONG_NAME,
  CONTACT_UNICODE_NAME,
  CONTACT_SPECIAL_CHARS_NAME,
  CONTACT_WITH_NUMBERS,
  CONTACT_WITH_EMOJI,
];

/**
 * Phone format variations
 */
export const PHONE_VARIATIONS: ContactData[] = [
  CONTACT_US_PHONE,
  CONTACT_RU_PHONE,
  CONTACT_UK_PHONE,
  CONTACT_DE_PHONE,
];

/**
 * Address variations
 */
export const ADDRESS_VARIATIONS: ContactData[] = [
  CONTACT_WITH_US_ADDRESS,
  CONTACT_WITH_RU_ADDRESS,
  CONTACT_MULTIPLE_ADDRESSES,
];

/**
 * All valid contact variations for comprehensive testing
 */
export const ALL_VALID_CONTACTS: ContactData[] = [
  ...MINIMAL_VARIATIONS,
  ...BUSINESS_VARIATIONS,
  ...MULTI_VALUE_VARIATIONS,
  ...NAME_EDGE_CASES,
  ...PHONE_VARIATIONS,
  ...ADDRESS_VARIATIONS,
  CONTACT_WITH_TELEGRAM,
  COMPLETE_CONTACT,
];

/**
 * Invalid contact data for negative tests
 */
export const INVALID_CONTACTS = {
  emptyName: INVALID_EMPTY_NAME,
  whitespaceName: INVALID_WHITESPACE_NAME,
  phoneNoPlus: INVALID_PHONE_NO_PLUS,
  phoneTooShort: INVALID_PHONE_TOO_SHORT,
  invalidEmail: INVALID_EMAIL,
} as const;
