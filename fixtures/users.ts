/**
 * Test Users Configuration
 *
 * Два режима работы:
 *
 * 1. CI Mode (есть MONGODB_URI):
 *    - Полный тест-сьют с cleanup и DB verification
 *    - Credentials генерируются из WS_ID
 *
 * 2. Tester Mode (нет MONGODB_URI):
 *    - Только UI тесты
 *    - Credentials берутся из WS_OWNER_EMAIL / WS_OWNER_PASSWORD
 *    - Workspace должен быть создан вручную
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
// Owner
// - CI Mode: генерируется из WS_ID
// - Tester Mode: из WS_OWNER_EMAIL / WS_OWNER_PASSWORD
// ============================================

export const OWNER = {
  key: 'owner',
  get name(): string {
    return `${WORKSPACE_ID} Owner`;
  },
  get email(): string {
    // Prefer env var if set (works in both CI and Tester modes)
    if (process.env.WS_OWNER_EMAIL) {
      return process.env.WS_OWNER_EMAIL;
    }
    // Fallback: generate from WS_ID
    return `${WORKSPACE_ID}-owner@kompot.ai`;
  },
  get password(): string {
    // Prefer env var if set (works in both CI and Tester modes)
    if (process.env.WS_OWNER_PASSWORD) {
      return process.env.WS_OWNER_PASSWORD;
    }
    // Fallback: generate from WS_ID (capitalize first letter)
    return `${WORKSPACE_ID.charAt(0).toUpperCase() + WORKSPACE_ID.slice(1)}Owner123!`;
  },
};

// ============================================
// Workspace Users — генерируются из WS_ID
// ============================================

function createUser(key: string, role: SystemRole): User {
  const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
  const capitalizedWorkspace = WORKSPACE_ID.charAt(0).toUpperCase() + WORKSPACE_ID.slice(1);
  return {
    key,
    name: `${WORKSPACE_ID} ${capitalizedKey}`,
    email: `${WORKSPACE_ID}-${key}@kompot.ai`,
    password: `${capitalizedWorkspace}${capitalizedKey}123!`,
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
  if (IS_CI_MODE) {
    console.log(`  Owner password: ${OWNER.password}`);
    console.log('─'.repeat(60));
    console.log(`  MongoDB: ✅ Available`);
    console.log(`  Super Admin: ${HAS_SUPER_ADMIN ? '✅ Available' : '❌ Not set'}`);
  } else {
    console.log(`  Owner password: ${'*'.repeat(8)} (from env)`);
  }
  console.log('═'.repeat(60) + '\n');
}
