/**
 * Global Setup — запускается один раз при старте Playwright
 *
 * Определяет режим работы и валидирует переменные окружения.
 *
 * Два режима:
 * - CI Mode: полный тест-сьют (cleanup, DB verification, все тесты)
 * - Tester Mode: только UI тесты (login в существующий workspace)
 */

import * as dotenv from 'dotenv';

// Загружаем .env с перезаписью shell переменных
dotenv.config({ override: true });

export default async function globalSetup() {
  console.log('\n🚀 Global Setup\n');

  const wsId = process.env.WS_ID || 'megatest';
  const baseUrl = process.env.BASE_URL;
  const hasMongoDB = Boolean(process.env.MONGODB_URI);
  const hasSuperAdmin = Boolean(process.env.SUPER_ADMIN_EMAIL && process.env.SUPER_ADMIN_PASSWORD);

  // Валидация обязательных переменных
  if (!baseUrl) {
    console.error('❌ BASE_URL не задан!\n');
    console.error('Добавьте в .env:');
    console.error('  BASE_URL=https://kompot-stage.up.railway.app\n');
    process.exit(1);
  }

  if (!process.env.WS_ID && !hasMongoDB) {
    console.error('❌ WS_ID не задан!\n');
    console.error('Для тестировщиков добавьте в .env:');
    console.error('  WS_ID=ваш-workspace-id\n');
    process.exit(1);
  }

  // Генерируем credentials для отображения
  const ownerEmail = `${wsId}-owner@kompot.ai`;
  const ownerPassword = `${wsId}Owner123!`;

  // Вывод конфигурации
  console.log('═'.repeat(60));

  if (hasMongoDB) {
    // CI Mode
    console.log('  🔧 CI MODE — полный тест-сьют');
    console.log('─'.repeat(60));
    console.log(`  BASE_URL:     ${baseUrl}`);
    console.log(`  WS_ID:        ${wsId}`);
    console.log(`  MongoDB:      ✅ Доступен`);
    console.log(`  Super Admin:  ${hasSuperAdmin ? '✅ Доступен' : '⚠️  Не задан (тесты SA будут пропущены)'}`);
    console.log('─'.repeat(60));
    console.log('  Тесты:');
    console.log('    ✅ Super Admin (SA1, SA2)' + (hasSuperAdmin ? '' : ' — SKIP'));
    console.log('    ✅ Cleanup + Registration');
    console.log('    ✅ DB Verification (REG1-REG3)');
    console.log('    ✅ UI Tests (CO1-CO4)');
  } else {
    // Tester Mode
    console.log('  👤 TESTER MODE — UI тесты');
    console.log('─'.repeat(60));
    console.log(`  BASE_URL:     ${baseUrl}`);
    console.log(`  WS_ID:        ${wsId}`);
    console.log('─'.repeat(60));
    console.log('  Credentials (сгенерированы из WS_ID):');
    console.log(`    Email:      ${ownerEmail}`);
    console.log(`    Password:   ${ownerPassword}`);
    console.log('─'.repeat(60));
    console.log('  Тесты:');
    console.log('    ⏭️  Super Admin — SKIP (нет SUPER_ADMIN_*)');
    console.log('    ⏭️  Cleanup — SKIP (нет MONGODB_URI)');
    console.log('    ⏭️  DB Verification — SKIP (нет MONGODB_URI)');
    console.log('    ✅ Login в существующий workspace');
    console.log('    ✅ UI Tests (CO1-CO4)');
    console.log('─'.repeat(60));
    console.log('  ⚠️  Убедитесь, что workspace уже создан с этими credentials!');
  }

  console.log('═'.repeat(60) + '\n');
}
