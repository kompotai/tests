/**
 * Opportunities Test Fixtures
 *
 * Provides unique test data generators for opportunity tests.
 */

// Unique identifier for test runs
const TEST_RUN_ID = Date.now();

let opportunityCounter = 0;
let amountCounter = 1000;

export function uniqueOpportunityName(prefix = 'Test Opportunity'): string {
  return `${prefix} ${TEST_RUN_ID}-${++opportunityCounter}`;
}

export function uniqueAmount(): number {
  return amountCounter++ * 100;
}

export interface TestOpportunity {
  name: string;
  amount?: number;
  contactName?: string;
}

export function createOpportunity(overrides: Partial<TestOpportunity> = {}): TestOpportunity {
  return {
    name: uniqueOpportunityName(),
    amount: uniqueAmount(),
    ...overrides,
  };
}

export function createFullOpportunity(): TestOpportunity {
  return {
    name: uniqueOpportunityName('Full Opportunity'),
    amount: uniqueAmount(),
    contactName: 'Carol Lopez', // Test contact from megatest
  };
}

// Test contacts from megatest workspace (created by setup script)
export const TEST_CONTACTS = {
  CONTACT_1: 'Carol Lopez',
  CONTACT_2: 'Thomas Walker',
  CONTACT_3: 'Nancy Moore',
};

// Pipeline and stage constants
export const TEST_PIPELINES = {
  SALES: 'Sales',
  MARKETING: 'Marketing', // if exists
};

export const TEST_STAGES = {
  NEW_LEAD: 'New Lead',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost',
};

// Factory for stage-specific opportunities
export function createOpportunityWithStage(
  stage: string,
  overrides?: Partial<TestOpportunity>
): TestOpportunity {
  return {
    name: uniqueOpportunityName('Stage Test'),
    amount: uniqueAmount(),
    contactName: TEST_CONTACTS.CONTACT_1,
    ...overrides,
  };
}

// Validation test data
export const INVALID_EMPTY_NAME = {
  name: '',
  contactName: TEST_CONTACTS.CONTACT_1,
};

export const INVALID_NEGATIVE_AMOUNT = {
  name: uniqueOpportunityName('Negative'),
  amount: -1000,
  contactName: TEST_CONTACTS.CONTACT_1,
};

export const VALID_LARGE_AMOUNT = {
  name: uniqueOpportunityName('Large'),
  amount: 9999999.99,
  contactName: TEST_CONTACTS.CONTACT_1,
};
