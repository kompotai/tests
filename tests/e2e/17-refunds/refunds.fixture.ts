/**
 * Refunds Test Fixtures
 *
 * Provides unique test data generators for refund tests.
 */

import { RefundData } from '@pages/RefundsPage';

const TEST_RUN_ID = Date.now();

let refundCounter = 0;
let amountCounter = 10;

export function uniqueNotes(prefix = 'Refund'): string {
  return `${prefix} ${TEST_RUN_ID}-${++refundCounter}`;
}

export function uniqueAmount(): number {
  return amountCounter++;
}

export function uniqueReference(prefix = 'REF'): string {
  return `${prefix}-${TEST_RUN_ID}-${refundCounter}`;
}

// Test contacts available in the workspace
// Use a unique contact name (no duplicates in dropdown)
export const TEST_CONTACTS = {
  SAMPLE: 'B2B Contact',
};

export function createMinimalRefund(overrides: Partial<RefundData> = {}): RefundData {
  const notes = uniqueNotes('Minimal');
  return {
    contactName: TEST_CONTACTS.SAMPLE,
    amount: uniqueAmount(),
    notes,
    ...overrides,
  };
}

export function createFullRefund(overrides: Partial<RefundData> = {}): RefundData {
  const notes = uniqueNotes('Full');
  return {
    contactName: TEST_CONTACTS.SAMPLE,
    amount: uniqueAmount(),
    method: 'paypal',
    reasonCode: 'service_issue',
    reason: `Description for ${notes}`,
    referenceNumber: uniqueReference(),
    notes,
    ...overrides,
  };
}
