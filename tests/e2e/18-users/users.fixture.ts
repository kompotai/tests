/**
 * Users Test Fixtures
 *
 * Provides unique test data generators for user management tests.
 */

import { UserData } from '@pages/UsersPage';

const TEST_RUN_ID = Date.now();
let userCounter = 0;

export function uniqueName(prefix = 'Test User'): string {
  return `${prefix} ${TEST_RUN_ID}-${++userCounter}`;
}

export function uniqueEmail(): string {
  return `test-${TEST_RUN_ID}-${userCounter}@kompot.ai`;
}

export function uniquePassword(): string {
  return `Test${TEST_RUN_ID}${userCounter}!`;
}

export function createMinimalUser(overrides: Partial<UserData> = {}): UserData {
  const name = uniqueName('Minimal');
  return {
    name,
    email: uniqueEmail(),
    password: uniquePassword(),
    ...overrides,
  };
}

export function createFullUser(overrides: Partial<UserData> = {}): UserData {
  const name = uniqueName('Full');
  return {
    name,
    jobTitle: 'QA Engineer',
    email: uniqueEmail(),
    password: uniquePassword(),
    roles: ['Admin', 'Manager'],
    active: true,
    ...overrides,
  };
}
