# Kompot E2E Test Framework

Тестовый фреймворк для автоматизированного тестирования бизнес-системы Kompot с использованием Playwright и TypeScript.

---

## ⚠️ Важный принцип: Тестирование через браузер

```
╔══════════════════════════════════════════════════════════════════════════╗
║  ВСЕ ДЕЙСТВИЯ выполняются через БРАУЗЕР, имитируя поведение пользователя!║
║                                                                          ║
║  Global Setup ТОЛЬКО ОЧИЩАЕТ базу данных (DELETE операции).              ║
║  Создание workspace, пользователей и данных — ТОЛЬКО через UI.           ║
║                                                                          ║
║  Прямое воздействие на БД (INSERT/UPDATE) ЗАПРЕЩЕНО, так как:            ║
║  - Нарушает честность тестов                                             ║
║  - Обходит бизнес-логику приложения                                      ║
║  - Не тестирует реальные сценарии использования                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### Архитектура тестов

```
┌─────────────────────────────────────────────────────────────┐
│ 1. GLOBAL SETUP (global-setup.ts)                           │
│    - Валидация env переменных                               │
│    - УДАЛЕНИЕ ТОЛЬКО megatest workspace и его owner         │
│    - ⚠️ Другие workspaces НЕ затрагиваются!                 │
│    - ⚠️ Только DELETE! Никаких INSERT/UPDATE!               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. SETUP PROJECT (tests/e2e/setup/)                         │
│    - Регистрация owner через /account/register              │
│    - Создание workspace через UI                            │
│    - Создание admin/employee через Settings > Users         │
│    - Сохранение auth state в .auth/*.json                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. MAIN TESTS (tests/e2e/*)                                 │
│    - Используют сохранённый auth state                      │
│    - Тестируют функциональность через UI                    │
│    - Запускаются параллельно                                │
└─────────────────────────────────────────────────────────────┘
```

### Auth State (storageState)

Setup тесты сохраняют auth state для каждой роли:
- `.auth/owner.json` — авторизация owner
- `.auth/admin.json` — авторизация admin
- `.auth/employee.json` — авторизация employee

Остальные тесты используют эти файлы и стартуют **уже авторизованными** — без UI логина!

---

## Структура проекта

```
kompot-tests/
├── tests/              # Тестовые сценарии
│   ├── auth/          # Тесты аутентификации
│   ├── navigation/    # Тесты навигации
│   └── forms/         # Тесты форм и валидации
├── pages/             # Page Object Models
│   ├── BasePage.ts    # Базовый класс для всех страниц
│   ├── LoginPage.ts   # Page Object для страницы логина
│   └── HomePage.ts    # Page Object для главной страницы
├── fixtures/          # Кастомные фикстуры
│   └── auth.fixture.ts # Фикстура для автоматической авторизации
├── utils/             # Вспомогательные функции
├── playwright.config.ts  # Конфигурация Playwright
├── tsconfig.json      # Конфигурация TypeScript
├── .env              # Переменные окружения (не в git)
└── .env.example      # Пример переменных окружения
```

## Установка

### Требования

- Node.js 18+
- npm или yarn

### Шаги установки

1. Установите зависимости:
```bash
npm install
```

2. Установите браузеры Playwright:
```bash
npx playwright install
```

3. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

4. Заполните `.env` файл (пример уже в репозитории):
```env
BASE_URL="http://localhost:3000"
MONGODB_URI="mongodb://kompot:kompot@localhost:27017/?authSource=admin"
WS_MEGATEST_ID="megatest"
WS_MEGATEST_OWNER_EMAIL="megatest-owner@kompot.ai"
WS_MEGATEST_OWNER_PASSWORD="MegatestOwner123!"
WS_MEGATEST_ADMIN_EMAIL="megatest-admin@kompot.ai"
WS_MEGATEST_ADMIN_PASSWORD="MegatestAdmin123!"
WS_MEGATEST_EMPLOYEE_EMAIL="megatest-employee@kompot.ai"
WS_MEGATEST_EMPLOYEE_PASSWORD="MegatestEmployee123!"
```

**ВАЖНО:** Doppler НЕ используется для локальной разработки. Все переменные берутся из `.env` файла.

## Запуск тестов

### Основные команды

Запуск всех тестов:
```bash
npm test
```

Запуск тестов с видимым браузером:
```bash
npm run test:headed
```

Запуск тестов в UI режиме (с интерактивным интерфейсом):
```bash
npm run test:ui
```

Запуск тестов в режиме отладки:
```bash
npm run test:debug
```

### Запуск в конкретных браузерах

Chrome:
```bash
npm run test:chrome
```

Firefox:
```bash
npm run test:firefox
```

Safari:
```bash
npm run test:webkit
```

### Запуск конкретных тестов

Запуск тестов из конкретной папки:
```bash
npx playwright test tests/auth
```

Запуск конкретного файла:
```bash
npx playwright test tests/auth/login.spec.ts
```

Запуск тестов по названию:
```bash
npx playwright test -g "should successfully login"
```

## Просмотр отчетов

После выполнения тестов откройте HTML отчет:
```bash
npm run report
```

## Написание тестов

### Базовый пример теста

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Kompot/);
  });
});
```

### Использование Page Objects

```typescript
import { test, expect } from '../../fixtures/auth.fixture';

test('should login successfully', async ({ loginPage, homePage }) => {
  await loginPage.goto();
  await loginPage.login('workspace', 'email@test.com', 'password');

  const isLoggedIn = await homePage.isLoggedIn();
  expect(isLoggedIn).toBeTruthy();
});
```

### Использование authenticated fixture

Для тестов, требующих авторизации:

```typescript
import { test, expect } from '../../fixtures/auth.fixture';

test('should access protected page', async ({ authenticatedPage, page }) => {
  // Пользователь уже авторизован
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/dashboard/);
});
```

## Генерация тестов

Playwright предоставляет инструмент для записи действий и генерации кода:

```bash
npm run codegen
```

Это откроет браузер и панель для записи ваших действий.

## Отладка тестов

### Пошаговая отладка

```bash
npm run test:debug
```

### Использование Playwright Inspector

```bash
npx playwright test --debug
```

### Просмотр трассировки

Если тест упал, откройте трассировку:
```bash
npx playwright show-trace test-results/path-to-trace.zip
```

## Best Practices

1. **Используйте Page Objects** - инкапсулируйте логику работы со страницей
2. **Не дублируйте селекторы** - храните их в Page Objects
3. **Используйте test.describe** для группировки связанных тестов
4. **Используйте beforeEach/afterEach** для подготовки и очистки данных
5. **Делайте тесты независимыми** - каждый тест должен работать отдельно
6. **Используйте явные ожидания** - не используйте sleep/timeout без необходимости
7. **Проверяйте важные элементы** - не только успешный сценарий, но и ошибки

## Переменные окружения

Все чувствительные данные хранятся в `.env` файле:

- `BASE_URL` - базовый URL приложения
- `WORKSPACE_ID` - ID рабочего пространства для тестов
- `TEST_USER_EMAIL` - email тестового пользователя
- `TEST_USER_PASSWORD` - пароль тестового пользователя

## CI/CD

Тесты готовы для запуска в CI/CD. Пример для GitHub Actions:

```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      - name: Run tests
        run: npm test
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
          WORKSPACE_ID: ${{ secrets.WORKSPACE_ID }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Полезные ссылки

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)

## Поддержка

При возникновении проблем:
1. Проверьте, что все зависимости установлены
2. Убедитесь, что `.env` файл заполнен корректно
3. Проверьте, что браузеры Playwright установлены
4. Посмотрите логи и трассировку тестов
