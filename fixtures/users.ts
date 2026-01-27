/**
 * Test Users Configuration
 *
 * Все credentials генерируются из WS_ID:
 * - Email: {WS_ID}-{role}@kompot.ai
 * - Password: {WS_ID}{Role}123!
 * - Name: {WS_ID} {Role}
 *
 * Два режима:
 * 1. CI Mode (есть MONGODB_URI): полный тест-сьют с cleanup
 * 2. Tester Mode (нет MONGODB_URI): только UI тесты
 */

export type SystemRole = 'admin' | 'manager' | 'technician' | 'accountant';

export interface User {
  key: string;
  name: string;
  email: string;
  password: string;
  roles: SystemRole[];
  createViaUI: boolean;
}

// ============================================
// Workspace ID — основа для всех credentials
// ============================================

export const WORKSPACE_ID = process.env.WS_ID || 'megatest';

// ============================================
// Environment Detection
// ============================================

/** CI Mode — есть доступ к MongoDB для cleanup и verification */
export const IS_CI_MODE = Boolean(process.env.MONGODB_URI);

/** Tester Mode — только UI тесты, без доступа к БД */
export const IS_TESTER_MODE = !IS_CI_MODE;

/** Проверка доступности Super Admin */
export const HAS_SUPER_ADMIN = Boolean(
  process.env.SUPER_ADMIN_EMAIL && process.env.SUPER_ADMIN_PASSWORD
);

// ============================================
// Super Admin (только CI Mode)
// ============================================

export const SUPER_ADMIN = {
  key: 'super-admin',
  name: 'Super Admin',
  get email(): string {
    return process.env.SUPER_ADMIN_EMAIL || '';
  },
  get password(): string {
    return process.env.SUPER_ADMIN_PASSWORD || '';
  },
  get isAvailable(): boolean {
    return HAS_SUPER_ADMIN;
  },
};

// ============================================
// Owner — генерируется из WS_ID
// ============================================

export const OWNER = {
  key: 'owner',
  get name(): string {
    return `${WORKSPACE_ID} Owner`;
  },
  get email(): string {
    return `${WORKSPACE_ID}-owner@kompot.ai`;
  },
  get password(): string {
    return `${WORKSPACE_ID}Owner123!`;
  },
};

// ============================================
// Workspace Users — генерируются из WS_ID
// ============================================

function createUser(key: string, role: SystemRole): User {
  const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
  return {
    key,
    name: `${WORKSPACE_ID} ${capitalizedKey}`,
    email: `${WORKSPACE_ID}-${key}@kompot.ai`,
    password: `${WORKSPACE_ID}${capitalizedKey}123!`,
    roles: [role],
    createViaUI: true,
  };
}

export const USERS: User[] = [
  createUser('admin', 'admin'),
  createUser('manager', 'manager'),
  createUser('technician', 'technician'),
  createUser('accountant', 'accountant'),
];

// ============================================
// Helper Functions
// ============================================

export function getUser(key: string): User | typeof OWNER | undefined {
  if (key === 'owner') return OWNER;
  return USERS.find(u => u.key === key);
}

export type UserKey = 'super-admin' | 'owner' | 'admin' | 'manager' | 'technician' | 'accountant';

export function getAuthFile(key: UserKey): string {
  return `.auth/${key}.json`;
}

export function useUser(key: UserKey): string {
  return getAuthFile(key);
}

export const ALL_USER_KEYS: UserKey[] = ['owner', ...USERS.map(u => u.key as UserKey)];

export function hasMongoDBAccess(): boolean {
  return IS_CI_MODE;
}

// ============================================
// Debug: показать текущую конфигурацию
// ============================================

export function logTestConfig(): void {
  console.log('\n' + '═'.repeat(60));
  console.log(`  Workspace: ${WORKSPACE_ID}`);
  console.log(`  Mode: ${IS_CI_MODE ? '🔧 CI' : '👤 Tester'}`);
  console.log('─'.repeat(60));
  console.log(`  Owner email: ${OWNER.email}`);
  console.log(`  Owner password: ${OWNER.password}`);
  if (IS_CI_MODE) {
    console.log('─'.repeat(60));
    console.log(`  MongoDB: ✅ Available`);
    console.log(`  Super Admin: ${HAS_SUPER_ADMIN ? '✅ Available' : '❌ Not set'}`);
  }
  console.log('═'.repeat(60) + '\n');
}
