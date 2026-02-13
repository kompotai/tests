/**
 * Custom Fields Test Fixtures
 *
 * Provides unique test data generators for custom field tests.
 */

import { CustomFieldData } from '@pages/CustomFieldsPage';

const TEST_RUN_ID = Date.now();
let fieldCounter = 0;

function nextCode(prefix: string): string {
  return `${prefix}_${TEST_RUN_ID}_${++fieldCounter}`;
}

function nextName(prefix: string): string {
  return `${prefix} ${TEST_RUN_ID}-${fieldCounter}`;
}

export function createTextField(overrides: Partial<CustomFieldData> = {}): CustomFieldData {
  const code = nextCode('txt');
  return {
    code,
    name: nextName('Text Field'),
    type: 'text',
    maxLength: 200,
    ...overrides,
  };
}

export function createNumberField(overrides: Partial<CustomFieldData> = {}): CustomFieldData {
  const code = nextCode('num');
  return {
    code,
    name: nextName('Number Field'),
    type: 'number',
    minValue: 0,
    maxValue: 1000,
    ...overrides,
  };
}

export function createBooleanField(overrides: Partial<CustomFieldData> = {}): CustomFieldData {
  const code = nextCode('bool');
  return {
    code,
    name: nextName('Boolean Field'),
    type: 'boolean',
    ...overrides,
  };
}

export function createSelectField(overrides: Partial<CustomFieldData> = {}): CustomFieldData {
  const code = nextCode('sel');
  return {
    code,
    name: nextName('Select Field'),
    type: 'select',
    options: ['Option A', 'Option B', 'Option C'],
    ...overrides,
  };
}

export function createRequiredField(overrides: Partial<CustomFieldData> = {}): CustomFieldData {
  const code = nextCode('req');
  return {
    code,
    name: nextName('Required Field'),
    type: 'text',
    required: true,
    maxLength: 100,
    ...overrides,
  };
}
