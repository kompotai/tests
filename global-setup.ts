/**
 * Global Setup - runs once when Playwright starts
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  Этот файл ТОЛЬКО валидирует переменные окружения.                       ║
 * ║                                                                          ║
 * ║  Очистка данных происходит в beforeAll() внутри setup тестов,            ║
 * ║  чтобы cleanup выполнялся при КАЖДОМ запуске тестов, а не только         ║
 * ║  при старте Playwright.                                                  ║
 * ║                                                                          ║
 * ║  Данные пользователей хранятся в fixtures/users.ts (не в .env)           ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import * as dotenv from 'dotenv';

// Load .env and OVERRIDE existing shell env vars
dotenv.config({ override: true });

// Only infrastructure vars - user data is in fixtures/users.ts
const REQUIRED_ENV_VARS = [
  'BASE_URL',
  'WS_MEGATEST_ID',
  'MONGODB_URI',
];

async function validateEnvVars() {
  const missing: string[] = [];

  for (const name of REQUIRED_ENV_VARS) {
    if (!process.env[name]) {
      missing.push(name);
    }
  }

  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:\n');
    missing.forEach((name) => console.error(`   - ${name}`));
    console.error('\n💡 Set them in .env file\n');
    process.exit(1);
  }
}

export default async function globalSetup() {
  console.log('\n🚀 Global Setup\n');

  await validateEnvVars();
  console.log(`✅ Environment OK | BASE_URL: ${process.env.BASE_URL}`);
  console.log('ℹ️  Cleanup will run in beforeAll() of setup tests');
  console.log('ℹ️  User data is defined in fixtures/users.ts\n');
}
