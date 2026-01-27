/**
 * Test Users Configuration
 *
 * Defines all users for the megatest workspace.
 * Setup tests iterate over this array to create users via UI.
 */

export type SystemRole = 'admin' | 'manager' | 'technician' | 'accountant';

export interface User {
  /** Unique key for auth file naming and fixtures */
  key: string;
  /** Display name */
  name: string;
  /** Email address */
  email: string;
  /** Password */
  password: string;
  /** System roles (owner is special, not in this array) */
  roles: SystemRole[];
  /** If true, user is created via Settings > Users UI */
  createViaUI: boolean;
}

/**
 * Super Admin - platform-level admin, created by bootstrap
 * Credentials from environment variables (Doppler)
 */
export const SUPER_ADMIN = {
  key: 'super-admin',
  name: 'Super Admin',
  get email(): string {
    return process.env.SUPER_ADMIN_EMAIL || '';
  },
  get password(): string {
    return process.env.SUPER_ADMIN_PASSWORD || '';
  },
};

/**
 * Owner user - created during workspace registration
 * Not in USERS array because registration flow is different
 */
export const OWNER = {
  key: 'owner',
  name: 'Megatest Owner',
  email: 'megatest-owner@kompot.ai',
  password: 'MegatestOwner123!',
};

/**
 * All users to create via Settings > Users
 * Each user gets an auth state file: .auth/{key}.json
 */
export const USERS: User[] = [
  {
    key: 'admin',
    name: 'Megatest Admin',
    email: 'megatest-admin@kompot.ai',
    password: 'MegatestAdmin123!',
    roles: ['admin'],
    createViaUI: true,
  },
  {
    key: 'manager',
    name: 'Megatest Manager',
    email: 'megatest-manager@kompot.ai',
    password: 'MegatestManager123!',
    roles: ['manager'],
    createViaUI: true,
  },
  {
    key: 'technician',
    name: 'Megatest Technician',
    email: 'megatest-tech@kompot.ai',
    password: 'MegatestTech123!',
    roles: ['technician'],
    createViaUI: true,
  },
  {
    key: 'accountant',
    name: 'Megatest Accountant',
    email: 'megatest-accountant@kompot.ai',
    password: 'MegatestAccountant123!',
    roles: ['accountant'],
    createViaUI: true,
  },
];

/**
 * Get user by key
 */
export function getUser(key: string): User | typeof OWNER | undefined {
  if (key === 'owner') return OWNER;
  return USERS.find(u => u.key === key);
}

/**
 * All available user keys (for type safety)
 */
export type UserKey = 'super-admin' | 'owner' | 'admin' | 'manager' | 'technician' | 'accountant';

/**
 * Get auth file path for user
 */
export function getAuthFile(key: UserKey): string {
  return `.auth/${key}.json`;
}

/**
 * Get storage state config for Playwright
 * Usage: test.use({ storageState: useUser('admin') })
 */
export function useUser(key: UserKey): string {
  return getAuthFile(key);
}

/**
 * All user keys for iteration
 */
export const ALL_USER_KEYS: UserKey[] = ['owner', ...USERS.map(u => u.key as UserKey)];
